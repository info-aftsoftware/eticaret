"""
ikas ürün dışa aktarım Excel'ini (.xlsx) site kataloğuna dönüştürür.

Kullanım:
  python scripts/import-ikas-excel.py <excel.xlsx>

Üretilen dosyalar:
  lib/catalog/products.json      – hafif katalog (liste, filtre, sepet; istemciye de gider)
  lib/catalog/product-details.json – özellikler, döviz fiyatı, ölçü/desi, SEO başlığı (yalnızca sunucu)
  lib/catalog/descriptions.json  – ürün id -> HTML açıklama (yalnızca sunucuda yüklenir)
  lib/catalog/fx-snapshot.json   – TCMB kur anlık görüntüsü (API'siz/statik ortam yedeği)

Görseller: public/images/products/voltekno/<driveId>.<ext> altında aranır;
eksik olanlar Google Drive'dan indirilir.

Yalnızca Python standart kütüphanesi kullanılır.
"""
import html, json, math, os, re, sys, time, zipfile, urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'lib', 'catalog')
IMG_DIR = os.path.join(ROOT, 'public', 'images', 'products', 'voltekno')
IMG_URL = '/images/products/voltekno'
PLACEHOLDER = '/images/products/placeholder.png'
M = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

COL_GROUP = 'Ürün Grup ID'
COL_NAME = 'İsim'
COL_SEO_NAME = 'SEO Uyumlu İsim'
COL_USD = 'Satış Fiyatı USD (%20 kârlı)'
COL_EUR = 'Satış Fiyatı EUR (%20 kârlı)'
COL_DESC = 'Açıklama'
COL_SKU = 'SKU'
COL_DELETED = 'Silindi mi?'
COL_BRAND = 'Marka'
COL_CATS = 'Kategoriler'
COL_TAGS = 'Etiketler'
COL_IMG = 'Resim URL'
COL_META_TITLE = 'Metadata Başlık'
COL_META_DESC = 'Metadata Açıklama'
COL_SLUG = 'Slug'
COL_STOCK = 'Stok:Ana Depo'
COL_VARIANT_VALUE = 'Varyant Değer 1'
COL_CHANNEL = 'Satış Kanalı:voltekno'
COL_VARIANT_ACTIVE = 'Varyant Aktiflik'


def read_xlsx(path):
    z = zipfile.ZipFile(path)
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(M + 'si'):
            ss.append(''.join(t.text or '' for t in si.iter(M + 't')))

    def col(ref):
        n = 0
        for ch in re.match(r'[A-Z]+', ref).group():
            n = n * 26 + ord(ch) - 64
        return n - 1

    rows = ET.fromstring(z.read('xl/worksheets/sheet1.xml')).find(M + 'sheetData').findall(M + 'row')
    table = []
    for r in rows:
        vals = {}
        for c in r.findall(M + 'c'):
            v = c.find(M + 'v')
            is_ = c.find(M + 'is')
            if v is not None:
                x = v.text
            elif is_ is not None:
                x = ''.join(t.text or '' for t in is_.iter(M + 't'))
            else:
                x = None
            if c.get('t') == 's' and x is not None:
                x = ss[int(x)]
            vals[col(c.get('r'))] = x
        table.append(vals)
    header = [table[0].get(i) for i in range(max(table[0]) + 1)]
    out = []
    for row in table[1:]:
        rec = {}
        for i, h in enumerate(header):
            val = row.get(i)
            rec[h] = val.strip() if isinstance(val, str) else ''
        out.append(rec)
    return out


def fetch_tcmb():
    """1 USD/EUR kaç TL (TCMB döviz satış)."""
    req = urllib.request.Request('https://www.tcmb.gov.tr/kurlar/today.xml', headers={'User-Agent': 'Mozilla/5.0'})
    xml = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')
    out = {}
    for code in ('USD', 'EUR'):
        m = re.search(r'Kod="%s"[\s\S]*?<ForexSelling>([\d.,]+)<' % code, xml)
        out[code] = float(m.group(1).replace(',', '.'))
    return out


EXT = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif'}


def local_image(drive_id):
    for e in EXT.values():
        if os.path.exists(os.path.join(IMG_DIR, f'{drive_id}.{e}')):
            return f'{IMG_URL}/{drive_id}.{e}'
    try:
        req = urllib.request.Request(f'https://drive.google.com/uc?export=download&id={drive_id}', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            ct = (r.headers.get('Content-Type') or '').split(';')[0].strip()
            data = r.read()
        if ct in EXT:
            os.makedirs(IMG_DIR, exist_ok=True)
            with open(os.path.join(IMG_DIR, f'{drive_id}.{EXT[ct]}'), 'wb') as f:
                f.write(data)
            return f'{IMG_URL}/{drive_id}.{EXT[ct]}'
    except Exception as ex:  # noqa: BLE001
        print(f'  ! görsel indirilemedi {drive_id}: {ex}')
    return None


def images_of(row, missing):
    out = []
    for u in row[COL_IMG].split(';'):
        m = re.search(r'id=([\w-]+)', u.strip())
        if not m:
            continue
        p = local_image(m.group(1))
        if p:
            if p not in out:
                out.append(p)
        else:
            missing.append((row[COL_SKU], m.group(1)))
    return out


def sanitize_html(s):
    s = re.sub(r'<\s*(script|style|iframe|object|embed|form)\b[\s\S]*?<\s*/\s*\1\s*>', '', s, flags=re.I)
    s = re.sub(r'<\s*/?\s*(script|style|iframe|object|embed|form|input|button)\b[^>]*>', '', s, flags=re.I)
    s = re.sub(r'\s+on[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)', '', s, flags=re.I)
    s = re.sub(r'(href|src)\s*=\s*(["\'])\s*javascript:[^"\']*\2', r'\1="#"', s, flags=re.I)

    def fix_a(m):
        tag = re.sub(r'\s(target|rel)\s*=\s*("[^"]*"|\'[^\']*\')', '', m.group(0), flags=re.I)
        return tag[:-1] + ' target="_blank" rel="noopener noreferrer">'
    s = re.sub(r'<a\b[^>]*>', fix_a, s, flags=re.I)
    # Geniş tablolar mobilde kendi kutusunda yatay kaydırılsın
    s = re.sub(r'<table\b', '<div class="pd-table"><table', s, flags=re.I)
    s = re.sub(r'</table\s*>', '</table></div>', s, flags=re.I)
    return s.strip()


def price_of(row):
    if row[COL_USD]:
        return 'USD', round(float(row[COL_USD].replace(',', '.')), 2)
    if row[COL_EUR]:
        return 'EUR', round(float(row[COL_EUR].replace(',', '.')), 2)
    raise ValueError('Fiyat yok: ' + row[COL_SKU])


def variant_key(sku):
    # Sepet id'si `${productId}-${variantKey}` olduğundan anahtar tire içermez
    return re.sub(r'[^a-z0-9]', '', sku.lower())


def strip_brand_suffix(title):
    return re.sub(r'\s*\|\s*Voltekno\s*$', '', title, flags=re.I).strip()


def ceil_try(value):
    """TL fiyat tam TL'ye yukarı yuvarlanır (lib/fx-rates.ts toTry ile aynı kural)."""
    return float(math.ceil(value - 1e-9))


# ---------------------------------------------------------------------------
# Kategori düzeltmeleri: Excel'de yanlış/genel kategoride duran ürünler.
# (ürün adı regex'i, mevcut kategori koşulu (None = her kategori), yeni alt kategori)
# Yeni alt kategoriler lib/categories.ts CATEGORY_GROUPS içinde tanımlı olmalıdır.
CATEGORY_CORRECTIONS = [
    (r'Isı Pompası', None, 'Isı Pompası'),
    (r'Taşınabilir Güç İstasyonu', 'Genel', 'Taşınabilir Güç İstasyonu'),
    (r'İnverter', 'Genel', 'İnverter'),
    (r'Şarj Kontrol Cihazı|MiniSolar|Harici Ekran', 'Genel', 'MPPT/PWM'),
    (r'DC-DC Şarj', 'Genel', 'AC/DC Şarj'),
    (r'Transfer Switch|Shunt', 'Genel', 'Sistem Bileşenleri'),
    (r'^İstabreeze', 'Genel', 'Türbin ve Aksesuar'),
    (r'^Victron', 'Genel', 'İzleme ve Kontrol'),
]


def corrected_category(name, category):
    for pattern, only_from, target in CATEGORY_CORRECTIONS:
        if (only_from is None or only_from == category) and re.search(pattern, name):
            return target
    return category


def variant_labels(rows):
    """Varyant etiketleri: SEO adlarının ortak ön ekini atarak farklılaşan kısım (ör. '40Wp TOPCon 36TN10 Güneş Paneli').
    Excel'deki 'Varyant Değer 1' tutarsız olduğundan (ör. 'kWh - EXELON-ELH12-00535') SEO adı esas alınır."""
    names = [(x[COL_SEO_NAME] or x[COL_VARIANT_VALUE] or x[COL_SKU]).split() for x in rows]
    prefix = 0
    while all(len(t) > prefix + 1 for t in names) and len({t[prefix] for t in names}) == 1:
        prefix += 1
    labels = [' '.join(t[prefix:]) for t in names]
    if len(set(labels)) != len(labels) or any(len(label) < 2 for label in labels):
        labels = [x[COL_SEO_NAME] or x[COL_VARIANT_VALUE] or x[COL_SKU] for x in rows]
    return labels


# ---------------------------------------------------------------------------
# Açıklama tabloları → teknik özellikler, ölçü ve ağırlık

def cell_text(s):
    return html.unescape(re.sub(r'<[^>]+>', ' ', s)).replace('\xa0', ' ').replace('−', '-').strip()


def parse_tables(desc):
    """HTML açıklamadaki tablolar: [[hücre, ...], ...] listesi (ilk satır başlık olabilir)."""
    out = []
    for t in re.findall(r'<table.*?</table>', desc, re.S | re.I):
        rows = []
        for r in re.findall(r'<tr.*?</tr>', t, re.S | re.I):
            cells = [re.sub(r'\s+', ' ', cell_text(c)) for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', r, re.S | re.I)]
            if cells:
                rows.append(cells)
        if rows:
            out.append(rows)
    return out


def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower().replace('ı', 'i').replace(',', '.').replace('.', ''))


def match_row_to_variant(row_key, variants_text):
    """Model tablosundaki satırı varyanta eşler: satırın ilk hücresinin parçalarından en çoğunu içeren varyant."""
    parts = [norm(p) for p in re.split(r'[\s/()]+', row_key) if len(norm(p)) >= 2]
    whole = norm(row_key)
    best, best_score, tie = None, 0, False
    for i, text in enumerate(variants_text):
        score = (10 if whole and whole in text else 0) + sum(1 for p in parts if p in text)
        if score > best_score:
            best, best_score, tie = i, score, False
        elif score == best_score and score > 0:
            tie = True
    return None if tie or best_score == 0 else best


def extract_specs(desc, variants_text):
    """(ürün özellikleri, varyant indeksine göre özellikler)."""
    product_specs, by_variant = {}, {}
    for t in parse_tables(desc):
        if all(len(r) <= 2 for r in t):
            # Anahtar/değer tablosu; tek hücreli satırlar ara başlıktır ("Genel", "200Wp Model Teknik Değerleri").
            # Ara başlık bir varyantı işaret ediyorsa altındaki satırlar o varyanta aittir.
            target = product_specs
            for r in t:
                if len(r) == 1:
                    i = match_row_to_variant(r[0], variants_text) if variants_text else None
                    target = by_variant.setdefault(i, {}) if i is not None else product_specs
                    continue
                k, v = r
                if k and v and k.lower() not in ('özellik', 'parametre') and k not in target:
                    target[k] = v
            continue
        header, body = t[0], t[1:]
        if len(header) < 2 or not body:
            continue
        if not variants_text:
            if len(body) == 1:
                for k, v in zip(header, body[0]):
                    if k and v:
                        product_specs.setdefault(k, v)
            continue
        for r in body:
            i = match_row_to_variant(r[0], variants_text)
            if i is None:
                continue
            specs = by_variant.setdefault(i, {})
            for k, v in zip(header, r):
                if k and v:
                    specs.setdefault(k, v)
    return product_specs, by_variant


DIM_KEY = re.compile(r'boyut|ölçü|ebat|dimension|^\s*(en|boy)\s*[x×]', re.I)
WEIGHT_KEY = re.compile(r'ağırlı|weight', re.I)


def parse_dims_cm(value):
    """'1722 × 1134 × 30 mm' → [172.2, 113.4, 3.0] (cm). Üç ölçü yoksa None."""
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(mm|cm|m)\b', value, re.I)
    if not m:
        return None
    nums = [float(n.replace(',', '.')) for n in m.groups()[:3]]
    unit = m.group(4).lower()
    factor = {'mm': 0.1, 'cm': 1.0, 'm': 100.0}[unit]
    return [round(n * factor, 1) for n in nums]


def parse_weight_kg(value):
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(kg|g)\b', value, re.I)
    if not m:
        return None
    n = float(m.group(1).replace(',', '.'))
    return round(n / 1000 if m.group(2).lower() == 'g' else n, 3)


def pick_logistics(specs):
    """Özellik sözlüğünden kargo için ölçü (cm) ve ağırlık (kg). Katlanır ürünlerde kapalı/ambalaj ölçüsü tercih edilir."""
    dims_candidates, weights = [], []
    for k, v in specs.items():
        if DIM_KEY.search(k):
            d = parse_dims_cm(v)
            if d:
                priority = 0 if re.search(r'ambalaj|paket|kutu|kapalı|katlanmış', k, re.I) else (2 if re.search(r'açık', k, re.I) else 1)
                dims_candidates.append((priority, d))
        if WEIGHT_KEY.search(k):
            w = parse_weight_kg(v)
            if w:
                weights.append((0 if re.search(r'brüt|ambalaj|paket', k, re.I) else 1, w))
    dims = sorted(dims_candidates)[0][1] if dims_candidates else None
    weight = sorted(weights)[0][1] if weights else None
    return dims, weight


def desi_of(dims_cm, weight_kg, parcels=None):
    """Kargo desisi: max(en×boy×yükseklik (cm) / 3000, ağırlık kg), yukarı yuvarlanmış tam sayı (en az 1).
    Ölçü bilinmiyorsa desi hesaplanmaz (yalnızca ağırlıkla hesaplanan desi hacimli ürünlerde eksik çıkar).
    Birden çok koliyle gönderilen ürün: parcels=[{dimsCm, weightKg?}] → kolilerin hacim desisi toplamı ile toplam ağırlığın büyüğü."""
    if parcels:
        vol = sum(p['dimsCm'][0] * p['dimsCm'][1] * p['dimsCm'][2] / 3000 for p in parcels)
        total_w = weight_kg or sum(p.get('weightKg') or 0 for p in parcels)
        return max(1, math.ceil(max(vol, total_w) - 1e-9))
    if not dims_cm:
        return None
    vol = dims_cm[0] * dims_cm[1] * dims_cm[2] / 3000
    return max(1, math.ceil(max(vol, weight_kg or 0) - 1e-9))


def load_logistics_overrides():
    """SKU → {dimsCm, weightKg, source}: üretici kaynaklarından araştırılan ölçüler.
    scripts/data/logistics-research/*.result.json (araştırma) + scripts/data/product-logistics.json (elle düzeltme, öncelikli)."""
    data = {}
    research_dir = os.path.join(ROOT, 'scripts', 'data', 'logistics-research')
    if os.path.isdir(research_dir):
        for name in sorted(os.listdir(research_dir)):
            if name.endswith('.result.json'):
                with open(os.path.join(research_dir, name), encoding='utf-8') as f:
                    data.update(json.load(f))
    manual = os.path.join(ROOT, 'scripts', 'data', 'product-logistics.json')
    if os.path.exists(manual):
        with open(manual, encoding='utf-8') as f:
            for sku, value in json.load(f).items():
                data[sku] = {**data.get(sku, {}), **value}
    return data


def apply_logistics(target, specs, override):
    """Açıklamadaki ölçü/ağırlık öncelikli; eksik olan alan araştırma verisinden tamamlanır.
    desiSource: description | package | product | series | manual (ölçünün kaynağı). True: ölçü ve ağırlık tam."""
    if override and override.get('noShipping'):
        # Dijital ürün (yazılım lisansı vb.): kargo gönderilmez
        target['desi'] = 0
        target['desiSource'] = 'no-shipping'
        return True
    dims, weight = pick_logistics(specs)
    source = 'description' if dims else None
    parcels = None
    if override:
        if override.get('parcels'):
            parcels = override['parcels']
            dims = dims or parcels[0]['dimsCm']
            source = 'manual'
        if not dims and override.get('dimsCm'):
            dims, source = override['dimsCm'], override.get('basis') or 'research'
        if not weight and override.get('weightKg'):
            weight = override['weightKg']
    desi = desi_of(dims, weight, parcels)
    if dims:
        target['dimensionsCm'] = dims
    if weight:
        target['weightKg'] = weight
    if desi:
        target['desi'] = desi
        target['desiSource'] = source
    return bool(dims and weight)


def main():
    # Windows konsolunda (cp1254) Türkçe dışı karakterler hata vermesin
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if len(sys.argv) < 2:
        sys.exit('Kullanım: python scripts/import-ikas-excel.py <excel.xlsx>')
    rows = read_xlsx(sys.argv[1])
    rows = [
        r for r in rows
        if r[COL_SKU]
        and r[COL_DELETED].lower() not in ('1', 'true', 'evet')
        and r[COL_CHANNEL] in ('', 'VISIBLE')
        and r[COL_VARIANT_ACTIVE] not in ('0', 'false')
    ]
    print(f'{len(rows)} satır okundu')

    try:
        fx = fetch_tcmb()
        fx_date = time.strftime('%Y-%m-%d')
    except Exception as ex:  # noqa: BLE001
        with open(os.path.join(OUT_DIR, 'fx-snapshot.json'), encoding='utf-8') as f:
            prev = json.load(f)
        fx, fx_date = {'USD': prev['USD'], 'EUR': prev['EUR']}, prev['date']
        print(f'TCMB alınamadı ({ex}); önceki kur kullanılıyor')
    print(f'Kur: 1 USD = {fx["USD"]} TL, 1 EUR = {fx["EUR"]} TL ({fx_date})')

    groups, order = {}, []
    for r in rows:
        key = r[COL_GROUP] or ('SKU::' + r[COL_SKU])
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(r)

    logistics = load_logistics_overrides()
    products, descriptions, missing, ids = [], {}, [], set()
    missing_logistics = []
    featured_categories = set()
    for key in order:
        g = groups[key]
        head = g[0]
        pid = head[COL_SLUG] or variant_key(head[COL_SKU])
        if pid in ids:
            raise ValueError('Tekrarlanan ürün id/slug: ' + pid)
        ids.add(pid)
        currencies = {price_of(x)[0] for x in g}
        if len(currencies) > 1:
            raise ValueError(pid + ': varyantlarda farklı para birimi')
        currency = currencies.pop()
        parent, _, child = head[COL_CATS].partition('>')
        is_variant = len(g) > 1 or bool(head[COL_GROUP])

        def to_try(base):
            return ceil_try(base * fx[currency])

        if is_variant and head[COL_META_TITLE]:
            name = strip_brand_suffix(head[COL_META_TITLE])
        else:
            name = head[COL_SEO_NAME] or head[COL_NAME]
        category = corrected_category(name, (child or parent).strip())
        desc_html = sanitize_html(head[COL_DESC])
        p = {
            'id': pid,
            'sku': head[COL_SKU],
            'name': name,
            'description': head[COL_META_DESC],
            'metaTitle': head[COL_META_TITLE] or None,
            'priceCurrency': currency,
            'category': category,
            'brand': head[COL_BRAND] or None,
            'tags': [t.strip() for t in head[COL_TAGS].split(',') if t.strip()],
            'stock': int(float(head[COL_STOCK] or 0)),
            'featured': False,
            'isVariantProduct': is_variant,
        }
        if is_variant:
            variants, by_variant = [], []
            labels = variant_labels(g)
            variants_text = [norm(' '.join([labels[i], x[COL_SKU], x[COL_SEO_NAME], x[COL_VARIANT_VALUE]])) for i, x in enumerate(g)]
            product_specs, specs_by_variant = extract_specs(desc_html, variants_text)
            for i, x in enumerate(g):
                _, base = price_of(x)
                v = {
                    'key': variant_key(x[COL_SKU]),
                    'label': labels[i],
                    'sku': x[COL_SKU],
                    'basePrice': base,
                    'price': to_try(base),
                }
                vspecs = specs_by_variant.get(i)
                if vspecs:
                    v['specifications'] = vspecs
                # Varyantın kendi model satırı yoksa, ürünün ortak özellikleri ölçü/ağırlık için kullanılabilir
                # yalnızca tek ölçü verilmişse (tüm varyantlar için ortak kasa)
                if not apply_logistics(v, vspecs or {}, logistics.get(x[COL_SKU])):
                    if not apply_logistics(v, product_specs, logistics.get(x[COL_SKU])):
                        missing_logistics.append({'sku': x[COL_SKU], 'name': x[COL_SEO_NAME], 'brand': head[COL_BRAND], 'productId': pid, 'has': {k: v.get(k) for k in ('dimensionsCm', 'weightKg')}})
                variants.append(v)
                by_variant.append(images_of(x, missing))
            if product_specs:
                p['specifications'] = product_specs
            if len({v['key'] for v in variants}) != len(variants):
                raise ValueError(pid + ': tekrarlanan varyant anahtarı')
            # Görseli olmayan varyant, ürünün ilk görselini kullanır
            fallback = next((i for i in by_variant if i), [PLACEHOLDER])
            by_variant = [i or fallback for i in by_variant]
            p['variants'] = variants
            p['imagesByVariant'] = by_variant
            p['defaultVariantKey'] = variants[0]['key']
            p['basePrice'] = variants[0]['basePrice']
            p['price'] = variants[0]['price']
            p['images'] = by_variant[0]
            # Varyantlar ürün stoğunu paylaşır (sipariş fiyatlandırması da böyle kontrol eder)
            p['stock'] = max(int(float(x[COL_STOCK] or 0)) for x in g)
            # Ürün düzeyinde ölçü/desi: varsayılan varyantınki (liste ve akışlar için)
            for k in ('dimensionsCm', 'weightKg', 'desi'):
                if k in variants[0]:
                    p[k] = variants[0][k]
        else:
            _, base = price_of(head)
            p['basePrice'] = base
            p['price'] = to_try(base)
            p['images'] = images_of(head, missing) or [PLACEHOLDER]
            product_specs, _ = extract_specs(desc_html, [])
            if product_specs:
                p['specifications'] = product_specs
            if not apply_logistics(p, product_specs, logistics.get(head[COL_SKU])):
                missing_logistics.append({'sku': head[COL_SKU], 'name': name, 'brand': head[COL_BRAND], 'productId': pid, 'has': {k: p.get(k) for k in ('dimensionsCm', 'weightKg')}})
        p['image'] = p['images'][0]
        # Ana sayfa "öne çıkanlar" için her kategoriden görselli ilk ürün
        if category not in featured_categories and p['image'] != PLACEHOLDER:
            featured_categories.add(category)
            p['featured'] = True
        products.append({k: v for k, v in p.items() if v is not None})
        descriptions[pid] = desc_html

    # Görseli hiç olmayan ürünler: aynı marka ve kategorideki en benzer adlı ürünün görseli (aynı seri/parça ailesi)
    def name_tokens(s):
        return {t for t in re.split(r'[^0-9a-zçğıöşü]+', s.lower()) if len(t) > 1}
    for p in products:
        if p['image'] != PLACEHOLDER:
            continue
        candidates = [q for q in products if q is not p and q['image'] != PLACEHOLDER and q.get('brand') == p.get('brand') and q['category'] == p['category']]
        if candidates:
            best = max(candidates, key=lambda q: len(name_tokens(q['name']) & name_tokens(p['name'])))
            p['images'] = [best['image']]
            p['image'] = best['image']
            if 'imagesByVariant' in p:
                p['imagesByVariant'] = [[best['image']] if i == [PLACEHOLDER] else i for i in p['imagesByVariant']]
            print(f'Görselsiz ürün "{p["name"]}" için benzer ürün görseli kullanıldı: {best["name"]}')

    # İstemciye giden hafif katalog / yalnızca sunucuda yüklenen ayrıntılar.
    # products.json her sayfanın JS paketine girdiğinden (başlık menüsü, öneriler) özellikler, döviz fiyatı,
    # ölçü/desi ve SEO başlığı product-details.json'a ayrılır; sunucu (lib/catalog-details.ts) ikisini birleştirir.
    detail_keys = ('specifications', 'basePrice', 'metaTitle', 'dimensionsCm', 'weightKg', 'desi', 'desiSource')
    variant_detail_keys = ('specifications', 'basePrice', 'dimensionsCm', 'weightKg', 'desi', 'desiSource')
    lite, details = [], {}
    for p in products:
        d = {k: p[k] for k in detail_keys if k in p}
        lp = {k: v for k, v in p.items() if k not in detail_keys}
        if p.get('variants'):
            d['variants'] = {v['key']: {k: v[k] for k in variant_detail_keys if k in v} for v in p['variants']}
            lp['variants'] = [{k: val for k, val in v.items() if k not in variant_detail_keys} for v in p['variants']]
        lite.append(lp)
        details[p['id']] = d

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, 'products.json'), 'w', encoding='utf-8') as f:
        json.dump(lite, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT_DIR, 'product-details.json'), 'w', encoding='utf-8') as f:
        json.dump(details, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT_DIR, 'descriptions.json'), 'w', encoding='utf-8') as f:
        json.dump(descriptions, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT_DIR, 'fx-snapshot.json'), 'w', encoding='utf-8') as f:
        json.dump({'USD': fx['USD'], 'EUR': fx['EUR'], 'date': fx_date, 'source': 'TCMB ForexSelling'}, f, indent=2)
        f.write('\n')

    print(f'{len(products)} ürün, {sum(len(p.get("variants", [])) for p in products)} varyant yazıldı')
    if missing:
        print(f'{len(missing)} görsel indirilemedi (Drive dosyası yok/erişilemiyor):')
        for sku, i in missing:
            print(f'  - {sku}: {i}')
    no_img = [p['id'] for p in products if p['image'] == PLACEHOLDER]
    if no_img:
        print(f'Görseli olmayan {len(no_img)} ürün placeholder ile eklendi: {", ".join(no_img)}')
    with_specs = sum(1 for p in products if p.get('specifications') or any(v.get('specifications') for v in p.get('variants', [])))
    print(f'Teknik özellik: {with_specs}/{len(products)} ürün')
    # SKU bazında desi raporu (Excel'de açılabilir; ; ayraçlı, UTF-8 BOM)
    report_path = os.path.join(ROOT, 'scripts', 'data', 'desi-raporu.csv')
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w', encoding='utf-8-sig', newline='') as f:
        f.write('SKU;Ürün;Varyant;Marka;Kategori;Ölçü (cm);Ağırlık (kg);Desi;Kaynak\n')
        for p in products:
            for v in p.get('variants') or [p]:
                dims = ' x '.join(f'{d:g}' for d in v.get('dimensionsCm', [])) if v.get('dimensionsCm') else ''
                cells = [v.get('sku') or p['sku'], p['name'], v.get('label', ''), p.get('brand', ''), p['category'],
                         dims, f"{v['weightKg']:g}" if v.get('weightKg') else '', str(v['desi']) if 'desi' in v else '',
                         v.get('desiSource', 'eksik')]
                f.write(';'.join(c.replace(';', ',') for c in cells) + '\n')
    missing_path = os.path.join(ROOT, 'scripts', 'data', 'missing-logistics.json')
    os.makedirs(os.path.dirname(missing_path), exist_ok=True)
    with open(missing_path, 'w', encoding='utf-8') as f:
        json.dump(missing_logistics, f, ensure_ascii=False, indent=1)
    print(f'Ölçü/ağırlık eksik {len(missing_logistics)} SKU → scripts/data/missing-logistics.json '
          f'(scripts/data/product-logistics.json ile tamamlanır)')


if __name__ == '__main__':
    main()
