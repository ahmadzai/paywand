import { notFound } from 'next/navigation'
import { EventList, PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getClient } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).events.title : '' }
}

export default async function Events({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const now = new Date().toISOString()
  const [upcoming, past] = await Promise.all([
    payload.find({ collection: 'events', locale, where: { startsAt: { greater_than_equal: now } }, sort: 'startsAt', limit: 50, depth: 0 }),
    payload.find({ collection: 'events', locale, where: { startsAt: { less_than: now } }, sort: '-startsAt', limit: 12, depth: 0 }),
  ])
  return (
    <>
      <PageHead title={t.events.title} />
      <section className="section">
        <div className="wrap">
          <h2>{t.events.upcoming}</h2>
          <EventList items={upcoming.docs} locale={locale} />
          {past.docs.length ? (
            <div style={{ marginTop: '4rem', opacity: 0.85 }}>
              <h2>{t.events.past}</h2>
              <EventList items={past.docs} locale={locale} />
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
