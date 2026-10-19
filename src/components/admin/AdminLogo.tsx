'use client'

import React from 'react'

/** Paywand ring symbol for the admin UI. The weave gaps use the admin theme
 *  background so the logo sits correctly on light and dark mode. */
function Rings({ size = 44 }: { size?: number }) {
  const id = React.useId().replace(/:/g, '')
  return (
    <svg width={size} height={(size * 100) / 112} viewBox="0 0 112 100" aria-hidden="true">
      <defs>
        <clipPath id={`over-${id}`}>
          <circle cx="56" cy="27" r="11" />
        </clipPath>
        <clipPath id={`under-${id}`}>
          <circle cx="56" cy="73" r="11" />
        </clipPath>
      </defs>
      <circle cx="40" cy="50" r="28" fill="none" stroke="#23408E" strokeWidth="11" />
      <circle cx="72" cy="50" r="28" fill="none" stroke="#E2A72E" strokeWidth="11" />
      <g clipPath={`url(#over-${id})`}>
        <circle cx="40" cy="50" r="28" fill="none" stroke="var(--theme-bg, #fff)" strokeWidth="15" />
        <circle cx="40" cy="50" r="28" fill="none" stroke="#23408E" strokeWidth="11" />
      </g>
      <g clipPath={`url(#under-${id})`}>
        <circle cx="72" cy="50" r="28" fill="none" stroke="var(--theme-bg, #fff)" strokeWidth="15" />
        <circle cx="72" cy="50" r="28" fill="none" stroke="#E2A72E" strokeWidth="11" />
      </g>
      <path d="M56 40 L59.2 46.8 L66 50 L59.2 53.2 L56 60 L52.8 53.2 L46 50 L52.8 46.8 Z" fill="#B0283F" />
    </svg>
  )
}

/** Login screen graphic: symbol + wordmark. */
export function AdminLogo() {
  return (
    <div className="pw-admin-logo">
      <Rings size={72} />
      <div className="pw-admin-logo__words">
        <span className="pw-admin-logo__name">
          Paywand <span className="pw-admin-logo__ev">e.V.</span>
        </span>
        <span className="pw-admin-logo__native" lang="ps" dir="rtl">
          پیوند
        </span>
      </div>
    </div>
  )
}

/** Small icon in the admin header / nav. */
export function AdminIcon() {
  return <Rings size={30} />
}
