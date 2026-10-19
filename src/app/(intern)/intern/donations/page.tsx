import Link from 'next/link'
import { redirect } from 'next/navigation'
import { fmtDate, fmtEUR } from '@/lib/format'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'
import { markDonationReceiptIssued } from '../../actions'

export const metadata = { title: 'Donations' }

export default async function DonationsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern%2Fdonations')
  if (!session.isFinance) redirect('/intern/cards')
  const now = new Date()
  const { year: yearParam } = await searchParams
  const year = Number(yearParam) >= 2000 && Number(yearParam) <= 2100 ? Number(yearParam) : now.getFullYear()

  const payload = await getClient()
  const res = await payload.find({
    collection: 'donations',
    where: { and: [{ date: { greater_than_equal: `${year}-01-01T00:00:00.000Z` } }, { date: { less_than_equal: `${year}-12-31T23:59:59.999Z` } }] },
    sort: '-date',
    limit: 1000,
    depth: 1,
    overrideAccess: true,
  })
  const donations = res.docs as any[]
  const total = donations.reduce((s, d) => s + Number(d.amount || 0), 0)
  const receiptsOpen = donations.filter((d) => d.receiptRequested && !d.receiptIssuedOn)

  return (
    <>
      <div className="intern-title-row">
        <h1>Donations {year}</h1>
        <p className="intern-actions">
          <Link className="btn btn-ghost btn-small" href={`/intern/donations?year=${year - 1}`}>
            ← {year - 1}
          </Link>{' '}
          <Link className="btn btn-ghost btn-small" href={`/intern/donations?year=${year + 1}`}>
            {year + 1} →
          </Link>{' '}
          <a className="btn btn-primary btn-small" href="/admin/collections/donations/create">
            Record donation
          </a>
        </p>
      </div>

      <section className="intern-section">
        <div className="intern-cards">
          <div className="intern-card">
            <h3>Total {year}</h3>
            <p className="intern-balance">{fmtEUR(total)}</p>
            <p className="intern-pending">{donations.length} donation{donations.length === 1 ? '' : 's'}</p>
          </div>
          <div className="intern-card">
            <h3>Donation receipts to issue</h3>
            <p className="intern-balance">{receiptsOpen.length}</p>
            <p className="intern-pending">requested, not yet issued</p>
          </div>
        </div>
      </section>

      <section className="intern-section">
        <h2>Donation register</h2>
        {donations.length ? (
          <table className="finance-table intern-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Donor</th>
                <th>Purpose / project</th>
                <th>Receipt (Zuwendungsbestätigung)</th>
                <th>Transaction</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{fmtDate(d.date, 'en')}</td>
                  <td>
                    <a href={`/admin/collections/donations/${d.id}`}>{d.anonymous ? 'Anonymous' : d.donorName}</a>
                  </td>
                  <td>
                    {d.purpose || '–'}
                    {d.project?.name ? <span className="event-meta"> · {d.project.name}</span> : null}
                  </td>
                  <td>
                    {d.receiptIssuedOn ? (
                      <span className="status status-approved">issued {fmtDate(d.receiptIssuedOn, 'en')}</span>
                    ) : d.receiptRequested ? (
                      session.perms.financeAdmin ? (
                        <form action={markDonationReceiptIssued.bind(null, d.id)} style={{ display: 'inline' }}>
                          <button type="submit" className="btn btn-ghost btn-small">
                            Mark issued
                          </button>
                        </form>
                      ) : (
                        <span className="status status-submitted">requested</span>
                      )
                    ) : (
                      '–'
                    )}
                  </td>
                  <td>{d.transaction?.receiptNumber ? <a href={`/admin/collections/transactions/${d.transaction.id}`}>{d.transaction.receiptNumber}</a> : '–'}</td>
                  <td>{fmtEUR(Number(d.amount || 0))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>Total</td>
                <td>{fmtEUR(total)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="empty">
            No donations recorded in {year}. <a href="/admin/collections/donations/create">Record the first donation</a>.
          </p>
        )}
      </section>
    </>
  )
}
