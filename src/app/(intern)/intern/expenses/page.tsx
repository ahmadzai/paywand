import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isBooked, loadTransactions, yearRange } from '@/lib/finance'
import { fmtDate, fmtEUR } from '@/lib/format'
import { getInternSession, STATUS_LABELS } from '@/lib/intern'
import { getClient } from '@/lib/payload'

export const metadata = { title: 'Expenses' }

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern%2Fexpenses')
  if (!session.viewAll) redirect('/intern')
  const now = new Date()
  const { year: yearParam } = await searchParams
  const year = Number(yearParam) >= 2000 && Number(yearParam) <= 2100 ? Number(yearParam) : now.getFullYear()

  const payload = await getClient()
  const [txs, projectsRes] = await Promise.all([
    loadTransactions(payload, yearRange(year)),
    payload.find({ collection: 'finance-projects', limit: 200, depth: 0, overrideAccess: true }),
  ])
  const expenses = txs.filter((t) => t.type === 'expense' && !['rejected', 'reversed'].includes(t.status))
  const approvedTotal = expenses.filter(isBooked).reduce((s, t) => s + Number(t.amount || 0), 0)
  const pendingTotal = expenses.filter((t) => ['draft', 'submitted'].includes(t.status)).reduce((s, t) => s + Number(t.amount || 0), 0)

  const byCategory = new Map<string, number>()
  for (const t of expenses) {
    const name = t.category?.name || '–'
    byCategory.set(name, (byCategory.get(name) || 0) + Number(t.amount || 0))
  }
  const byProject = new Map<string, { budget: number; spent: number }>()
  for (const p of projectsRes.docs as any[]) byProject.set(p.name, { budget: Number(p.budget || 0), spent: 0 })
  for (const t of expenses) {
    if (!t.project) continue
    const name = t.project?.name || '–'
    const entry = byProject.get(name) || { budget: 0, spent: 0 }
    entry.spent += Number(t.amount || 0)
    byProject.set(name, entry)
  }
  const projectRows = [...byProject.entries()].filter(([, v]) => v.budget || v.spent)

  return (
    <>
      <div className="intern-title-row">
        <h1>Expenses {year}</h1>
        <p className="intern-actions">
          <Link className="btn btn-ghost btn-small" href={`/intern/expenses?year=${year - 1}`}>
            ← {year - 1}
          </Link>{' '}
          <Link className="btn btn-ghost btn-small" href={`/intern/expenses?year=${year + 1}`}>
            {year + 1} →
          </Link>{' '}
          <a className="btn btn-primary btn-small" href="/admin/collections/transactions/create">
            Record expense
          </a>{' '}
          <a className="btn btn-ghost btn-small" href="/admin/collections/finance-projects">
            Projects
          </a>
        </p>
      </div>

      <section className="intern-section">
        <div className="intern-cards">
          <div className="intern-card">
            <h3>Approved expenses</h3>
            <p className="intern-balance">{fmtEUR(approvedTotal)}</p>
          </div>
          <div className="intern-card">
            <h3>Pending (draft/submitted)</h3>
            <p className="intern-balance">{fmtEUR(pendingTotal)}</p>
          </div>
        </div>
      </section>

      <div className="two-col">
        <section className="intern-section">
          <h2>By category</h2>
          {byCategory.size ? (
            <table className="finance-table intern-table">
              <tbody>
                {[...byCategory.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, sum]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{fmtEUR(sum)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">No expenses in {year} yet.</p>
          )}
        </section>

        <section className="intern-section">
          <h2>By project (e.g. a course or an event)</h2>
          {projectRows.length ? (
            <table className="finance-table intern-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {projectRows.map(([name, v]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{v.budget ? fmtEUR(v.budget) : '–'}</td>
                    <td>{fmtEUR(v.spent)}</td>
                    <td>{v.budget ? fmtEUR(v.budget - v.spent) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">
              No projects yet. Create one per course or event (with its budget) and link expenses to it:{' '}
              <a href="/admin/collections/finance-projects/create">add project</a>.
            </p>
          )}
        </section>
      </div>

      <section className="intern-section">
        <h2>All expense transactions ({year})</h2>
        {expenses.length ? (
          <table className="finance-table intern-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>No.</th>
                <th>Paid to</th>
                <th>Category</th>
                <th>Project</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((t) => (
                <tr key={t.id}>
                  <td>{fmtDate(t.date, 'en')}</td>
                  <td>
                    <a href={`/admin/collections/transactions/${t.id}`}>{t.receiptNumber || '–'}</a>
                  </td>
                  <td>{t.counterparty}</td>
                  <td>{t.category?.name || '–'}</td>
                  <td>{t.project?.name || '–'}</td>
                  <td>
                    <span className={`status status-${t.status}`}>{STATUS_LABELS[t.status] || t.status}</span>
                  </td>
                  <td>{fmtEUR(Number(t.amount || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">No expenses recorded in {year}.</p>
        )}
      </section>
    </>
  )
}
