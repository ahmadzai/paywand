import React from 'react'

/**
 * Paywand symbol: two interlaced rings – lapis (Afghanistan, Badakhshan lapis lazuli)
 * and saffron gold (shared with the gold of the German flag) – woven over and under
 * each other, with a pomegranate star at the point where they meet.
 * Colours follow the editable site colours (CSS variables).
 */
export function LogoSymbol({ size = 48, title = 'Paywand' }: { size?: number; title?: string }) {
  const id = React.useId().replace(/:/g, '')
  return (
    <svg width={size} height={(size * 100) / 112} viewBox="0 0 112 100" role="img" aria-label={title} className="logo-symbol">
      <defs>
        <clipPath id={`over-${id}`}>
          <circle cx="56" cy="27" r="11" />
        </clipPath>
        <clipPath id={`under-${id}`}>
          <circle cx="56" cy="73" r="11" />
        </clipPath>
      </defs>
      <circle cx="40" cy="50" r="28" fill="none" stroke="var(--c-primary)" strokeWidth="11" />
      <circle cx="72" cy="50" r="28" fill="none" stroke="var(--c-accent)" strokeWidth="11" />
      <g clipPath={`url(#over-${id})`}>
        <circle cx="40" cy="50" r="28" fill="none" stroke="var(--c-paper)" strokeWidth="15" />
        <circle cx="40" cy="50" r="28" fill="none" stroke="var(--c-primary)" strokeWidth="11" />
      </g>
      <g clipPath={`url(#under-${id})`}>
        <circle cx="72" cy="50" r="28" fill="none" stroke="var(--c-paper)" strokeWidth="15" />
        <circle cx="72" cy="50" r="28" fill="none" stroke="var(--c-accent)" strokeWidth="11" />
      </g>
      <path d="M56 40 L59.2 46.8 L66 50 L59.2 53.2 L56 60 L52.8 53.2 L46 50 L52.8 46.8 Z" fill="var(--c-highlight)" />
    </svg>
  )
}

export function Logo({ name, nativeName, uploadedUrl, alt }: { name: string; nativeName?: string; uploadedUrl?: string | null; alt?: string }) {
  if (uploadedUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={uploadedUrl} alt={alt || name} className="logo-upload" />
  }
  return (
    <span className="logo">
      <LogoSymbol size={46} title={name} />
      <span className="logo-words">
        <span className="logo-name">
          {name}
          <span className="logo-ev"> e.V.</span>
        </span>
        {nativeName ? (
          <span className="logo-native" lang="ps" dir="rtl">
            {nativeName}
          </span>
        ) : null}
      </span>
    </span>
  )
}

/** Decorative band inspired by Afghan kilim borders. */
export function KilimBand({ className = '' }: { className?: string }) {
  const id = React.useId().replace(/:/g, '')
  return (
    <svg className={`kilim ${className}`} aria-hidden="true" focusable="false" width="100%" height="18" preserveAspectRatio="none">
      <defs>
        <pattern id={`k-${id}`} width="36" height="18" patternUnits="userSpaceOnUse">
          <path d="M9 0 L18 9 L9 18 L0 9 Z" fill="var(--c-primary)" />
          <path d="M9 4.5 L13.5 9 L9 13.5 L4.5 9 Z" fill="var(--c-accent)" />
          <rect x="8" y="8" width="2" height="2" fill="var(--c-highlight)" />
          <path d="M27 0 L36 9 L27 18 L18 9 Z" fill="var(--c-accent)" />
          <path d="M27 4.5 L31.5 9 L27 13.5 L22.5 9 Z" fill="var(--c-highlight)" />
          <rect x="26" y="8" width="2" height="2" fill="var(--c-paper)" />
        </pattern>
      </defs>
      <rect width="100%" height="18" fill={`url(#k-${id})`} />
    </svg>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  integration: (
    <>
      <path d="M3 17h18" />
      <path d="M5 17V11a7 7 0 0 1 14 0v6" />
      <path d="M9 17v-4M15 17v-4M12 17v-6" />
    </>
  ),
  bildung: (
    <>
      <path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5Z" />
      <path d="M12 6.5V19" />
    </>
  ),
  jugend: (
    <>
      <path d="M12 3l2.6 5.6L20.5 9.5l-4.3 4.1 1 6-5.2-2.9-5.2 2.9 1-6-4.3-4.1 5.9-.9Z" />
    </>
  ),
  kultur: (
    <>
      <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  dialog: (
    <>
      <path d="M4 5h11v8H9l-4 3v-3H4Z" />
      <path d="M15 9h5v8h-1v3l-4-3h-4v-2" />
    </>
  ),
}

export function FocusIcon({ name, size = 28 }: { name?: string | null; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name || 'integration'] ?? ICONS.integration}
    </svg>
  )
}
