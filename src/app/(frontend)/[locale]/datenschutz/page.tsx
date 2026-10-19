import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@/components/site/RichText'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getClient } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).footer.privacy : '' }
}

export default async function Privacy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const legal: any = await payload.findGlobal({ slug: 'legal-pages', locale, depth: 1 })
  const hasContent = Boolean(legal?.privacy?.root?.children?.length)

  return (
    <>
      <PageHead title={t.footer.privacy} />
      <section className="section">
        <div className="wrap legal-page">
          {hasContent ? (
            <RichText data={legal.privacy} />
          ) : (
            <p className="empty">
              {t.legal.privacyEmpty} <Link href={`/${locale}/kontakt`}>{t.nav.contact}</Link>
            </p>
          )}
        </div>
      </section>
    </>
  )
}
