/**
 * Sunucunun döndürdüğü Türkçe hata mesajlarının İngilizce karşılıkları (müşteri arayüzünde gösterilenler).
 * API'ler tek dilde (Türkçe) yanıt verir; İngilizce arayüzde mesaj buradan çevrilir. Karşılığı olmayan Türkçe mesaj
 * İngilizcede gösterilmez (undefined döner) ve çağıran taraf kendi genel İngilizce mesajına düşer.
 */
import { useLocale } from 'next-intl'

const EXACT: Record<string, string> = {
  'Belge oluşturulamadı': 'The document could not be generated',
  'Bir hata oluştu. Lütfen tekrar deneyin.': 'Something went wrong. Please try again.',
  'Bu kupon artık geçerli değil.': 'This coupon is no longer valid.',
  'Bu kupon henüz geçerli değil.': 'This coupon is not valid yet.',
  'Bu kuponun kullanım limiti dolmuş.': 'This coupon has reached its usage limit.',
  'Bu kuponun süresi dolmuş.': 'This coupon has expired.',
  'Bu sipariş için iade talebi oluşturulamıyor.': 'A return request cannot be created for this order.',
  'Bu sipariş için incelenmekte olan bir iade talebiniz zaten var.': 'You already have a return request under review for this order.',
  'Bu sipariş için iptal talebiniz zaten inceleniyor.': 'Your cancellation request for this order is already under review.',
  'Bu sipariş için ödeme bildirimi yapılamaz.': 'A payment notice cannot be submitted for this order.',
  'Bu ürün şu anda stokta.': 'This product is currently in stock.',
  'Geçerli bir e-posta adresi girin (örn. ad@ornek.com).': 'Enter a valid email address (e.g. name@example.com).',
  'Geçerli bir telefon numarası girin (11 hane, örn. 0532 123 45 67).': 'Enter a valid phone number (11 digits, e.g. 0532 123 45 67).',
  'Bu ürün için değerlendirmenizi zaten gönderdiniz.': 'You have already submitted a review for this product.',
  'Değerlendirme yazmak için giriş yapın.': 'Please sign in to write a review.',
  'Yalnızca bu ürünü satın alıp teslim alan müşterilerimiz değerlendirme yazabilir.': 'Only customers who have purchased and received this product can write a review.',
  'Doğrulama e-postası az önce gönderildi. Lütfen bir dakika sonra tekrar deneyin.': 'A verification email was just sent. Please try again in a minute.',
  'E-posta gönderilemedi.': 'The email could not be sent.',
  'Fatura, ödeme onaylandıktan sonra oluşturulur.': 'The invoice is issued after the payment is confirmed.',
  'Geçerli bir e-posta adresi girin': 'Enter a valid email address',
  'Geçerli bir e-posta adresi girin.': 'Enter a valid email address.',
  'Geçerli bir iade tutarı girin.': 'Enter a valid refund amount.',
  'Geçerli bir telefon numarası girin (5xx xxx xx xx).': 'Enter a valid phone number (5xx xxx xx xx).',
  'Geçersiz belge türü': 'Invalid document type',
  'Geçersiz iade türü.': 'Invalid return type.',
  'Geçersiz istek': 'Invalid request',
  'Geçersiz işlem': 'Invalid action',
  'Geçersiz kupon kodu.': 'Invalid coupon code.',
  'Geçersiz sepet kalemi.': 'Invalid cart item.',
  'Geçersiz ürün adedi.': 'Invalid product quantity.',
  'Giriş yapmanız gerekiyor': 'You need to sign in',
  'Giriş yapmanız gerekiyor.': 'You need to sign in.',
  'Gönderen adı, banka, tutar ve geçerli bir ödeme tarihi girin.': 'Enter the sender name, bank, amount and a valid payment date.',
  'Güvenliğiniz için şifrenizi yeniden girip tekrar deneyin.': 'For your security, re-enter your password and try again.',
  'Hesap silinemedi. Lütfen bizimle iletişime geçin.': 'The account could not be deleted. Please contact us.',
  'Kart ödeme sayfası şu anda açılamıyor. Lütfen Havale/EFT ile deneyin veya daha sonra tekrar deneyin.': 'The card payment page cannot be opened right now. Please use bank transfer (EFT) or try again later.',
  'Kartla ödeme şu anda kullanılamıyor. Lütfen Havale/EFT seçeneğiyle devam edin.': 'Card payment is currently unavailable. Please continue with bank transfer (EFT).',
  'Kupon kodu 3–32 karakter olmalı; yalnızca harf, rakam, - ve _ kullanılabilir.': 'The coupon code must be 3–32 characters; only letters, digits, - and _ are allowed.',
  'Kupon kodu gerekli.': 'A coupon code is required.',
  'Kupon kontrol edilemedi.': 'The coupon could not be verified.',
  'Lütfen sorunu kısaca açıklayın.': 'Please briefly describe the problem.',
  'Oturum doğrulanamadı.': 'Your session could not be verified.',
  'Sepet boş.': 'Your cart is empty.',
  'Sepette çok fazla kalem var.': 'There are too many items in your cart.',
  'Sepetteki bir ürün artık satışta değil. Lütfen sepetinizi güncelleyin.': 'A product in your cart is no longer for sale. Please update your cart.',
  'Sipariş bu sırada başka bir işlemle güncellendi. Sayfayı yenileyin.': 'The order was updated by another action in the meantime. Please refresh the page.',
  'Sipariş bulunamadı': 'Order not found',
  'Sipariş getirilirken bir hata oluştu': 'An error occurred while loading the order',
  'Sipariş iptal edilemedi.': 'The order could not be cancelled.',
  'Sipariş oluşturulurken bir hata oluştu': 'An error occurred while creating the order',
  'Siparişler getirilirken bir hata oluştu': 'An error occurred while loading orders',
  'Toplam iade tutarı sipariş tutarını aşamaz.': 'The total refund cannot exceed the order total.',
  'Tüm zorunlu alanları doldurun': 'Fill in all required fields',
  'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.': 'Too many attempts. Please try again in a few minutes.',
  'Çok fazla deneme. Lütfen kısa süre sonra tekrar deneyin.': 'Too many attempts. Please try again shortly.',
  'Çok fazla istek.': 'Too many requests.',
  'Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin.': 'Too many requests. Please try again in a minute.',
  'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.': 'Too many requests. Please try again a little later.',
  'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.': 'Too many requests. Please try again shortly.',
  'Çok fazla sipariş isteği. Lütfen kısa süre sonra tekrar deneyin.': 'Too many order requests. Please try again shortly.',
  'Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi onaylanmalıdır.': 'You must accept the Preliminary Information Form and the Distance Sales Agreement.',
  'Ad, e-posta, telefon ve adres bilgileri zorunludur.': 'Name, email, phone and address are required.',
  'Ürün bulunamadı.': 'Product not found.',
  'Ürün şu anda satılamıyor.': 'This product is currently unavailable.',
  'Ürün fiyatlandırılamadı.': 'This product could not be priced.',
  'İade edilecek en az bir ürün seçin.': 'Select at least one product to return.',
  'İade talebi bulunamadı': 'Return request not found',
  'İşlem yapılamadı.': 'The action could not be completed.',
  'Şu anda işlem yapılamıyor.': 'This action is not available right now.',
  // Firebase giriş/kayıt hataları (lib/auth-errors.ts)
  'E-posta adresi veya şifre hatalı.': 'Incorrect email address or password.',
  'E-posta adresinizi girin.': 'Enter your email address.',
  'Şifrenizi girin.': 'Enter your password.',
  'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Giriş yapabilir veya şifrenizi sıfırlayabilirsiniz.': 'An account with this email address already exists. You can sign in or reset your password.',
  'Şifre çok zayıf. En az 8 karakter; harf ve rakam içeren bir şifre seçin.': 'The password is too weak. Choose at least 8 characters with letters and digits.',
  'Şifre güvenlik koşullarını karşılamıyor. Daha uzun ve harf/rakam içeren bir şifre seçin.': 'The password does not meet the security requirements. Choose a longer password with letters and digits.',
  'Bu hesap devre dışı bırakılmış. Lütfen bizimle iletişime geçin.': 'This account has been disabled. Please contact us.',
  'Bağlantı hatası. İnternet bağlantınızı kontrol edip tekrar deneyin.': 'Connection error. Check your internet connection and try again.',
  'Bu giriş yöntemi şu anda kullanılamıyor.': 'This sign-in method is currently unavailable.',
  'Açılır pencere engellendi. Tarayıcınızda bu site için açılır pencerelere izin verip tekrar deneyin.': 'The pop-up was blocked. Allow pop-ups for this site in your browser and try again.',
  'Giriş penceresi kapatıldı.': 'The sign-in window was closed.',
  'Bu alan adından sosyal hesapla giriş henüz etkin değil.': 'Social sign-in is not yet enabled on this domain.',
  'Bu e-posta adresi başka bir giriş yöntemiyle (Google, Facebook veya e-posta/şifre) kayıtlı. Lütfen hesabı açtığınız yöntemle giriş yapın.': 'This email address is registered with a different sign-in method (Google, Facebook or email/password). Please sign in with the method you used to create the account.',
  'Bağlantının süresi dolmuş. Lütfen yeni bir bağlantı isteyin.': 'The link has expired. Please request a new one.',
  'Bağlantı geçersiz veya daha önce kullanılmış.': 'The link is invalid or has already been used.',
  'Güvenliğiniz için lütfen yeniden giriş yapın.': 'For your security, please sign in again.',
  'Şu anda çok fazla istek var. Lütfen daha sonra tekrar deneyin.': 'There are too many requests right now. Please try again later.',
  'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.': 'An unexpected error occurred. Please try again.',
  'Giriş yapılamadı. Lütfen tekrar deneyin.': 'Sign-in failed. Please try again.',
  'Kayıt tamamlanamadı. Lütfen tekrar deneyin.': 'Registration could not be completed. Please try again.',
  // Fatura bilgisi doğrulaması (lib/checkout-validation.ts; istemci ve sunucu ortak)
  'Firma ünvanı zorunludur.': 'Company name is required.',
  'Vergi numarası zorunludur.': 'Tax number is required.',
  'Vergi numarası 10 haneli olmalıdır.': 'The tax number must be 10 digits.',
  'Vergi dairesi zorunludur.': 'Tax office is required.',
  'Geçerli bir T.C. kimlik numarası girin.': 'Enter a valid Turkish ID number.',
}

/** Değişken içeren mesajlar: ürün adları ve sayılar olduğu gibi aktarılır */
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Sepet tutarınız güncellendi: yeni toplam (.+) TL \(önceki (.+) TL\)\. Lütfen kontrol edip siparişi yeniden onaylayın\.$/, (m) => `Your cart total has changed: new total ${m[1]} TL (previously ${m[2]} TL). Please review and confirm your order again.`],
  [/^"(.+)" için bir seçenek \(model\) seçmelisiniz\. Lütfen ürünü sepetten çıkarıp seçenekle yeniden ekleyin\.$/, (m) => `You must choose an option (model) for "${m[1]}". Please remove the product from your cart and add it again with an option.`],
  [/^"(.+)" için en fazla (\d+) adet iade edilebilir\.$/, (m) => `At most ${m[2]} of "${m[1]}" can be returned.`],
  [/^"(.+)" için stokta yalnızca (\d+) adet var\.$/, (m) => `Only ${m[2]} of "${m[1]}" are in stock.`],
  [/^"(.+)" için stokta yalnızca (\d+) adet var\. Lütfen adedi azaltın\.$/, (m) => `Only ${m[2]} of "${m[1]}" are in stock. Please reduce the quantity.`],
  [/^"(.+)" şu anda stokta yok\. Lütfen sepetinizden çıkarın\.$/, (m) => `"${m[1]}" is currently out of stock. Please remove it from your cart.`],
  [/^"(.+)" çevrim içi sipariş edilemiyor\. Fiyat için lütfen teklif alın\.$/, (m) => `"${m[1]}" cannot be ordered online. Please request a quote.`],
  [/^"(.+)" çevrim içi sipariş edilemiyor\. Akü ve bataryalarda kargo ve nakliye için lütfen bizimle iletişime geçin\.$/, (m) => `"${m[1]}" cannot be ordered online. For batteries, please contact us about shipping and delivery.`],
  [/^(.+) için fiyat bilgisi bulunamadı\.$/, (m) => `No price is available for ${m[1]}.`],
  [/^Bu kupon en az (.+) TL \(KDV hariç\) alışverişlerde geçerlidir\.$/, (m) => `This coupon is valid for orders of at least ${m[1]} TL (excluding VAT).`],
  [/^Ödemesi bekleyen (\d+) siparişiniz var\./, (m) => `You have ${m[1]} orders awaiting payment. Please complete or cancel their payment before placing a new order.`],
  [/^(.+) ile giriş yapılamadı\. Lütfen tekrar deneyin\.$/, (m) => `Sign-in with ${m[1]} failed. Please try again.`],
  [/^İptal talebiniz daha önce değerlendirildi\. Lütfen bizimle iletişime geçin: (.+)$/, (m) => `Your cancellation request has already been reviewed. Please contact us: ${m[1]}`],
]

const TURKISH = /[çğıöşüÇĞİÖŞÜ]/

export function localizeServerError(message: unknown, locale: string): string | undefined {
  if (typeof message !== 'string' || !message.trim()) return undefined
  if (locale !== 'en') return message
  const exact = EXACT[message.trim()]
  if (exact) return exact
  for (const [re, fn] of PATTERNS) {
    const m = message.trim().match(re)
    if (m) return fn(m)
  }
  return TURKISH.test(message) ? undefined : message
}

const tErrTr = (message: unknown) => localizeServerError(message, 'tr')
const tErrEn = (message: unknown) => localizeServerError(message, 'en')

/** İstemci bileşenleri için: tErr(data?.error) || L('…', '…'). Sabit kimlikli (hook bağımlılıklarında güvenli). */
export function useServerError(): (message: unknown) => string | undefined {
  return useLocale() === 'en' ? tErrEn : tErrTr
}
