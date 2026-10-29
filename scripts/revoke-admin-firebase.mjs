// Eski ortak yönetim kimliğinin (admin-panel-user) Firebase oturumlarını iptal eder: daha önce verilmiş yenileme
// belirteçleri çalışmaz olur. Kod artık bu kimliği üretmiyor; firestore.rules da yayınlanınca erişim tamamen kapanır.
//   FIREBASE_ADMIN_PROJECT_ID=… FIREBASE_ADMIN_CLIENT_EMAIL=… FIREBASE_ADMIN_PRIVATE_KEY=… node scripts/revoke-admin-firebase.mjs
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const { FIREBASE_ADMIN_PROJECT_ID: projectId, FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail, FIREBASE_ADMIN_PRIVATE_KEY: key } = process.env
if (!projectId || !clientEmail || !key) {
  console.error('FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL ve FIREBASE_ADMIN_PRIVATE_KEY gerekli')
  process.exit(1)
}
const auth = getAuth(initializeApp({ credential: cert({ projectId, clientEmail, privateKey: key.replace(/\\n/g, '\n') }) }))
const UID = 'admin-panel-user'
try {
  await auth.revokeRefreshTokens(UID)
  console.log(`${projectId}: ${UID} oturumları iptal edildi`)
} catch (e) {
  if (e?.code === 'auth/user-not-found') console.log(`${projectId}: ${UID} kimliği yok, iptal edilecek oturum yok`)
  else throw e
}
