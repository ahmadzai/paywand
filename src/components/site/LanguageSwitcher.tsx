'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function LanguageSwitcher({ current, languages, label }: { current: string; languages: { code: string; label: string }[]; label: string }) {
  const pathname = usePathname() || `/${current}`
  const rest = pathname.split('/').slice(2).join('/')
  return (
    <nav className="lang-switch" aria-label={label}>
      {languages.map((l) => (
        <Link
          key={l.code}
          href={`/${l.code}${rest ? `/${rest}` : ''}`}
          hrefLang={l.code}
          lang={l.code}
          aria-current={l.code === current ? 'true' : undefined}
          className={l.code === current ? 'active' : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
