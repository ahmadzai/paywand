import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MONTH_OPTIONS } from '@/collections/finance/membership'
import { fmtEUR } from '@/lib/format'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'
import { recordContribution } from '../../actions'

export const metadata = { title: 'Contributions' }

const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)
const MONTHS = MONTH_OPTIONS.map((m) => ({ n: Number(m.value), short: m.label.slice(0, 3) }))

export default async function Contributions({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern%2Fcontributions')
  if (!session.isFinance) redirect('/intern/cards')
  const canRecord = session.perms.financeEntry || session.perms.financeAdmin

  const now = new Date()
  const { year: yearParam } = await searchParams
  const year = Number(yearParam) >= 2000 && Number(yearParam) <= 2100 ? Number(yearParam) : now.getFullYear()
  const lastDueMonth = year < now.getFullYear() ? 12 : year > now.getFullYear() ? 0 : now.getMonth() + 1

  const payload = await getClient()
  const [membersRes, paymentsRes] = await Promise.all([
    payload.find({ collection: 'members', where: { active: { equals: true } }, sort: 'name', limit: 500, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'member-contributions', where: { year: { equals: year } }, limit: 10000, depth: 0, overrideAccess: true }),
  ])
  const members = membersRes.docs as any[]
  const paid = new Map<string, any>()
  for (const p of paymentsRes.docs as any[]) paid.set(`${idOf(p.member)}-${p.month}`, p)

  /** Months this member owes in the displayed year (join/leave dates respected). */
  const dueMonths = (m: any): number[] => {
    const joined = m.joinedOn ? new Date(m.joinedOn) : null
    const left = m.leftOn ? new Date(m.leftOn) : null
    const from = joined && joined.getFullYear() === year ? joined.getMonth() + 1 : joined && joined.getFullYear() > year ? 13 : 1
    const to = left && left.getFullYear() === year ? left.getMonth() + 1 : left && left.getFullYear() < year ? 0 : lastDueMonth
    return MONTHS.map((x) => x.n).filter((n) => n >= from && n <= to)
  }

  let expected = 0
  let received = 0
  const arrears: { name: string; months: number; owed: number }[] = []
  for (const m of members) {
    const due = dueMonths(m)
    expected += due.length * Number(m.monthlyFee || 0)
    const unpaid = due.filter((n) => !paid.has(`${m.id}-${n}`))
    if (unpaid.length) arrears.push({ name: m.name, months: unpaid.length, owed: unpaid.length * Number(m.monthlyFee || 0) })
  }
  for (const p of paymentsRes.docs as any[]) received += Number(p.amount || 0)

  return (
    <>
      <div className="intern-title-row">
        <h1>Membership contributions {year}</h1>
        <p className="intern-actions">
          <Link className="btn btn-ghost btn-small" href={`/intern/contributions?year=${year - 1}`}>
            ← {year - 1}
          </Link>{' '}
          <Link className="btn btn-ghost btn-small" href={`/intern/contributions?year=${year + 1}`}>
            {year + 1} →
          </Link>{' '}
          <a className="btn btn-ghost btn-small" href="/admin/collections/members">
            Manage members
          </a>
        </p>
      </div>

      <section className="intern-section">
        <div className="intern-cards">
          <div className="intern-card">
            <h3>Expected (year to date)</h3>
            <p className="intern-balance">{fmtEUR(expected)}</p>
          </div>
          <div className="intern-card">
            <h3>Received</h3>
            <p className="intern-balance">{fmtEUR(received)}</p>
          </div>
          <div className="intern-card">
            <h3>Outstanding</h3>
            <p className="intern-balance">{fmtEUR(Math.max(0, expected - received))}</p>
            <p className="intern-pending">{arrears.length} member{arrears.length === 1 ? '' : 's'} in arrears</p>
          </div>
        </div>
      </section>

      <section className="intern-section">
        <h2>Payment status by month</h2>
        {members.length ? (
          <div className="contrib-scroll">
            <table className="finance-table intern-table contrib-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Fee</th>
                  {MONTHS.map((m) => (
                    <th key={m.n}>{m.short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const due = new Set(dueMonths(m))
                  return (
                    <tr key={m.id}>
                      <td>
                        <a href={`/admin/collections/members/${m.id}`}>{m.name}</a>
                      </td>
                      <td>{fmtEUR(Number(m.monthlyFee || 0))}</td>
                      {MONTHS.map((mo) => {
                        const payment = paid.get(`${m.id}-${mo.n}`)
                        if (payment) {
                          return (
                            <td key={mo.n} className="cell-paid" title={`Paid: ${fmtEUR(Number(payment.amount || 0))}`}>
                              ✓
                            </td>
                          )
                        }
                        if (!due.has(mo.n)) return <td key={mo.n} className="cell-blank" />
                        if (!canRecord) {
                          return (
                            <td key={mo.n} className="cell-due" title="Outstanding">
                              ·
                            </td>
                          )
                        }
                        return (
                          <td key={mo.n} className="cell-due">
                            <form action={recordContribution.bind(null, m.id, year, String(mo.n))}>
                              <button type="submit" className="cell-record" title={`Record ${mo.short} ${year} as paid (${fmtEUR(Number(m.monthlyFee || 0))})`}>
                                +
                              </button>
                            </form>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            No members yet. <a href="/admin/collections/members/create">Add the first member</a> in the admin panel.
          </p>
        )}
        <p className="intern-pending" style={{ marginTop: '0.75rem' }}>
          ✓ paid · + record payment · blank = not a member that month / future. Recording a payment creates a linked draft transaction for approval.
        </p>
      </section>

      {arrears.length ? (
        <section className="intern-section">
          <h2>In arrears ({year})</h2>
          <table className="finance-table intern-table" style={{ maxWidth: '34rem' }}>
            <thead>
              <tr>
                <th>Member</th>
                <th>Open months</th>
                <th>Owed</th>
              </tr>
            </thead>
            <tbody>
              {arrears
                .sort((a, b) => b.owed - a.owed)
                .map((a) => (
                  <tr key={a.name}>
                    <td>{a.name}</td>
                    <td>{a.months}</td>
                    <td>{fmtEUR(a.owed)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  )
}
