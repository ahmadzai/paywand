import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FocusIcon } from '@/components/site/Brand'
import { RichText } from '@/components/site/RichText'
import { EventList, PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getClient, mediaUrl } from '@/lib/payload'

type P = { params: Promise<{ locale: string; slug: string }> }

async function load(locale: any, slug: string) {
  const payload = await getClient()
  const res = await payload.find({ collection: 'focus-areas', locale, where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] as any
}

export async function generateMetadata({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const f = await load(locale, slug)
  return f ? { title: f.title, description: f.summary } : {}
}

export default async function Offer({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const f = await load(locale, slug)
  if (!f) notFound()
  const payload = await getClient()
  const events = await payload.find({
    collection: 'events',
    locale,
    where: { and: [{ focusArea: { equals: f.id } }, { startsAt: { greater_than_equal: new Date().toISOString() } }] },
    sort: 'startsAt',
    limit: 5,
    depth: 0,
  })
  const img = mediaUrl(f.image, 'hero')
  return (
    <>
      <PageHead title={f.title} lead={f.summary} crumb={{ href: `/${locale}/angebote`, label: t.offers.title }} />
      <section className="section">
        <div className="wrap detail-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img ? <img className="detail-image" src={img} alt={f.image?.alt || ''} /> : null}
            {f.bullets?.length ? (
              <>
                <h2>{t.offers.what}</h2>
                <ul className="bullets">
                  {f.bullets.map((b: any) => (
                    <li key={b.id}>{b.text}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <RichText data={f.body} />
            {f.howToJoin ? (
              <div className="howto">
                <h2>{t.offers.howToJoin}</h2>
                <p>{f.howToJoin}</p>
                <Link className="btn btn-primary" href={`/${locale}/kontakt`}>
                  {t.contact.write}
                </Link>
              </div>
            ) : null}
          </div>
          <aside className="aside-box">
            <span className="focus-icon" style={{ marginBottom: '1rem' }}>
              <FocusIcon name={f.icon} size={22} />
            </span>
            <h2 style={{ fontSize: 'var(--step-1)' }}>{t.offers.upcoming}</h2>
            <EventList items={events.docs} locale={locale} />
          </aside>
        </div>
      </section>
    </>
  )
}
