import { notFound } from 'next/navigation'
import { RichText } from '@/components/site/RichText'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { fmtDate } from '@/lib/format'
import { getClient, getSiteData } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).footer.legal : '' }
}

const EXEMPTION_LABELS: Record<string, string> = {
  freistellung: 'Tax exemption notice (Freistellungsbescheid)',
  feststellung: 'Charitable-status notice (Feststellungsbescheid, § 60a AO)',
}

export default async function Impressum({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const { settings, verein } = await getSiteData(locale)
  const [legal, board]: any[] = await Promise.all([
    payload.findGlobal({ slug: 'legal-pages', locale, depth: 1 }),
    payload.find({ collection: 'board-members', locale, where: { active: { equals: true } }, sort: 'order', limit: 50, depth: 1 }),
  ])
  const reps = [...board.docs]
    .filter((m: any) => m.role?.representsVerein)
    .sort((a: any, b: any) => (a.role?.order ?? 99) - (b.role?.order ?? 99) || (a.order ?? 0) - (b.order ?? 0))

  return (
    <>
      <PageHead title={t.footer.legal} />
      <section className="section">
        <div className="wrap legal-page">
          <h2>{t.legal.provider}</h2>
          <address className="legal-address">
            <strong>{verein?.officialName}</strong>
            <br />
            {settings?.street ? <>{settings.street}<br /></> : null}
            {settings?.postalCode} {settings?.city}
          </address>
          <h2>{t.legal.contact}</h2>
          <p>
            {settings?.email ? <>E-Mail: <a href={`mailto:${settings.email}`}>{settings.email}</a></> : null}
            {settings?.phone ? (
              <>
                <br />
                {t.form.phone}: <a href={`tel:${settings.phone.replace(/\s/g, '')}`} dir="ltr">{settings.phone}</a>
              </>
            ) : null}
          </p>
          {reps.length ? (
            <>
              <h2>{t.legal.represented}</h2>
              <ul>
                {reps.map((m: any) => (
                  <li key={m.id}>
                    {m.name}
                    {m.role?.title ? <> ({m.role.title})</> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {verein?.registerNumber ? (
            <>
              <h2>{t.legal.register}</h2>
              <p>
                {verein.registerCourt}
                <br />
                {verein.registerNumber}
              </p>
            </>
          ) : null}
          {verein?.exemptionDate ? (
            <>
              <h2>{t.legal.nonprofit}</h2>
              <p>
                {t.legal.nonprofitNote}
                <br />
                {EXEMPTION_LABELS[verein.exemptionType] || EXEMPTION_LABELS.freistellung} ({fmtDate(verein.exemptionDate, locale)})
                {verein.taxOffice ? <>, {verein.taxOffice}</> : null}
              </p>
            </>
          ) : null}
          <RichText data={legal?.impressumExtra} className="prose legal-extra" />
        </div>
      </section>
    </>
  )
}
