/**
 * Next.js sunucu açılış kancası. Yalnızca Node çalışma zamanında (Edge/middleware değil) ve derleme dışında
 * uygulama içi zamanlayıcıyı başlatır: havale süresi takibi + veritabanı yedeği (lib/scheduler.ts).
 * İçe aktarma doğrudan NEXT_RUNTIME koşulunun içinde kalmalı: Edge derlemesi bu dalı atar, `fs`/Prisma oraya girmez.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      const { startInternalScheduler } = await import('./lib/scheduler')
      startInternalScheduler()
    }
  }
}
