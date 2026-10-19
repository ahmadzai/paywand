import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { fmtDate } from '@/lib/format'
import { getClient, getSiteData, mediaUrl } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).about.title : '' }
}

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('')

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const { verein } = await getSiteData(locale)
  const [home, board]: any[] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', locale, depth: 0 }),
    payload.find({ collection: 'board-members', locale, where: { active: { equals: true } }, sort: 'order', limit: 50, depth: 1 }),
  ])
  const members = [...board.docs].sort((a: any, b: any) => (a.role?.order ?? 99) - (b.role?.order ?? 99) || (a.order ?? 0) - (b.order ?? 0))

  return (
    <>
      <PageHead title={t.about.title} lead={home?.introText} />
      <section className="section">
        <div className="wrap two-col">
          <div>
            <h2>{t.about.purposes}</h2>
            <p className="measure" style={{ whiteSpace: 'pre-line' }}>{verein?.purposes}</p>
          </div>
          <div>
            <table className="info-table">
              <tbody>
                <tr><th>{t.about.founded}</th><td>{fmtDate(verein?.foundedOn, locale)}</td></tr>
                <tr><th>{t.about.register}</th><td>{verein?.registerCourt}, {verein?.registerNumber}</td></tr>
                {verein?.memberCount ? <tr><th>{t.about.members}</th><td>{verein.memberCount}</td></tr> : null}
                {verein?.volunteerCount ? <tr><th>{t.about.volunteers}</th><td>{verein.volunteerCount}</td></tr> : null}
              </tbody>
            </table>
            {verein?.satzung?.url ? (
              <p style={{ marginTop: '1.5rem' }}>
                <a className="btn btn-ghost" href={verein.satzung.url}>
                  {t.about.satzung}
                </a>{' '}
                {verein.satzungDate ? <span className="event-meta">{t.about.satzungFrom} {fmtDate(verein.satzungDate, locale)}</span> : null}
              </p>
            ) : null}
            <p><Link href={`/${locale}/transparenz`}>{t.nav.transparency}</Link></p>
          </div>
        </div>
      </section>
      <section className="section section-white">
        <div className="wrap">
          <h2>{t.about.board}</h2>
          <ul className="board">
            {members.map((m: any) => {
              const photo = mediaUrl(m.photo, 'thumb')
              return (
                <li key={m.id}>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="board-photo" src={photo} alt={m.name} />
                  ) : (
                    <div className="board-photo board-initials" aria-hidden="true">{initials(m.name)}</div>
                  )}
                  <h3>{m.name}</h3>
                  <p className="role" style={{ margin: 0 }}>{m.role?.title}</p>
                  {m.bio ? <p className="bio">{m.bio}</p> : null}
                  {m.email ? <a href={`mailto:${m.email}`}>{m.email}</a> : null}
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
