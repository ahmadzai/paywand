import { notFound, redirect } from 'next/navigation'
import { accountBalances, loadTransactions, SPHERE_LABELS, summarize, yearRange } from '@/lib/finance'
import { fmtDate, fmtEUR } from '@/lib/format'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'
import { PrintButton } from './PrintButton'

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return { title: `Annual report ${year}` }
}

const SPHERE_ORDER = ['ideell', 'vermoegen', 'zweckbetrieb', 'wgb']

export default async function AnnualReport({ params }: { params: Promise<{ year: string }> }) {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern')
  if (!session.viewAll) redirect('/intern')

  const { year: yearParam } = await params
  const year = Number(yearParam)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) notFound()

  const payload = await getClient()
  const [verein, txs, balances, periods] = await Promise.all([
    payload.findGlobal({ slug: 'vereinsdaten', depth: 0 }) as Promise<any>,
    loadTransactions(payload, yearRange(year)),
    accountBalances(payload, yearRange(year).to),
    payload.find({ collection: 'finance-periods', where: { year: { equals: year } }, limit: 1, overrideAccess: true }),
  ])
  const sum = summarize(txs)
  const period: any = periods.docs[0]
  const categories = Object.values(sum.byCategory)

  const sphereBlocks = SPHERE_ORDER.filter((s) => sum.bySphere[s]).map((s) => ({
    key: s,
    label: SPHERE_LABELS[s],
    income: categories.filter((c) => c.sphere === s && c.type === 'income').sort((a, b) => b.total - a.total),
    expense: categories.filter((c) => c.sphere === s && c.type === 'expense').sort((a, b) => b.total - a.total),
    totals: sum.bySphere[s],
  }))

  return (
    <div className="report">
      <div className="intern-title-row no-print">
        <h1>Annual report {year}</h1>
        <PrintButton />
      </div>

      <header className="report-head">
        <h1 className="print-only">Income–expenditure statement {year}</h1>
        <p>
          <strong>{verein?.officialName || 'Paywand e.V.'}</strong>
          {verein?.registerNumber ? <> · {verein.registerCourt}, {verein.registerNumber}</> : null}
        </p>
        <p className="report-meta">
          Income–expenditure statement (Einnahmen-Überschuss-Rechnung, EÜR) by tax sphere · Financial year {year} · As of {fmtDate(new Date(), 'en')}
          <br />
          Includes approved transactions only; reversals and their originals are excluded.
        </p>
        {period?.locked ? (
          <p className="report-meta">
            Financial year closed{period.lockedAt ? ` on ${fmtDate(period.lockedAt, 'en')}` : ''}
            {period.auditDate ? ` · cash audit (Kassenprüfung) on ${fmtDate(period.auditDate, 'en')}` : ''}
            {period.auditors ? ` by ${period.auditors}` : ''}
          </p>
        ) : (
          <p className="report-meta report-warn">Preliminary – financial year {year} is not closed yet (cash audit pending).</p>
        )}
      </header>

      {sphereBlocks.length ? (
        sphereBlocks.map((b) => (
          <section key={b.key} className="report-sphere">
            <h2>{b.label}</h2>
            <table className="finance-table report-table">
              <thead>
                <tr>
                  <th />
                  <th>Income</th>
                  <th>Expenses</th>
                </tr>
              </thead>
              <tbody>
                {b.income.map((c, i) => (
                  <tr key={`i${i}`}>
                    <td>{c.name}</td>
                    <td>{fmtEUR(c.total)}</td>
                    <td />
                  </tr>
                ))}
                <tr className="report-subtotal">
                  <td>Total income</td>
                  <td>{fmtEUR(b.totals.income)}</td>
                  <td />
                </tr>
                {b.expense.map((c, i) => (
                  <tr key={`e${i}`}>
                    <td>{c.name}</td>
                    <td />
                    <td>{fmtEUR(c.total)}</td>
                  </tr>
                ))}
                <tr className="report-subtotal">
                  <td>Total expenses</td>
                  <td />
                  <td>{fmtEUR(b.totals.expenses)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Result</td>
                  <td colSpan={2}>{fmtEUR(b.totals.income - b.totals.expenses)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        ))
      ) : (
        <p className="empty">No approved transactions in {year}.</p>
      )}

      <section className="report-sphere">
        <h2>Overall result {year}</h2>
        <table className="finance-table report-table">
          <tbody>
            <tr>
              <td>Total income</td>
              <td>{fmtEUR(sum.income)}</td>
              <td />
            </tr>
            <tr>
              <td>Total expenses</td>
              <td />
              <td>{fmtEUR(sum.expenses)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Annual result (surplus/deficit)</td>
              <td colSpan={2}>{fmtEUR(sum.result)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {balances.length ? (
        <section className="report-sphere">
          <h2>Account and cash balances as of 31 Dec {year}</h2>
          <table className="finance-table report-table">
            <tbody>
              {balances.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td colSpan={2}>{fmtEUR(a.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td colSpan={2}>{fmtEUR(balances.reduce((s, a) => s + a.balance, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ) : null}

      <footer className="report-sign print-only">
        <div>
          <div className="sign-line" />
          <p>Treasurer (Kassenwart/in)</p>
        </div>
        <div>
          <div className="sign-line" />
          <p>Cash auditor (Kassenprüfer/in)</p>
        </div>
      </footer>
    </div>
  )
}
