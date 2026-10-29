// Eski projenin (eticaret-54bdc) şifre özeti parametrelerini alır.
// Gizli değerler (signerKey, saltSeparator) yalnızca hash-config.json dosyasına yazılır, ekrana basılmaz.
const fs = require('fs')
const path = require('path')
const PROJECT = path.resolve(__dirname, '../..')
const TMP = path.join(require('os').tmpdir(), 'voltekno-fbmig')
require('fs').mkdirSync(TMP, { recursive: true })
const { cert } = require(path.join(PROJECT, 'node_modules/firebase-admin/lib/app'))

function readEnv(file) {
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}

;(async () => {
  const env = readEnv(path.join(PROJECT, '.env.eticaret-54bdc.local'))
  const credential = cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
  const { access_token } = await credential.getAccessToken()
  const res = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${env.FIREBASE_ADMIN_PROJECT_ID}/config`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!res.ok) {
    console.log('HTTP', res.status, (await res.text()).slice(0, 300))
    process.exit(1)
  }
  const cfg = await res.json()
  const h = cfg.signIn && cfg.signIn.hashConfig
  if (!h) {
    console.log('hashConfig yok')
    process.exit(1)
  }
  fs.writeFileSync(path.join(TMP, 'hash-config.json'), JSON.stringify(h))
  console.log('algoritma:', h.algorithm, '| rounds:', h.rounds, '| memoryCost:', h.memoryCost, '| signerKey:', h.signerKey ? 'var' : 'yok', '| saltSeparator:', h.saltSeparator ? 'var' : 'yok')
})().catch((e) => {
  console.log('HATA:', e.message)
  process.exit(1)
})
