"""
ikas ürün dışa aktarım Excel'ini (.xlsx) site kataloğuna dönüştürür.

Kullanım:
  python scripts/import-ikas-excel.py <excel.xlsx>

Üretilen dosyalar:
  lib/catalog/products.json      – hafif katalog (liste, filtre, sepet; istemciye de gider)
  lib/catalog/descriptions.json  – ürün id -> HTML açıklama (yalnızca sunucuda yüklenir)
  lib/catalog/fx-snapshot.json   – TCMB kur anlık görüntüsü (API'siz/statik ortam yedeği)

Görseller: public/images/products/voltekno/<driveId>.<ext> altında aranır;
eksik olanlar Google Drive'dan indirilir.

Yalnızca Python standart kütüphanesi kullanılır.
"""
import json, os, re, sys, time, zipfile, urllib.request
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


def main():
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

    products, descriptions, missing, ids = [], {}, [], set()
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
        category = (child or parent).strip()
        is_variant = len(g) > 1 or bool(head[COL_GROUP])

        def to_try(base):
            return round(base * fx[currency], 2)

        if is_variant and head[COL_META_TITLE]:
            name = strip_brand_suffix(head[COL_META_TITLE])
        else:
            name = head[COL_SEO_NAME] or head[COL_NAME]
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
            for x in g:
                _, base = price_of(x)
                variants.append({
                    'key': variant_key(x[COL_SKU]),
                    'label': x[COL_VARIANT_VALUE] or x[COL_SEO_NAME],
                    'sku': x[COL_SKU],
                    'basePrice': base,
                    'price': to_try(base),
                })
                by_variant.append(images_of(x, missing))
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
        else:
            _, base = price_of(head)
            p['basePrice'] = base
            p['price'] = to_try(base)
            p['images'] = images_of(head, missing) or [PLACEHOLDER]
        p['image'] = p['images'][0]
        # Ana sayfa "öne çıkanlar" için her kategoriden görselli ilk ürün
        if category not in featured_categories and p['image'] != PLACEHOLDER:
            featured_categories.add(category)
            p['featured'] = True
        products.append({k: v for k, v in p.items() if v is not None})
        descriptions[pid] = sanitize_html(head[COL_DESC])

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, 'products.json'), 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, separators=(',', ':'))
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


if __name__ == '__main__':
    main()
