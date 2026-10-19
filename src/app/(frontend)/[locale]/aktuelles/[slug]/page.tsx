import { notFound } from 'next/navigation'
import { RichText } from '@/components/site/RichText'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { fmtDate } from '@/lib/format'
import { getClient, mediaUrl } from '@/lib/payload'

type P = { params: Promise<{ locale: string; slug: string }> }

async function load(locale: any, slug: string) {
  const payload = await getClient()
  const res = await payload.find({ collection: 'posts', locale, where: { and: [{ slug: { equals: slug } }, { published: { equals: true } }] }, limit: 1, depth: 1 })
  return res.docs[0] as any
}

export async function generateMetadata({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const p = await load(locale, slug)
  return p ? { title: p.title, description: p.excerpt } : {}
}

export default async function Post({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const p = await load(locale, slug)
  if (!p) notFound()
  const img = mediaUrl(p.image, 'hero')
  return (
    <>
      <PageHead title={p.title} lead={p.excerpt} crumb={{ href: `/${locale}/aktuelles`, label: t.news.title }} />
      <section className="section">
        <div className="wrap" style={{ maxWidth: '48rem' }}>
          <p className="event-meta">
            <time dateTime={p.publishedAt}>{fmtDate(p.publishedAt, locale)}</time>
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {img ? <img className="detail-image" src={img} alt={p.image?.alt || ''} /> : null}
          <RichText data={p.content} />
        </div>
      </section>
    </>
  )
}
