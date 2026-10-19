import { notFound } from 'next/navigation'
import { NewsGrid, PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getClient } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).news.title : '' }
}

export default async function News({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const posts = await payload.find({ collection: 'posts', locale, where: { published: { equals: true } }, sort: '-publishedAt', limit: 30, depth: 1 })
  return (
    <>
      <PageHead title={t.news.title} />
      <section className="section">
        <div className="wrap">
          <NewsGrid items={posts.docs} locale={locale} />
        </div>
      </section>
    </>
  )
}
