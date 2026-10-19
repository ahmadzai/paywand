import Link from 'next/link'
import React from 'react'
import { getDict, LOCALE_META, LOCALES, type Locale } from '@/i18n'
import { mediaUrl } from '@/lib/payload'
import { KilimBand, Logo } from './Brand'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Header({ locale, settings }: { locale: Locale; settings: any }) {
  const t = getDict(locale)
  const nav = [
    { href: `/${locale}/ueber-uns`, label: t.nav.about },
    { href: `/${locale}/angebote`, label: t.nav.offers },
    { href: `/${locale}/veranstaltungen`, label: t.nav.events },
    { href: `/${locale}/aktuelles`, label: t.nav.news },
    { href: `/${locale}/mitmachen`, label: t.nav.join },
    { href: `/${locale}/kontakt`, label: t.nav.contact },
  ]
  const languages = LOCALES.map((l) => ({ code: l, label: LOCALE_META[l].short }))
  return (
    <header className="site-header">
      <a className="skip" href="#main">
        {t.common.skip}
      </a>
      <div className="wrap header-row">
        <Link href={`/${locale}`} className="brand-link" aria-label={settings?.siteName || 'Paywand'}>
          <Logo name={settings?.siteName || 'Paywand'} nativeName={settings?.nativeName} uploadedUrl={mediaUrl(settings?.logo)} />
        </Link>
        <nav className="main-nav" aria-label={t.common.menu}>
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-tools">
          <LanguageSwitcher current={locale} languages={languages} label={t.common.language} />
          <Link className="btn btn-accent btn-small" href={`/${locale}/mitmachen#spenden`}>
            {t.cta.donate}
          </Link>
          <details className="mobile-nav">
            <summary aria-label={t.common.menu}>
              <span className="burger" aria-hidden="true" />
              <span className="sr-only">{t.common.menu}</span>
            </summary>
            <div className="mobile-panel">
              <ul>
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href}>{n.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}

export function Footer({ locale, settings, verein }: { locale: Locale; settings: any; verein: any }) {
  const t = getDict(locale)
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <KilimBand />
      <div className="wrap footer-grid">
        <div>
          <p className="footer-name">{verein?.officialName}</p>
          {settings?.tagline ? <p className="footer-tagline">{settings.tagline}</p> : null}
          {verein?.registerNumber ? (
            <p className="footer-meta">
              {verein.registerCourt}, {verein.registerNumber}
            </p>
          ) : null}
        </div>
        <div>
          <p className="footer-head">{t.nav.contact}</p>
          <address>
            {settings?.street ? <span>{settings.street}<br /></span> : null}
            {settings?.postalCode} {settings?.city}
            <br />
            {settings?.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : null}
            {settings?.phone ? (
              <>
                <br />
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`} dir="ltr">{settings.phone}</a>
              </>
            ) : null}
          </address>
          {settings?.social?.length ? (
            <ul className="social">
              {settings.social.map((s: any) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener noreferrer" target="_blank">
                    {s.platform}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <p className="footer-head">Paywand</p>
          <ul className="footer-links">
            <li><Link href={`/${locale}/transparenz`}>{t.nav.transparency}</Link></li>
            <li><Link href={`/${locale}/mitmachen`}>{t.cta.join}</Link></li>
            <li><Link href={`/${locale}/impressum`}>{t.footer.legal}</Link></li>
            <li><Link href={`/${locale}/datenschutz`}>{t.footer.privacy}</Link></li>
            <li><a href="/admin">{t.footer.admin}</a></li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        © {year} {settings?.siteName || 'Paywand'} e.V.
      </div>
    </footer>
  )
}
