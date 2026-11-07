'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useL } from '@/lib/i18n-inline'
import { TR_CITIES, getDistrictsByCity } from '@/lib/tr-cities'
import { formatTrPhone, onlyDigits } from '@/lib/checkout-validation'
import { taxOfficesByCity } from '@/lib/tax-offices'

/** Kayıtlı adres formu: teslimat bilgileri + bu adrese fatura kesilirken kullanılacak bireysel/kurumsal bilgiler */
export type AddressFormValue = {
  title: string
  name: string
  phone: string
  addressLine: string
  city: string
  district: string
  postalCode: string
  country: string
  isDefault: boolean
  invoiceType: 'individual' | 'company'
  idNumber: string
  companyName: string
  taxId: string
  taxOffice: string
}

export const EMPTY_ADDRESS_FORM: AddressFormValue = {
  title: '',
  name: '',
  phone: '',
  addressLine: '',
  city: '',
  district: '',
  postalCode: '',
  country: 'Türkiye',
  isDefault: false,
  invoiceType: 'individual',
  idNumber: '',
  companyName: '',
  taxId: '',
  taxOffice: '',
}

const selectCls =
  'flex h-11 md:h-10 w-full appearance-none rounded-md border border-input bg-transparent px-3 pr-9 text-base md:text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function AddressFormFields({
  value,
  onChange,
  idPrefix,
}: {
  value: AddressFormValue
  onChange: (patch: Partial<AddressFormValue>) => void
  idPrefix: string
}) {
  const L = useL()
  const id = (name: string) => `${idPrefix}-${name}`
  const districts = value.city ? getDistrictsByCity(value.city) : []
  const offices = taxOfficesByCity(value.city)
  const cityKnown = TR_CITIES.some((c) => c.name === value.city)
  const districtKnown = districts.includes(value.district)

  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={id('title')}>{L('Adres başlığı *', 'Address title *')}</Label>
          <Input id={id('title')} placeholder={L('Ev, İş, vb.', 'Home, Work, etc.')} value={value.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        <div>
          <Label htmlFor={id('name')}>{L('Ad soyad *', 'Full name *')}</Label>
          <Input id={id('name')} autoComplete="name" value={value.name} onChange={(e) => onChange({ name: e.target.value })} />
        </div>
      </div>

      <div>
        <Label htmlFor={id('phone')}>{L('Telefon *', 'Phone *')}</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base md:text-sm text-slate-500">+90</span>
          <Input
            id={id('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="5xx xxx xx xx"
            className="pl-11"
            value={value.phone}
            onChange={(e) => onChange({ phone: formatTrPhone(e.target.value) })}
          />
        </div>
      </div>

      {/* Önce il, sonra ilçe (ilçe listesi seçilen ile göre) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={id('city')}>{L('İl *', 'Province *')}</Label>
          <div className="relative">
            <select
              id={id('city')}
              value={value.city}
              autoComplete="address-level1"
              onChange={(e) => onChange({ city: e.target.value, district: '' })}
              className={`${selectCls} ${value.city ? '' : 'text-slate-400'}`}
            >
              <option value="">{L('İl seçin', 'Select province')}</option>
              {!cityKnown && value.city && <option value={value.city}>{value.city}</option>}
              {TR_CITIES.map((c) => (
                <option key={c.name} value={c.name} className="text-slate-900">{c.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          </div>
        </div>
        <div>
          <Label htmlFor={id('district')}>{L('İlçe *', 'District *')}</Label>
          <div className="relative">
            <select
              id={id('district')}
              value={value.district}
              disabled={!value.city}
              autoComplete="address-level2"
              onChange={(e) => onChange({ district: e.target.value })}
              className={`${selectCls} ${value.district ? '' : 'text-slate-400'}`}
            >
              <option value="">{value.city ? L('İlçe seçin', 'Select district') : L('Önce il seçin', 'Select a province first')}</option>
              {!districtKnown && value.district && <option value={value.district}>{value.district}</option>}
              {districts.map((d) => (
                <option key={d} value={d} className="text-slate-900">{d}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          </div>
        </div>
        <div>
          <Label htmlFor={id('postalCode')}>{L('Posta kodu', 'Postal code')}</Label>
          <Input
            id={id('postalCode')}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="23100"
            value={value.postalCode}
            onChange={(e) => onChange({ postalCode: onlyDigits(e.target.value).slice(0, 5) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor={id('addressLine')}>{L('Açık adres *', 'Street address *')}</Label>
        <textarea
          id={id('addressLine')}
          rows={2}
          autoComplete="street-address"
          placeholder={L('Mahalle, cadde/sokak, bina ve daire numarası', 'Neighbourhood, street, building and flat number')}
          value={value.addressLine}
          onChange={(e) => onChange({ addressLine: e.target.value })}
          className="flex min-h-[64px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Bu adrese kesilecek fatura: ödeme sayfasında adres seçilince fatura bilgileri de dolar */}
      <fieldset className="rounded-lg border border-slate-200 p-3">
        <legend className="px-1 text-sm font-medium text-slate-800">{L('Fatura bilgisi', 'Invoice details')}</legend>
        <div role="radiogroup" aria-label={L('Fatura türü', 'Invoice type')} className="inline-flex rounded-lg bg-slate-100 p-1">
          {(['individual', 'company'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={value.invoiceType === t}
              onClick={() => onChange({ invoiceType: t })}
              className={`h-9 rounded-md px-4 text-sm font-medium transition-colors ${value.invoiceType === t ? 'bg-white text-[#0b2540] shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {t === 'individual' ? L('Bireysel', 'Individual') : L('Kurumsal', 'Corporate')}
            </button>
          ))}
        </div>
        {value.invoiceType === 'individual' ? (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={id('idNumber')}>{L('T.C. kimlik no', 'Turkish ID number')}</Label>
              <Input
                id={id('idNumber')}
                inputMode="numeric"
                autoComplete="off"
                placeholder={L('11 haneli', '11 digits')}
                value={value.idNumber}
                onChange={(e) => onChange({ idNumber: onlyDigits(e.target.value).slice(0, 11) })}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor={id('companyName')}>{L('Firma ünvanı *', 'Company name *')}</Label>
              <Input id={id('companyName')} autoComplete="organization" value={value.companyName} onChange={(e) => onChange({ companyName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor={id('taxId')}>{L('Vergi numarası *', 'Tax number *')}</Label>
              <Input
                id={id('taxId')}
                inputMode="numeric"
                autoComplete="off"
                placeholder={L('10 haneli', '10 digits')}
                value={value.taxId}
                onChange={(e) => onChange({ taxId: onlyDigits(e.target.value).slice(0, 10) })}
              />
            </div>
            <div>
              <Label htmlFor={id('taxOffice')}>{L('Vergi dairesi *', 'Tax office *')}</Label>
              <TaxOfficeInput id={id('taxOffice')} city={value.city} offices={offices} value={value.taxOffice} onChange={(taxOffice) => onChange({ taxOffice })} />
            </div>
          </div>
        )}
      </fieldset>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={id('isDefault')}
          checked={value.isDefault}
          onChange={(e) => onChange({ isDefault: e.target.checked })}
          className="w-4 h-4 text-brand border-palette rounded focus:ring-brand"
        />
        <Label htmlFor={id('isDefault')} className="cursor-pointer">
          {L('Varsayılan adres olarak ayarla', 'Set as default address')}
        </Label>
      </div>
    </div>
  )
}

/** Vergi dairesi: seçilen ilin daireleri öneri listesi olarak gelir; listede olmayan daire elle yazılabilir */
function TaxOfficeInput({ id, city, offices, value, onChange }: { id: string; city: string; offices: string[]; value: string; onChange: (v: string) => void }) {
  const L = useL()
  return (
    <>
      <Input
        id={id}
        list={offices.length ? `${id}-list` : undefined}
        autoComplete="off"
        placeholder={city ? L('Seçin veya yazın', 'Select or type') : L('Önce il seçin', 'Select a province first')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {offices.length > 0 && (
        <datalist id={`${id}-list`}>
          {offices.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </>
  )
}
