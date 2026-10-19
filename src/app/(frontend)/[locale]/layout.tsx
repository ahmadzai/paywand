import '@fontsource-variable/literata'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/noto-naskh-arabic'
import '@fontsource-variable/noto-kufi-arabic'
import '../site.css'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'
import { Footer, Header } from '@/components/site/Chrome'
import { isLocale, LOCALE_META, LOCALES } from '@/i18n'
import { getSiteData } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { settings, verein } = await getSiteData(locale)
  const name = settings?.siteName || 'Paywand'
  return {
    title: { default: `${name} e.V. – ${settings?.tagline || ''}`, template: `%s | ${name} e.V.` },
    description: verein?.purposes?.slice(0, 160) || settings?.tagline,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_META[l].htmlLang, `/${l}`])) },
    icons: { icon: '/favicon.svg' },
  }
}

const safeHex = (v: unknown, fallback: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback)

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const meta = LOCALE_META[locale]
  const { settings, verein } = await getSiteData(locale)

  const theme = `:root{--c-primary:${safeHex(settings?.colorPrimary, '#23408E')};--c-accent:${safeHex(settings?.colorAccent, '#E2A72E')};--c-highlight:${safeHex(settings?.colorHighlight, '#B0283F')};}`

  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: theme }} />
      </head>
      <body>
        <Header locale={locale} settings={settings} />
        <main id="main">{children}</main>
        <Footer locale={locale} settings={settings} verein={verein} />
      </body>
    </html>
  )
}
