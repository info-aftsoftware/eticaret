'use client'

import React from 'react'
import { useL } from '@/lib/i18n-inline'
import { taxOfficesByCity } from '@/lib/tax-offices'

type TaxOfficeInputProps = { id: string; list?: string; autoComplete: string; placeholder: string }

/**
 * Vergi dairesi alanı: seçilen ilin daireleri öneri listesi (datalist) olarak gelir, listede olmayan daire elle yazılabilir.
 * Kutunun görünümü kullanan sayfada kalır (renderInput); öneri ve yer tutucu mantığı tek yerde.
 */
export function TaxOfficeInput({ id, city, renderInput }: { id: string; city: string; renderInput: (props: TaxOfficeInputProps) => React.ReactNode }) {
  const L = useL()
  const offices = taxOfficesByCity(city)
  const listId = `${id}-list`
  return (
    <>
      {renderInput({
        id,
        list: offices.length ? listId : undefined,
        autoComplete: 'off',
        placeholder: city ? L('Seçin veya yazın', 'Select or type') : L('Önce il seçin', 'Select a province first'),
      })}
      {offices.length > 0 && (
        <datalist id={listId}>
          {offices.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
    </>
  )
}
