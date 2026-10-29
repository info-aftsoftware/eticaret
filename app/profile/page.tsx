'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { useFirebaseAuthStore } from '@/lib/store/useFirebaseAuth'
import { useCartStore } from '@/lib/store/useCartStore'
import { getAddresses, addAddress, updateAddress, deleteAddress, getOrders, setUserProfile, getUserProfile } from '@/lib/firebase/firestore'
import { FavoritesGrid } from '@/components/FavoritesGrid'
import { getAuth } from '@/lib/firebase/config'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { User, Settings, Trash2, Package, Truck, Plus, Pencil as Edit } from 'lucide-react'
import { fmtPrice } from '@/lib/format'
import { useCurrencyStore } from '@/lib/store/useCurrencyStore'
import { useExchangeRates } from '@/lib/useExchangeRates'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { ClassicPageShell } from '@/components/ClassicPageShell'
import { toOrderView, ORDER_STATUS_LABELS } from '@/lib/order-view'
import { getAuthToken } from '@/lib/store/useAuthStore'
import { DeleteAccountCard } from '@/components/profile/DeleteAccountCard'
import { MarketingConsentCard } from '@/components/profile/MarketingConsentCard'
import { PrivacyDocumentsCard } from '@/components/profile/PrivacyDocumentsCard'
import { EmailVerifyBanner } from '@/components/EmailVerifyBanner'
import { useL } from '@/lib/i18n-inline'
import { isValidTrPhone, PHONE_ERROR_TR, PHONE_ERROR_EN } from '@/lib/checkout-validation'

const ORDER_STATUS_LABELS_EN: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  confirmed: 'Preparing',
  processing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

function ProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, token } = useAuthStore()
  const authReady = useFirebaseAuthStore((s) => s.authReady)
  const { addToast } = useToast()
  const L = useL()
  // Yalnızca Google/Facebook ile giriş yapan kullanıcının şifresi yoktur: şifre değiştirme kartı gösterilmez
  const [hasPasswordLogin, setHasPasswordLogin] = useState(true)
  useEffect(() => {
    const providers = getAuth().currentUser?.providerData.map((p) => p.providerId) ?? []
    if (providers.length > 0) setHasPasswordLogin(providers.includes('password'))
  }, [user?.id])
  const addToCart = useCartStore((state) => state.addItem)
  const currency = useCurrencyStore((s) => s.currency)
  const numberLocale = useLocale()
  const { rates } = useExchangeRates()
  const formatPrice = (amount: number) => fmtPrice(amount, currency, rates?.rates ?? null, numberLocale)
  const [orders, setOrders] = useState<any[]>([])
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profileEdit, setProfileEdit] = useState({ name: '', phone: '' })
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [profileCustomerNo, setProfileCustomerNo] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    title: '',
    name: '',
    phone: '',
    addressLine: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Türkiye',
    isDefault: false,
  })
  const activeTab = searchParams.get('tab') || 'orders'

  useEffect(() => {
    if (!authReady) return
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent('/profile' + window.location.search)}`)
      return
    }
  }, [authReady, isAuthenticated, router])

  const loadOrders = useCallback(async () => {
    if (!user?.id) return
    try {
      // Güncel siparişler Prisma'da (GET /api/orders, yalnızca kendi siparişleri);
      // eski Firestore siparişleri de listede kalır.
      const authToken = await getAuthToken()
      const [apiOrders, firestoreList] = await Promise.all([
        authToken
          ? fetch('/api/orders', { headers: { Authorization: `Bearer ${authToken}` } })
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => (Array.isArray(d?.orders) ? d.orders.map(toOrderView) : []))
              .catch(() => [])
          : Promise.resolve([]),
        getOrders(user.id).catch(() => []),
      ])
      const seen = new Set(apiOrders.map((o: any) => o.orderId))
      const legacy = firestoreList
        .filter((o: any) => !seen.has(o.orderId))
        .map((o: any) => ({
          ...o,
          createdAt: o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt?.seconds ? o.createdAt.seconds * 1000 : 0),
        }))
      const normalized = [...apiOrders, ...legacy]
      normalized.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setOrders(normalized)
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }, [user?.id])

  const loadAddresses = useCallback(async () => {
    if (!user?.id) return
    try {
      const list = await getAddresses(user.id)
      setAddresses(list)
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (!authReady) {
      setLoading(true)
      return
    }
    if (user?.id) {
      loadOrders()
      loadAddresses()
      getUserProfile(user.id).then((p) => setProfileCustomerNo(p?.customerNo ?? null))
    } else {
      setProfileCustomerNo(null)
    }
    setLoading(false)
  }, [authReady, user?.id, loadOrders, loadAddresses])

  const resetAddressForm = () => {
    setAddressForm({
      title: '',
      name: '',
      phone: '',
      addressLine: '',
      city: '',
      district: '',
      postalCode: '',
      country: 'Türkiye',
      isDefault: false,
    })
    setEditingAddressId(null)
  }

  const handleSaveAddress = async () => {
    if (!user?.id) return
    if (!addressForm.title?.trim() || !addressForm.name?.trim() || !addressForm.phone?.trim() || !addressForm.addressLine?.trim() || !addressForm.city?.trim() || !addressForm.district?.trim() || !addressForm.postalCode?.trim()) {
      addToast({ type: 'error', title: L('Hata', 'Error'), description: L('Zorunlu alanları doldurun.', 'Please fill in the required fields.') })
      return
    }
    if (!isValidTrPhone(addressForm.phone)) {
      addToast({ type: 'error', title: L('Hata', 'Error'), description: L(PHONE_ERROR_TR, PHONE_ERROR_EN) })
      return
    }
    try {
      if (editingAddressId) {
        await updateAddress(user.id, editingAddressId, addressForm)
        addToast({ type: 'success', title: L('Başarılı', 'Success'), description: L('Adres güncellendi.', 'Address updated.') })
      } else {
        await addAddress(user.id, addressForm)
        addToast({ type: 'success', title: L('Başarılı', 'Success'), description: L('Adres eklendi.', 'Address added.') })
      }
      setAddressDialogOpen(false)
      resetAddressForm()
      loadAddresses()
    } catch (error) {
      console.error('Error saving address:', error)
      addToast({ type: 'error', title: L('Hata', 'Error'), description: L('Adres kaydedilemedi.', 'Address could not be saved.') })
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!user?.id || !confirm(L('Bu adresi silmek istediğinize emin misiniz?', 'Are you sure you want to delete this address?'))) return
    try {
      await deleteAddress(user.id, addressId)
      addToast({ type: 'success', title: L('Başarılı', 'Success'), description: L('Adres silindi.', 'Address deleted.') })
      loadAddresses()
    } catch (error) {
      addToast({ type: 'error', title: L('Hata', 'Error'), description: L('Adres silinemedi.', 'Address could not be deleted.') })
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user?.id) return
    try {
      await updateAddress(user.id, addressId, { isDefault: true })
      addToast({ type: 'success', title: L('Başarılı', 'Success'), description: L('Varsayılan adres güncellendi.', 'Default address updated.') })
      loadAddresses()
    } catch (error) {
      addToast({ type: 'error', title: L('Hata', 'Error'), description: L('Güncellenemedi.', 'Could not be updated.') })
    }
  }

  const openEditAddress = (address: typeof addresses[0]) => {
    setAddressForm({
      title: address.title,
      name: address.name,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      country: address.country || 'Türkiye',
      isDefault: address.isDefault,
    })
    setEditingAddressId(address.id)
    setAddressDialogOpen(true)
  }

  useEffect(() => {
    if (user) setProfileEdit({ name: user.name || '', phone: user.phone || '' })
  }, [user?.id, user?.name, user?.phone])

  const refreshUserProfile = useFirebaseAuthStore((s) => s.refreshUserProfile)
  const handleSaveProfile = async () => {
    if (!user?.id) return
    if (profileEdit.phone.trim() && !isValidTrPhone(profileEdit.phone)) {
      addToast({ type: 'error', title: L('Hata', 'Error'), description: L(PHONE_ERROR_TR, PHONE_ERROR_EN) })
      return
    }
    try {
      await setUserProfile(user.id, {
        email: user.email,
        name: profileEdit.name.trim(),
        phone: profileEdit.phone.trim() || undefined,
      })
      await refreshUserProfile(user.id)
      addToast({ type: 'success', title: L('Başarılı', 'Success'), description: L('Profil güncellendi.', 'Profile updated.') })
    } catch (error) {
      addToast({ type: 'error', title: L('Hata', 'Error'), description: L('Profil güncellenemedi.', 'Profile could not be updated.') })
    }
  }

  const handleUpdatePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    if (!passwordForm.current.trim()) {
      setPasswordError(L('Mevcut şifrenizi girin.', 'Enter your current password.'))
      return
    }
    if (passwordForm.new.length < 6) {
      setPasswordError(L('Yeni şifre en az 6 karakter olmalıdır.', 'The new password must be at least 6 characters.'))
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError(L('Yeni şifre ve tekrarı eşleşmiyor.', 'The new passwords do not match.'))
      return
    }
    const auth = getAuth()
    const currentUser = auth.currentUser
    if (!currentUser?.email) {
      setPasswordError(L('Oturum bulunamadı. Lütfen tekrar giriş yapın.', 'Session not found. Please sign in again.'))
      return
    }
    setUpdatingPassword(true)
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.current)
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, passwordForm.new)
      setPasswordForm({ current: '', new: '', confirm: '' })
      setPasswordSuccess(true)
      addToast({ type: 'success', title: L('Başarılı', 'Success'), description: L('Şifreniz güncellendi.', 'Your password has been updated.') })
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code === 'auth/wrong-password'
          ? L('Mevcut şifre hatalı.', 'Your current password is incorrect.')
          : (err as { code: string }).code === 'auth/requires-recent-login'
            ? L('Güvenlik için lütfen tekrar giriş yapıp şifre değiştirmeyi deneyin.', 'For security, please sign in again and then try changing your password.')
            : L('Şifre güncellenemedi.', 'Password could not be updated.')
        : L('Şifre güncellenemedi.', 'Password could not be updated.')
      setPasswordError(message)
      addToast({ type: 'error', title: L('Hata', 'Error'), description: message })
    } finally {
      setUpdatingPassword(false)
    }
  }

  // Oturum doğrulanana (veya girişe yönlendirilene) kadar boş hesap sayfası gösterilmez
  if (!authReady || !isAuthenticated) {
    return (
      <ClassicPageShell breadcrumbs={[{ label: L('Hesabım', 'My Account') }]} noTitle>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand border-t-transparent" />
        </div>
      </ClassicPageShell>
    )
  }

  return (
    <ClassicPageShell breadcrumbs={[{ label: L('Hesabım', 'My Account') }]} title={L('Hesabım', 'My Account')} description={L('Siparişler, adresler ve ayarlar', 'Orders, addresses and settings')}>
      <EmailVerifyBanner className="mb-6" />
      <Tabs value={activeTab} onValueChange={(value) => router.push(`/profile?tab=${value}`)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto rounded-lg bg-surface p-1 min-w-0">
          <TabsTrigger value="orders" className="rounded-lg py-3 min-h-[44px] touch-manipulation data-[state=active]:bg-surface-elevated data-[state=active]:shadow-sm data-[state=active]:text-brand">{L('Siparişlerim', 'My Orders')}</TabsTrigger>
          <TabsTrigger value="addresses" className="rounded-lg py-3 min-h-[44px] touch-manipulation data-[state=active]:bg-surface-elevated data-[state=active]:shadow-sm data-[state=active]:text-brand">{L('Adreslerim', 'My Addresses')}</TabsTrigger>
          <TabsTrigger value="favorites" className="rounded-lg py-3 min-h-[44px] touch-manipulation data-[state=active]:bg-surface-elevated data-[state=active]:shadow-sm data-[state=active]:text-brand">{L('Favorilerim', 'My Favorites')}</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg py-3 min-h-[44px] touch-manipulation data-[state=active]:bg-surface-elevated data-[state=active]:shadow-sm data-[state=active]:text-brand">{L('Ayarlar', 'Settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
              {loading ? (
                <Card className="classic-card rounded-lg">
                  <CardContent className="py-12 text-center">
                    <p className="text-ink-muted">{L('Yükleniyor...', 'Loading...')}</p>
                  </CardContent>
                </Card>
              ) : orders.length === 0 ? (
                <Card className="classic-card rounded-lg">
                  <CardContent className="py-12 text-center">
                    <h3 className="text-lg font-semibold text-ink mb-2">{L('Henüz sipariş yok', 'No orders yet')}</h3>
                    <p className="text-ink-muted mb-4">
                      {L('Siparişleriniz burada görünecek.', 'Your orders will appear here.')}
                    </p>
                    <Button asChild className="btn-classic-primary rounded-lg">
                      <Link href="/products">
                        {L('Ürünlere Git', 'Browse Products')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="classic-card rounded-lg hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{L('Sipariş', 'Order')} #{order.orderId}</CardTitle>
                            <p className="text-sm text-ink-muted mt-1">
                              {new Date(order.createdAt).toLocaleDateString(L('tr-TR', 'en-US'), {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              className={
                                order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : order.status === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {order.awaitingTransfer ? L('Ödeme bekleniyor', 'Awaiting payment') : L(ORDER_STATUS_LABELS[order.status] || order.status, ORDER_STATUS_LABELS_EN[order.status] || order.status)}
                            </Badge>
                            <div className="text-lg font-bold text-brand">
                              {formatPrice(order.pricing?.total || 0)}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-ink-muted">
                            {order.trackingNumber && (
                              <div className="flex items-center gap-1">
                                <Truck className="w-4 h-4" />
                                <span>{L('Takip:', 'Tracking:')} {order.trackingNumber}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              <span>{order.items?.length || order.pricing?.items?.length || 0} {L('ürün', 'items')}</span>
                            </div>
                          </div>
                          <Button asChild variant="outline" size="sm" className="rounded-xl">
                            <Link href={`/orders/${order.id}`}>
                              {L('Detayları Gör', 'View Details')}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{L('Kayıtlı Adreslerim', 'My Saved Addresses')}</h3>
                        <Dialog open={addressDialogOpen} onOpenChange={(open) => { setAddressDialogOpen(open); if (!open) resetAddressForm() }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-xl" onClick={() => { resetAddressForm(); setAddressDialogOpen(true) }}>
                      <Plus className="w-4 h-4 mr-2" />
                      {L('Yeni Adres Ekle', 'Add New Address')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>{L('Yeni Adres Ekle', 'Add New Address')}</DialogTitle>
                      <DialogDescription>
                        {L('Teslimat adresinizi ekleyin.', 'Add your delivery address.')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">{L('Adres Başlığı *', 'Address Title *')}</Label>
                          <Input
                            id="title"
                            placeholder={L('Ev, İş, vb.', 'Home, Work, etc.')}
                            value={addressForm.title}
                            onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="name">{L('Ad Soyad *', 'Full Name *')}</Label>
                          <Input
                            id="name"
                            value={addressForm.name}
                            onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">{L('Telefon *', 'Phone *')}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressLine">{L('Adres *', 'Address *')}</Label>
                        <Input
                          id="addressLine"
                          value={addressForm.addressLine}
                          onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="district">{L('İlçe *', 'District *')}</Label>
                          <Input
                            id="district"
                            value={addressForm.district}
                            onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">{L('Şehir *', 'City *')}</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="postalCode">{L('Posta Kodu *', 'Postal Code *')}</Label>
                          <Input
                            id="postalCode"
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="country">{L('Ülke', 'Country')}</Label>
                        <Input
                          id="country"
                          value={addressForm.country}
                          onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="w-4 h-4 text-brand border-palette rounded focus:ring-brand"
                        />
                        <Label htmlFor="isDefault" className="cursor-pointer">
                          {L('Varsayılan adres olarak ayarla', 'Set as default address')}
                        </Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" className="rounded-xl" onClick={() => setAddressDialogOpen(false)}>
                        {L('İptal', 'Cancel')}
                      </Button>
                      <Button className="rounded-full" onClick={handleSaveAddress}>
                        {editingAddressId ? L('Güncelle', 'Update') : L('Kaydet', 'Save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {addresses.length === 0 ? (
                <Card className="classic-card rounded-lg">
                  <CardContent className="py-12 text-center">
                    <h3 className="text-lg font-semibold text-ink mb-2">{L('Henüz adres yok', 'No addresses yet')}</h3>
                    <p className="text-ink-muted mb-4">
                      {L('Teslimat adreslerinizi kaydedin.', 'Save your delivery addresses.')}
                    </p>
                    <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="rounded-full">
                          <Plus className="w-4 h-4 mr-2" />
                          {L('İlk Adresimi Ekle', 'Add My First Address')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader>
                          <DialogTitle>{L('Yeni Adres Ekle', 'Add New Address')}</DialogTitle>
                          <DialogDescription>
                            {L('Teslimat adresinizi ekleyin.', 'Add your delivery address.')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="title-empty">{L('Adres Başlığı *', 'Address Title *')}</Label>
                              <Input
                                id="title-empty"
                                placeholder={L('Ev, İş, vb.', 'Home, Work, etc.')}
                                value={addressForm.title}
                                onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="name-empty">{L('Ad Soyad *', 'Full Name *')}</Label>
                              <Input
                                id="name-empty"
                                value={addressForm.name}
                                onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="phone-empty">{L('Telefon *', 'Phone *')}</Label>
                            <Input
                              id="phone-empty"
                              type="tel"
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="addressLine-empty">{L('Adres *', 'Address *')}</Label>
                            <Input
                              id="addressLine-empty"
                              value={addressForm.addressLine}
                              onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="district-empty">{L('İlçe *', 'District *')}</Label>
                              <Input
                                id="district-empty"
                                value={addressForm.district}
                                onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="city-empty">{L('Şehir *', 'City *')}</Label>
                              <Input
                                id="city-empty"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="postalCode-empty">{L('Posta Kodu *', 'Postal Code *')}</Label>
                              <Input
                                id="postalCode-empty"
                                value={addressForm.postalCode}
                                onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="country-empty">{L('Ülke', 'Country')}</Label>
                            <Input
                              id="country-empty"
                              value={addressForm.country}
                              onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isDefault-empty"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                              className="w-4 h-4 text-brand border-palette rounded focus:ring-brand"
                            />
                            <Label htmlFor="isDefault-empty" className="cursor-pointer">
                              {L('Varsayılan adres olarak ayarla', 'Set as default address')}
                            </Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" className="rounded-xl" onClick={() => setAddressDialogOpen(false)}>
                            {L('İptal', 'Cancel')}
                          </Button>
                          <Button className="rounded-full" onClick={handleSaveAddress}>
                            {editingAddressId ? L('Güncelle', 'Update') : L('Kaydet', 'Save')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <Card key={address.id} className="relative classic-card rounded-lg">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{address.title}</CardTitle>
                          {address.isDefault && (
                            <Badge className="bg-brand-light text-brand">{L('Varsayılan', 'Default')}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium">{address.name}</p>
                          <p className="text-ink-muted">{address.addressLine}</p>
                          <p className="text-ink-muted">
                            {address.district} / {address.city} {address.postalCode}
                          </p>
                          <p className="text-ink-muted">{address.phone}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {!address.isDefault && (
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => handleSetDefaultAddress(address.id)}>
                              {L('Varsayılan yap', 'Set as default')}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => openEditAddress(address)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {L('Düzenle', 'Edit')}
                          </Button>
                          <Button variant="outline" size="sm" className="text-brand rounded-xl" onClick={() => handleDeleteAddress(address.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <FavoritesGrid compact />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="classic-card rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {L('Kişisel Bilgiler', 'Personal Information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="profile-name">{L('Ad Soyad', 'Full Name')}</Label>
                      <Input
                        id="profile-name"
                        value={profileEdit.name}
                        onChange={(e) => setProfileEdit((p) => ({ ...p, name: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{L('E-posta', 'Email')}</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="profile-phone">{L('Telefon', 'Phone')}</Label>
                      <Input
                        id="profile-phone"
                        value={profileEdit.phone}
                        onChange={(e) => setProfileEdit((p) => ({ ...p, phone: e.target.value }))}
                        className="rounded-xl"
                      />
                    </div>
                    {profileCustomerNo && (
                      <div>
                        <Label>{L('Müşteri No', 'Customer No.')}</Label>
                        <p className="text-sm font-mono text-ink mt-1">{profileCustomerNo}</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="rounded-xl" onClick={handleSaveProfile}>
                    <Edit className="w-4 h-4 mr-2" />
                    {L('Bilgileri Güncelle', 'Update Information')}
                  </Button>
                </CardContent>
              </Card>

              {hasPasswordLogin && (
              <Card className="classic-card rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {L('Hesap Ayarları', 'Account Settings')}
                  </CardTitle>
                  <p className="text-sm text-ink-muted">{L('Şifrenizi değiştirmek için mevcut şifrenizi girin.', 'Enter your current password to change your password.')}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {passwordSuccess && (
                    <p className="text-sm text-green-600 font-medium">{L('Şifreniz başarıyla güncellendi.', 'Your password has been updated successfully.')}</p>
                  )}
                  {passwordError && (
                    <p className="text-sm text-brand">{passwordError}</p>
                  )}
                  <div>
                    <Label htmlFor="currentPassword">{L('Mevcut Şifre', 'Current Password')}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                      className="rounded-xl"
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">{L('Yeni Şifre', 'New Password')}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={L('En az 6 karakter', 'At least 6 characters')}
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                      className="rounded-xl"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmNewPassword">{L('Yeni Şifre Tekrar', 'Confirm New Password')}</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="••••••••"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                      className="rounded-xl"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? L('Güncelleniyor...', 'Updating...') : L('Şifreyi Güncelle', 'Update Password')}
                  </Button>
                </CardContent>
              </Card>
              )}
              <MarketingConsentCard />
              <PrivacyDocumentsCard />
              <DeleteAccountCard />
            </TabsContent>

            <TabsContent value="havale" className="space-y-4">
              <Card className="classic-card rounded-lg">
                <CardHeader>
                  <CardTitle>{L('Havale Bildirimi', 'Bank Transfer Notice')}</CardTitle>
                  <p className="text-sm text-ink-muted">{L('Ödeme yaptıktan sonra havale/EFT bilgilerinizi buradan iletebilirsiniz.', 'After paying, you can submit your bank transfer details here.')}</p>
                </CardHeader>
                <CardContent>
                  {orders.filter((o: any) => o.awaitingTransfer).length === 0 ? (
                    <p className="text-ink-muted">{L('Ödeme bekleyen havale/EFT siparişiniz yok.', 'You have no bank transfer orders awaiting payment.')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {orders.filter((o: any) => o.awaitingTransfer).map((o: any) => (
                        <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <span className="text-sm">
                            <strong>#{o.orderId}</strong> · {formatPrice(o.pricing?.total || 0)}
                          </span>
                          <Button asChild size="sm" variant="outline" className="bg-white">
                            <Link href={`/orders/${o.id}`}>{L('Ödeme bilgileri ve bildirim', 'Payment details and notice')}</Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

      </Tabs>
    </ClassicPageShell>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <ClassicPageShell noTitle>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-800 border-t-transparent" />
        </div>
      </ClassicPageShell>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}

