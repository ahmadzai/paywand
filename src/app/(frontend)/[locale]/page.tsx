import Link from 'next/link'
import { notFound } from 'next/navigation'
import { KilimBand } from '@/components/site/Brand'
import { EventList, FocusList, NewsGrid } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getClient, getSiteData, mediaUrl } from '@/lib/payload'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const { settings } = await getSiteData(locale)

  const [home, focus, events, posts, partners]: any[] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', locale, depth: 1 }),
    payload.find({ collection: 'focus-areas', locale, sort: 'order', limit: 10, depth: 0 }),
    payload.find({ collection: 'events', locale, where: { startsAt: { greater_than_equal: new Date(Date.now() - 6 * 3600e3).toISOString() } }, sort: 'startsAt', limit: 4, depth: 0 }),
    payload.find({ collection: 'posts', locale, where: { published: { equals: true } }, sort: '-publishedAt', limit: 3, depth: 1 }),
    payload.find({ collection: 'partners', sort: 'order', limit: 20, depth: 1 }),
  ])

  const heroImg = mediaUrl(home?.heroImage, 'hero')

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-text">
            <span className="hero-native" aria-hidden="true" lang="ps">
              {settings?.nativeName || 'پیوند'}
            </span>
            <h1>{home?.heroTitle}</h1>
            {home?.heroText ? <p className="hero-lead">{home.heroText}</p> : null}
            <div className="hero-actions">
              <Link className="btn btn-primary" href={`/${locale}/angebote`}>
                {t.cta.offers}
              </Link>
              <Link className="btn btn-ghost" href={`/${locale}/mitmachen`}>
                {t.cta.join}
              </Link>
            </div>
          </div>
          {heroImg ? (
            <figure className="hero-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImg} alt={home.heroImage?.alt || ''} fetchPriority="high" />
              <KilimBand />
            </figure>
          ) : null}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.home.offersTitle}</h2>
            <Link href={`/${locale}/angebote`}>{t.cta.offers}</Link>
          </div>
          <FocusList items={focus.docs} locale={locale} />
        </div>
      </section>

      {home?.introTitle || home?.facts?.length ? (
        <section className="section section-white">
          <div className="wrap intro-grid">
            <div>
              {home?.introTitle ? <h2>{home.introTitle}</h2> : null}
              {home?.introText ? <p className="measure">{home.introText}</p> : null}
              <Link href={`/${locale}/ueber-uns`}>{t.cta.more}</Link>
            </div>
            <div>
              {home?.facts?.length ? (
                <dl className="facts">
                  {home.facts.map((f: any) => (
                    <div key={f.id}>
                      <dt>{f.value}</dt>
                      <dd>{f.label}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {home?.quote?.text ? (
                <blockquote className="quote" style={{ marginTop: '2.5rem' }}>
                  <p>{home.quote.text}</p>
                  {home.quote.author ? <footer>{home.quote.author}</footer> : null}
                </blockquote>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.home.eventsTitle}</h2>
            <Link href={`/${locale}/veranstaltungen`}>{t.cta.events}</Link>
          </div>
          <EventList items={events.docs} locale={locale} />
        </div>
      </section>

      <section className="section section-white">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.home.newsTitle}</h2>
            <Link href={`/${locale}/aktuelles`}>{t.cta.news}</Link>
          </div>
          <NewsGrid items={posts.docs} locale={locale} />
        </div>
      </section>

      <section className="section join-band">
        <div className="wrap">
          <h2>{t.home.joinTitle}</h2>
          <p className="lead">{t.home.joinText}</p>
          <div className="join-grid">
            <div>
              <h3>{t.join.memberTitle}</h3>
              <p>{t.join.memberText}</p>
              <Link className="btn btn-accent" href={`/${locale}/mitmachen#mitglied`}>
                {t.cta.join}
              </Link>
            </div>
            <div>
              <h3>{t.join.volunteerTitle}</h3>
              <p>{t.join.volunteerText}</p>
              <Link href={`/${locale}/kontakt`}>{t.contact.write}</Link>
            </div>
            <div>
              <h3>{t.join.donateTitle}</h3>
              <p>{t.join.donateText}</p>
              <Link href={`/${locale}/mitmachen#spenden`}>{t.cta.donate}</Link>
            </div>
          </div>
        </div>
      </section>

      {partners.docs.length ? (
        <section className="section">
          <div className="wrap">
            <h2>{t.home.partnersTitle}</h2>
            <ul className="partner-list">
              {partners.docs.map((p: any) => {
                const logo = mediaUrl(p.logo, 'thumb')
                const inner = logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={p.name} />
                ) : (
                  p.name
                )
                return <li key={p.id}>{p.url ? <a href={p.url} rel="noopener noreferrer" target="_blank">{inner}</a> : inner}</li>
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  )
}
