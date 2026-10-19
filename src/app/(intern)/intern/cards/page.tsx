import Link from 'next/link'
import { redirect } from 'next/navigation'
import { fmtDate } from '@/lib/format'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'
import { sendEventCard, sendMembershipCard } from '../../actions'

export const metadata = { title: 'Cards' }

export default async function CardsPage() {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern%2Fcards')
  if (!session.canCards) redirect('/intern')

  const payload = await getClient()
  const [membersRes, eventCardsRes, pendingApps, cardGlobal] = await Promise.all([
    payload.find({ collection: 'members', sort: 'name', limit: 500, depth: 1, overrideAccess: true }),
    payload.find({ collection: 'event-cards', sort: '-createdAt', limit: 500, depth: 1, overrideAccess: true }),
    payload.count({ collection: 'membership-applications', where: { status: { in: ['new', 'progress'] } }, overrideAccess: true }),
    payload.findGlobal({ slug: 'membership-card', depth: 0 }) as Promise<any>,
  ])
  const members = membersRes.docs as any[]
  const eventCards = eventCardsRes.docs as any[]
  const smtpConfigured = Boolean(process.env.SMTP_HOST)

  return (
    <>
      <div className="intern-title-row">
        <h1>Cards</h1>
        <p className="intern-actions">
          <a className="btn btn-primary btn-small" href="/admin/collections/members/create">
            Add member
          </a>{' '}
          <a className="btn btn-primary btn-small" href="/admin/collections/event-cards/create">
            Create event card
          </a>{' '}
          <a className="btn btn-ghost btn-small" href="/admin/globals/membership-card">
            Card settings
          </a>
        </p>
      </div>

      {pendingApps.totalDocs > 0 ? (
        <p className="form-success" style={{ marginTop: '1rem' }}>
          <strong>{pendingApps.totalDocs}</strong> open membership application{pendingApps.totalDocs === 1 ? '' : 's'} –{' '}
          <a href="/admin/collections/membership-applications">review them</a>. Setting an application to <em>Accepted</em> creates the member
          {cardGlobal?.autoSendOnAccept ? ' and automatically emails their card (auto-send is ON).' : ' (auto-send of cards is OFF – send manually below).'}
        </p>
      ) : null}
      {!smtpConfigured ? (
        <p className="empty" style={{ marginTop: '1rem' }}>
          Email is not configured yet (SMTP_* in .env) – “Send by email” only logs the message to the server console. Downloads and previews work regardless.
        </p>
      ) : null}

      <section className="intern-section">
        <h2>Membership cards</h2>
        {members.length ? (
          <table className="finance-table intern-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Member</th>
                <th>Type</th>
                <th>Status</th>
                <th>Card last sent</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.memberNumber || '–'}</td>
                  <td>
                    <a href={`/admin/collections/members/${m.id}`}>{m.name}</a>
                    {m.email ? <div className="event-meta">{m.email}</div> : null}
                  </td>
                  <td>{m.membershipType?.name || '–'}</td>
                  <td>
                    <span className={`status ${m.active ? 'status-approved' : 'status-rejected'}`}>{m.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>{m.cardSentAt ? fmtDate(m.cardSentAt, 'en') : '–'}</td>
                  <td className="card-actions">
                    <Link className="btn btn-ghost btn-small" href={`/intern/cards/${m.id}/preview`}>
                      Preview
                    </Link>{' '}
                    <a className="btn btn-ghost btn-small" href={`/intern/cards/${m.id}/pdf`}>
                      PDF
                    </a>{' '}
                    {m.email ? (
                      <form action={sendMembershipCard.bind(null, m.id)} style={{ display: 'inline' }}>
                        <button type="submit" className="btn btn-primary btn-small">
                          Send
                        </button>
                      </form>
                    ) : (
                      <span className="event-meta">no email</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">
            No members yet. <a href="/admin/collections/members/create">Add the first member</a> – or accept a{' '}
            <a href="/admin/collections/membership-applications">membership application</a>.
          </p>
        )}
        <p className="intern-pending" style={{ marginTop: '0.75rem' }}>
          The QR code on each card links to a public verification page. It confirms the membership only while the member is active – deactivate a member and
          the card stops verifying immediately.
        </p>
      </section>

      <section className="intern-section">
        <h2>Event &amp; staff cards</h2>
        {eventCards.length ? (
          <table className="finance-table intern-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Event</th>
                <th>Valid until</th>
                <th>Status</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {eventCards.map((c) => (
                <tr key={c.id}>
                  <td>
                    <a href={`/admin/collections/event-cards/${c.id}`}>{c.personName}</a>
                    {c.email ? <div className="event-meta">{c.email}</div> : null}
                  </td>
                  <td>{c.role}</td>
                  <td>{c.eventLabel || c.event?.title || '–'}</td>
                  <td>{c.validUntil ? fmtDate(c.validUntil, 'en') : '–'}</td>
                  <td>
                    <span className={`status ${c.active ? 'status-approved' : 'status-rejected'}`}>{c.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="card-actions">
                    <Link className="btn btn-ghost btn-small" href={`/intern/cards/event/${c.id}/preview`}>
                      Preview
                    </Link>{' '}
                    <a className="btn btn-ghost btn-small" href={`/intern/cards/event/${c.id}/pdf`}>
                      PDF
                    </a>{' '}
                    {c.email ? (
                      <form action={sendEventCard.bind(null, c.id)} style={{ display: 'inline' }}>
                        <button type="submit" className="btn btn-primary btn-small">
                          Send
                        </button>
                      </form>
                    ) : (
                      <span className="event-meta">no email</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty">
            No event cards yet. <a href="/admin/collections/event-cards/create">Create one</a> – e.g. Security, Organisation or Stage management for your next
            event. They use the same QR verification and can be limited with a “valid until” date.
          </p>
        )}
      </section>
    </>
  )
}
