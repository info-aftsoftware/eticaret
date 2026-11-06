import type { CategoryGroupContent } from '@/lib/seo/category-group-content'
import { PAGE_CONTAINER } from '@/lib/page-container'

/**
 * Ana kategori sayfasının rehber bölümü (sunucuda çizilir: Google ve yapay zekâ aramaları ilk HTML'de görür).
 * İçerik lib/seo/category-group-content.ts'ten; ürün listesinin ve tür bağlantılarının altında durur.
 * Metin sayfa genişliğinde akar (marka/tür sayfalarıyla aynı karar).
 */
export function CategoryGroupGuide({ title, content }: { title: string; content: CategoryGroupContent }) {
  return (
    <section aria-labelledby="category-guide-heading" className={`${PAGE_CONTAINER} pb-14`}>
      <div className="border-t border-[#eef1f5] pt-10">
        <h2 id="category-guide-heading" className="text-[22px] font-bold text-[#121926]">
          {title} seçim rehberi
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#3b4a5a]">{content.intro}</p>

        <div className="mt-8 space-y-8">
          {content.guide.map((s) => (
            <section key={s.heading}>
              <h3 className="text-[18px] font-semibold text-[#121926]">{s.heading}</h3>
              {s.body.split('\n\n').map((para, i) => (
                <p key={i} className="mt-2.5 text-[15px] leading-relaxed text-[#3b4a5a]">{para}</p>
              ))}
            </section>
          ))}
        </div>

        {content.faq.length > 0 && (
          <section className="mt-10">
            <h3 className="text-[18px] font-semibold text-[#121926]">Sık sorulan sorular</h3>
            <div className="mt-3 divide-y divide-[#eef1f5] border-y border-[#eef1f5]">
              {content.faq.map((f) => (
                <div key={f.q} className="py-4">
                  <h4 className="text-[15.5px] font-semibold text-[#121926]">{f.q}</h4>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#3b4a5a]">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  )
}
