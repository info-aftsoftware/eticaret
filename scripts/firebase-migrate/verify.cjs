// Doğrulama: (1) her belge eski ve yeni projede birebir aynı mı, (2) users/{uid} belgeleri Auth UID'leriyle eşleşiyor mu,
// (3) yeni projede Firestore ve Storage kuralları yüklü mü ve repodaki dosyayla aynı mı. Belge içeriği basmaz.
const fs = require('fs')
const os = require('os')
const path = require('path')
const PROJECT = path.resolve(__dirname, '../..')
const TMP = path.join(require('os').tmpdir(), 'voltekno-fbmig')
require('fs').mkdirSync(TMP, { recursive: true })
const { Firestore, Timestamp, DocumentReference, GeoPoint } = require(path.join(PROJECT, 'node_modules/@google-cloud/firestore'))

const readEnv = (file) => {
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}
const oldEnv = readEnv(path.join(PROJECT, '.env.eticaret-54bdc.local'))
const src = new Firestore({ projectId: oldEnv.FIREBASE_ADMIN_PROJECT_ID, credentials: { client_email: oldEnv.FIREBASE_ADMIN_CLIENT_EMAIL, private_key: oldEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n') } })
const store = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'))
const api = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/api'))
const userCreds = { type: 'authorized_user', client_id: api.clientId(), client_secret: api.clientSecret(), refresh_token: store.tokens.refresh_token, quota_project_id: 'voltekno-eticaret' }
const dst = new Firestore({ projectId: 'voltekno-eticaret', credentials: userCreds })

function eq(a, b) {
  if (a instanceof Timestamp) return b instanceof Timestamp && a.isEqual(b)
  if (a instanceof GeoPoint) return b instanceof GeoPoint && a.isEqual(b)
  if (a instanceof DocumentReference) return b instanceof DocumentReference && a.path === b.path
  if (Buffer.isBuffer(a)) return Buffer.isBuffer(b) && a.equals(b)
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => eq(x, b[i]))
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return false
    const ka = Object.keys(a).sort(), kb = Object.keys(b).sort()
    return ka.length === kb.length && ka.every((k, i) => k === kb[i] && eq(a[k], b[k]))
  }
  return a === b
}

let same = 0, diff = 0, missing = 0
async function walk(colRef) {
  for (const doc of (await colRef.get()).docs) {
    const d = await dst.doc(doc.ref.path).get()
    if (!d.exists) { missing++; console.log('EKSİK:', doc.ref.path.replace(/users\/[^/]+/, 'users/<uid>')) }
    else if (eq(doc.data(), d.data())) same++
    else { diff++; console.log('FARKLI:', doc.ref.path.replace(/users\/[^/]+/, 'users/<uid>')) }
    for (const sub of await doc.ref.listCollections()) await walk(sub)
  }
}

;(async () => {
  for (const c of await src.listCollections()) await walk(c)
  console.log(`belgeler → aynı: ${same}, farklı: ${diff}, eksik: ${missing}`)

  const authUids = new Set(JSON.parse(fs.readFileSync(path.join(TMP, 'new-users.json'), 'utf8')).users.map((u) => u.localId))
  const userDocs = (await dst.collection('users').get()).docs.map((d) => d.id)
  console.log(`users belgeleri Auth'ta: ${userDocs.filter((id) => authUids.has(id)).length}/${userDocs.length}`)

  // Kurallar
  const { OAuth2Client } = require(path.join(PROJECT, 'node_modules/google-auth-library'))
  const oc = new OAuth2Client(userCreds.client_id, userCreds.client_secret)
  oc.setCredentials({ refresh_token: userCreds.refresh_token })
  const { token } = await oc.getAccessToken()
  const h = { Authorization: `Bearer ${token}`, 'x-goog-user-project': 'voltekno-eticaret' }
  const rel = await fetch('https://firebaserules.googleapis.com/v1/projects/voltekno-eticaret/releases', { headers: h }).then((r) => r.json())
  for (const r of rel.releases || []) {
    const rs = await fetch(`https://firebaserules.googleapis.com/v1/${r.rulesetName}`, { headers: h }).then((x) => x.json())
    const content = (rs.source?.files || []).map((f) => f.content).join('\n')
    const local = r.name.includes('firebase.storage') ? 'storage.rules' : 'firestore.rules'
    const repo = fs.readFileSync(path.join(PROJECT, local), 'utf8')
    console.log(`kural ${r.name.split('/releases/')[1]} | güncelleme ${r.updateTime} | repodaki ${local} ile ${content.trim() === repo.trim() ? 'AYNI' : 'FARKLI'}`)
  }
  if (!(rel.releases || []).length) console.log('kural sürümü yok:', JSON.stringify(rel).slice(0, 200))
})().catch((e) => {
  console.log('HATA:', e.message)
  process.exit(1)
})
