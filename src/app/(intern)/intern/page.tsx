import Link from 'next/link'
import { redirect } from 'next/navigation'
import { accountBalances, loadTransactions, SPHERE_LABELS, summarize, yearRange } from '@/lib/finance'
import { fmtDate, fmtEUR } from '@/lib/format'
import { getInternSession, STATUS_LABELS } from '@/lib/intern'
import { getClient } from '@/lib/payload'

export const metadata = { title: 'Overview' }

const adminUrl = (id: string | number) => `/admin/collections/transactions/${id}`

function TxTable({ rows, showStatus }: { rows: any[]; showStatus?: boolean }) {
  if (!rows.length) return <p className="empty">No transactions.</p>
  return (
    <table className="finance-table intern-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>No.</th>
          <th>Counterparty</th>
          <th>Category</th>
          {showStatus ? <th>Status</th> : null}
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.id}>
            <td>{fmtDate(t.date, 'en')}</td>
            <td>
              <a href={adminUrl(t.id)}>{t.receiptNumber || '–'}</a>
            </td>
            <td>{t.counterparty}</td>
            <td>{t.category?.name || '–'}</td>
            {showStatus ? <td><span className={`status status-${t.status}`}>{STATUS_LABELS[t.status] || t.status}</span></td> : null}
            <td>{t.type === 'expense' ? '−' : ''}{fmtEUR(Number(t.amount))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default async function InternDashboard() {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern')
  if (!session.isFinance) redirect('/intern/cards')
  const payload = await getClient()
  const year = new Date().getFullYear()

  if (!session.viewAll) {
    // financeEntry only: just their own bookings
    const own = await payload.find({
      collection: 'transactions',
      where: { createdBy: { equals: session.user.id } },
      sort: '-updatedAt',
      limit: 25,
      depth: 1,
      overrideAccess: true,
    })
    return (
      <>
        <h1>My transactions</h1>
        <TxTable rows={own.docs as any[]} showStatus />
      </>
    )
  }

  const [balances, txsYtd, pending, recent, projectDocs] = await Promise.all([
    accountBalances(payload),
    loadTransactions(payload, yearRange(year)),
    payload.find({ collection: 'transactions', where: { status: { equals: 'submitted' } }, sort: 'date', limit: 20, depth: 1, overrideAccess: true }),
    payload.find({ collection: 'transactions', sort: '-updatedAt', limit: 10, depth: 1, overrideAccess: true }),
    payload.find({ collection: 'finance-projects', where: { status: { not_equals: 'closed' } }, limit: 100, depth: 0, overrideAccess: true }),
  ])
  const ytd = summarize(txsYtd)
  const spheres = Object.entries(ytd.bySphere)

  // Budget vs. actual: all open projects, including those without bookings yet
  const projects = (projectDocs.docs as any[]).map((p) => {
    const actual = ytd.byProject[String(p.id)]
    return { id: p.id, name: p.name, budget: Number(p.budget || 0), income: actual?.income ?? 0, expenses: actual?.expenses ?? 0 }
  })

  return (
    <>
      <div className="intern-title-row">
        <h1>Finance overview {year}</h1>
        <p className="intern-actions">
          <a className="btn btn-ghost btn-small" href={`/intern/export?year=${year}`}>
            CSV export {year}
          </a>{' '}
          <Link className="btn btn-ghost btn-small" href={`/intern/jahresbericht/${year}`}>
            Annual report {year}
          </Link>{' '}
          <Link className="btn btn-ghost btn-small" href={`/intern/jahresbericht/${year - 1}`}>
            Annual report {year - 1}
          </Link>
        </p>
      </div>

      <section className="intern-section">
        <h2>Accounts &amp; cash boxes</h2>
        <div className="intern-cards">
          {balances.map((a) => (
            <div key={a.id} className="intern-card">
              <h3>{a.name}</h3>
              <p className="intern-balance">{fmtEUR(a.balance)}</p>
              {a.pending ? <p className="intern-pending">pending: {fmtEUR(a.pending)}</p> : null}
            </div>
          ))}
          {!balances.length ? <p className="empty">No accounts yet.</p> : null}
        </div>
      </section>

      <section className="intern-section">
        <h2>Year to date by tax sphere ({year})</h2>
        {spheres.length ? (
          <table className="finance-table intern-table">
            <thead>
              <tr>
                <th>Sphere</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {spheres.map(([key, v]) => (
                <tr key={key}>
                  <td>{SPHERE_LABELS[key] || key}</td>
                  <td>{fmtEUR(v.income)}</td>
                  <td>{fmtEUR(v.expenses)}</td>
                  <td>{fmtEUR(v.income - v.expenses)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total</td>
                <td>{fmtEUR(ytd.income)}</td>
                <td>{fmtEUR(ytd.expenses)}</td>
                <td>{fmtEUR(ytd.result)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="empty">No approved transactions in {year} yet.</p>
        )}
      </section>

      <section className="intern-section">
        <h2>Awaiting approval ({pending.totalDocs})</h2>
        <TxTable rows={pending.docs as any[]} />
      </section>

      {projects.length ? (
        <section className="intern-section">
          <h2>Projects: budget vs. actual ({year})</h2>
          <table className="finance-table intern-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Budget</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.budget ? fmtEUR(p.budget) : '–'}</td>
                  <td>{fmtEUR(p.income)}</td>
                  <td>{fmtEUR(p.expenses)}</td>
                  <td>{p.budget ? fmtEUR(p.budget - p.expenses) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="intern-section">
        <h2>Recent transactions</h2>
        <TxTable rows={recent.docs as any[]} showStatus />
      </section>
    </>
  )
}
