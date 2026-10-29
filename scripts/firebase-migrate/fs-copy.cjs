// Firestore kopyalama: eticaret-54bdc → voltekno-eticaret (tüm koleksiyonlar ve alt koleksiyonlar, yollar aynı).
// Kullanım: node fs-copy.cjs            → yalnızca sayım (kuru çalışma)
//           node fs-copy.cjs --apply    → kopyalar; hedefte zaten olan belgeye dokunmaz (create), çakışmaları raporlar
//           node fs-copy.cjs --apply --overwrite → son eşitleme: hedefteki aynı yollu belgeleri eski projedekiyle değiştirir (set)
// Kaynak: eski projenin servis hesabı (.env.eticaret-54bdc.local). Hedef: firebase CLI oturumu (kullanıcı kimliği).
const fs = require('fs')
const os = require('os')
const path = require('path')
const PROJECT = path.resolve(__dirname, '../..')
const TMP = path.join(require('os').tmpdir(), 'voltekno-fbmig')
require('fs').mkdirSync(TMP, { recursive: true })
const { Firestore, DocumentReference } = require(path.join(PROJECT, 'node_modules/@google-cloud/firestore'))
const APPLY = process.argv.includes('--apply')
const OVERWRITE = process.argv.includes('--overwrite')

function readEnv(file) {
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

const oldEnv = readEnv(path.join(PROJECT, '.env.eticaret-54bdc.local'))
const src = new Firestore({
  projectId: oldEnv.FIREBASE_ADMIN_PROJECT_ID,
  credentials: { client_email: oldEnv.FIREBASE_ADMIN_CLIENT_EMAIL, private_key: oldEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n') },
})

const store = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'))
const api = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/api'))
const dst = new Firestore({
  projectId: 'voltekno-eticaret',
  credentials: {
    type: 'authorized_user',
    client_id: api.clientId(),
    client_secret: api.clientSecret(),
    refresh_token: store.tokens.refresh_token,
    quota_project_id: 'voltekno-eticaret',
  },
})

// Eski projeye işaret eden belge referanslarını yeni projedeki aynı yola çevir
function remap(v) {
  if (v instanceof DocumentReference) return dst.doc(v.path)
  if (Array.isArray(v)) return v.map(remap)
  if (v && typeof v === 'object' && v.constructor === Object) {
    const o = {}
    for (const [k, x] of Object.entries(v)) o[k] = remap(x)
    return o
  }
  return v
}

const stats = {} // koleksiyon yolu (id'siz) → { src, created, conflict, dstExisting }
const key = (colRef) => colRef.path.split('/').filter((_, i) => i % 2 === 0).join('/')

async function walk(colRef) {
  const k = key(colRef)
  stats[k] ??= { src: 0, created: 0, conflict: 0 }
  const snap = await colRef.get()
  for (const doc of snap.docs) {
    stats[k].src++
    if (APPLY) {
      try {
        if (OVERWRITE) await dst.doc(doc.ref.path).set(remap(doc.data()))
        else await dst.doc(doc.ref.path).create(remap(doc.data()))
        stats[k].created++
      } catch (e) {
        if (e.code === 6) stats[k].conflict++ // ALREADY_EXISTS
        else throw new Error(`${doc.ref.path}: ${e.message}`)
      }
    }
    for (const sub of await doc.ref.listCollections()) await walk(sub)
  }
}

async function countDst(colRef, acc) {
  const k = key(colRef)
  const snap = await colRef.get()
  acc[k] = (acc[k] || 0) + snap.size
  for (const doc of snap.docs) for (const sub of await doc.ref.listCollections()) await countDst(sub, acc)
}

;(async () => {
  const before = {}
  for (const c of await dst.listCollections()) await countDst(c, before)
  for (const c of await src.listCollections()) await walk(c)
  const after = {}
  if (APPLY) for (const c of await dst.listCollections()) await countDst(c, after)
  const rows = Object.keys({ ...stats, ...before }).sort()
  console.log((APPLY ? 'UYGULANDI' : 'KURU ÇALIŞMA') + '\nkoleksiyon | eski | yeni (önce)' + (APPLY ? ' | oluşturulan | çakışma | yeni (sonra)' : ''))
  for (const k of rows) {
    const s = stats[k] || { src: 0, created: 0, conflict: 0 }
    console.log(`${k} | ${s.src} | ${before[k] || 0}` + (APPLY ? ` | ${s.created} | ${s.conflict} | ${after[k] || 0}` : ''))
  }
})().catch((e) => {
  console.log('HATA:', e.message)
  process.exit(1)
})
