'use client'

import React from 'react'
import Link from '@/lib/i18n/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'header' | 'headerSm'
  className?: string
  href?: string
  asDiv?: boolean
  align?: 'left' | 'center'
}

export function Logo({ size = 'md', className, href, asDiv = false, align = 'left' }: LogoProps) {
  const frameSizeClasses = {
    sm: 'h-11 w-[184px]',
    md: 'h-12 w-[204px]',
    lg: 'h-16 w-[252px]',
    xl: 'h-[54px] w-[226px]',
    /** Site başlığı (voltekno.com ölçüleri) */
    header: 'h-[44px] w-[139px]',
    headerSm: 'h-[40px] w-[125px] max-[359px]:w-[100px]',
  }

  const logoElement = (
    <span
      className={cn(
        'relative block',
        frameSizeClasses[size]
      )}
    >
      <Image
        src="/images/voltekno-logo.webp"
        alt="Voltekno Enerji Sistemleri"
        fill
        priority={size === 'lg' || size === 'xl' || size === 'header' || size === 'headerSm'}
        sizes="(max-width: 768px) 184px, (max-width: 1280px) 252px, 368px"
        className={cn('object-contain', align === 'center' ? 'object-center' : 'object-left')}
      />
    </span>
  )

  if (asDiv) {
    return (
      <div className={cn('flex items-center', className)}>
        {logoElement}
      </div>
    )
  }

  return (
    <Link
      href={href || '/'}
      className={cn('flex items-center cursor-pointer hover:opacity-90 transition-opacity', className)}
    >
      {logoElement}
    </Link>
  )
}
