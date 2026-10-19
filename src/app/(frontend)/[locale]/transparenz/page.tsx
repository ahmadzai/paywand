import { notFound } from 'next/navigation'
import type { Payload } from 'payload'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { loadTransactions, summarize, yearRange } from '@/lib/finance'
import { fmtDate, fmtEUR } from '@/lib/format'
import { getClient, getSiteData } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).transparency.title : '' }
}

const EXEMPTION_LABELS: Record<string, string> = {
  freistellung: 'Tax exemption notice (Freistellungsbescheid)',
  feststellung: 'Charitable-status notice (Feststellungsbescheid, § 60a AO)',
}

/** Published figures: only when enabled in FinanceSettings AND the year is locked (audited). */
async function publishedReport(payload: Payload) {
  const fs: any = await payload.findGlobal({ slug: 'finance-settings', overrideAccess: true })
  if (!fs?.publishTransparency || !fs?.transparencyYear) return null
  const year = Number(fs.transparencyYear)
  const periods = await payload.find({ collection: 'finance-periods', where: { year: { equals: year } }, limit: 1, overrideAccess: true })
  const period: any = periods.docs[0]
  if (!period?.locked) return null
  const txs = await loadTransactions(payload, yearRange(year))
  return { year, auditDate: period.auditDate as string | undefined, sum: summarize(txs) }
}

function CategoryTable({ rows, totalLabel, total }: { rows: { label: string; total: number }[]; totalLabel: string; total: number }) {
  return (
    <table className="finance-table">
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td>{r.label}</td>
            <td>{fmtEUR(r.total)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>{totalLabel}</td>
          <td>{fmtEUR(total)}</td>
        </tr>
      </tfoot>
    </table>
  )
}

export default async function Transparency({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const payload = await getClient()
  const { settings, verein } = await getSiteData(locale)
  const [board, report] = await Promise.all([
    payload.find({ collection: 'board-members', locale, where: { active: { equals: true } }, sort: 'order', limit: 50, depth: 1 }),
    publishedReport(payload),
  ])
  const members = [...(board.docs as any[])].sort((a, b) => (a.role?.order ?? 99) - (b.role?.order ?? 99) || (a.order ?? 0) - (b.order ?? 0))

  const categories = report ? Object.values(report.sum.byCategory) : []
  const toRows = (type: 'income' | 'expense') =>
    categories
      .filter((c) => c.type === type && c.total !== 0)
      .sort((a, b) => b.total - a.total)
      .map((c) => ({ label: c.publicLabel || c.name, total: c.total }))

  const dash = <p className="measure">–</p>
  const notPublished = <p className="empty">{t.transparency.notPublished}</p>

  return (
    <>
      <PageHead title={t.transparency.title} lead={t.transparency.intro} />
      <section className="section">
        <div className="wrap">
          <ol className="itz-list">
            <li>
              <div>
                <h2>{t.transparency.basics}</h2>
                <table className="info-table">
                  <tbody>
                    <tr><th scope="row">{t.form.name}</th><td>{verein?.officialName}</td></tr>
                    <tr><th scope="row">{t.transparency.seat}</th><td>{settings?.city || 'Berlin'}</td></tr>
                    {verein?.foundedOn ? <tr><th scope="row">{t.about.founded}</th><td>{fmtDate(verein.foundedOn, locale)}</td></tr> : null}
                    {verein?.registerNumber ? <tr><th scope="row">{t.about.register}</th><td>{verein.registerCourt}, {verein.registerNumber}</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.statutes}</h2>
                {verein?.purposes ? <p className="measure" style={{ whiteSpace: 'pre-line' }}>{verein.purposes}</p> : dash}
                {verein?.satzung?.url ? (
                  <p>
                    <a className="btn btn-ghost" href={verein.satzung.url}>{t.about.satzung}</a>{' '}
                    {verein.satzungDate ? <span className="event-meta">{t.about.satzungFrom} {fmtDate(verein.satzungDate, locale)}</span> : null}
                  </p>
                ) : null}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.taxStatus}</h2>
                {verein?.exemptionDate ? (
                  <p className="measure">
                    {EXEMPTION_LABELS[verein.exemptionType] || EXEMPTION_LABELS.freistellung} ({fmtDate(verein.exemptionDate, locale)})
                    {verein.taxOffice ? <>, {verein.taxOffice}</> : null}
                  </p>
                ) : (
                  dash
                )}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.decisionMakers}</h2>
                {members.length ? (
                  <ul className="itz-people">
                    {members.map((m: any) => (
                      <li key={m.id}>
                        <strong>{m.name}</strong>
                        {m.role?.title ? <span className="event-meta"> – {m.role.title}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  dash
                )}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.activityReport}</h2>
                {verein?.activityReport?.url ? (
                  <p><a className="btn btn-ghost" href={verein.activityReport.url}>{t.transparency.download}</a></p>
                ) : (
                  dash
                )}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.staff}</h2>
                {verein?.staffInfo ? <p className="measure" style={{ whiteSpace: 'pre-line' }}>{verein.staffInfo}</p> : dash}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.fundsSource}</h2>
                {report ? (
                  <>
                    <p className="finance-year">{t.transparency.year} {report.year}</p>
                    <CategoryTable rows={toRows('income')} totalLabel={t.transparency.total} total={report.sum.income} />
                  </>
                ) : (
                  notPublished
                )}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.fundsUse}</h2>
                {report ? (
                  <>
                    <p className="finance-year">{t.transparency.year} {report.year}</p>
                    <CategoryTable rows={toRows('expense')} totalLabel={t.transparency.total} total={report.sum.expenses} />
                    <p className="finance-year">
                      {t.transparency.result}: <strong>{fmtEUR(report.sum.result)}</strong>
                      {report.auditDate ? <> · {t.transparency.auditNote} ({fmtDate(report.auditDate, locale)})</> : null}
                    </p>
                  </>
                ) : (
                  notPublished
                )}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.affiliations}</h2>
                {verein?.affiliations ? <p className="measure" style={{ whiteSpace: 'pre-line' }}>{verein.affiliations}</p> : dash}
              </div>
            </li>
            <li>
              <div>
                <h2>{t.transparency.majorDonors}</h2>
                {verein?.majorDonors ? <p className="measure" style={{ whiteSpace: 'pre-line' }}>{verein.majorDonors}</p> : dash}
              </div>
            </li>
          </ol>
        </div>
      </section>
    </>
  )
}
