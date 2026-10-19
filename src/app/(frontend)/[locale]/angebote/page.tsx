import { notFound } from 'next/navigation'
import { FocusList, PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getClient } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).offers.title : '' }
}

export default async function Offers({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const focus = await payload.find({ collection: 'focus-areas', locale, sort: 'order', limit: 50, depth: 0 })
  return (
    <>
      <PageHead title={t.offers.title} lead={t.home.joinText} />
      <section className="section">
        <div className="wrap">
          <FocusList items={focus.docs} locale={locale} />
        </div>
      </section>
    </>
  )
}
