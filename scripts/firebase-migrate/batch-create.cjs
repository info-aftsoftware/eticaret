// Şifreli kullanıcıları aynı UID + SCRYPT özetleriyle yeni projeye yazar (accounts:batchCreate, allowOverwrite).
// Ardından accounts:lookup ile şifrenin kayıtlı olduğunu (passwordUpdatedAt) doğrular. Gizli değer basmaz.
const fs = require('fs')
const os = require('os')
const path = require('path')
const PROJECT_ID = 'voltekno-eticaret'
const TMP = path.join(os.tmpdir(), 'voltekno-fbmig')

async function cliToken() {
  const store = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'))
  const api = require(path.join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/api'))
  const body = new URLSearchParams({
    refresh_token: store.tokens.refresh_token,
    client_id: api.clientId(),
    client_secret: api.clientSecret(),
    grant_type: 'refresh_token',
  })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body })
  const j = await r.json()
  if (!j.access_token) throw new Error('token alınamadı')
  return j.access_token
}

;(async () => {
  const h = JSON.parse(fs.readFileSync(path.join(TMP, 'hash-config.json'), 'utf8'))
  const users = JSON.parse(fs.readFileSync(path.join(TMP, 'old-users.json'), 'utf8')).users.filter((u) => u.passwordHash)
  const token = await cliToken()
  const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': PROJECT_ID, 'Content-Type': 'application/json' }

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:batchCreate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      hashAlgorithm: 'SCRYPT',
      signerKey: h.signerKey,
      saltSeparator: h.saltSeparator,
      rounds: h.rounds,
      memoryCost: h.memoryCost,
      allowOverwrite: true,
      sanityCheck: true,
      users: users.map((u) => ({
        localId: u.localId,
        email: u.email,
        emailVerified: !!u.emailVerified,
        passwordHash: u.passwordHash,
        salt: u.salt,
        createdAt: u.createdAt,
        lastLoginAt: u.lastSignedInAt,
      })),
    }),
  })
  const out = await res.json()
  console.log('batchCreate HTTP', res.status, '| hatalar:', JSON.stringify(out.error || out.error === undefined && (out.error ?? []) ) , JSON.stringify(out).includes('"error"') ? JSON.stringify(out).slice(0, 300) : '')

  const look = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ localId: users.map((u) => u.localId) }),
  }).then((r) => r.json())
  for (const u of look.users || []) {
    console.log(u.localId.slice(0, 6), '| şifre kayıtlı:', !!u.passwordUpdatedAt || !!u.passwordHash, '| sağlayıcılar:', (u.providerUserInfo || []).map((p) => p.providerId).join('+') || '(yok)')
  }
})().catch((e) => {
  console.log('HATA:', e.message)
  process.exit(1)
})
