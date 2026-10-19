import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'
import { sendEventCard } from '../../../../../actions'

export const metadata = { title: 'Event card preview' }

export default async function EventCardPreview({ params }: { params: Promise<{ id: string }> }) {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern%2Fcards')
  if (!session.canCards) redirect('/intern')
  const { id } = await params
  const payload = await getClient()
  const card: any = await payload.findByID({ collection: 'event-cards', id, depth: 0, overrideAccess: true }).catch(() => null)
  if (!card) notFound()

  return (
    <>
      <div className="intern-title-row">
        <h1>Event card – {card.personName} ({card.role})</h1>
        <p className="intern-actions">
          <a className="btn btn-ghost btn-small" href={`/intern/cards/event/${id}/png`}>
            Download PNG
          </a>{' '}
          <a className="btn btn-ghost btn-small" href={`/intern/cards/event/${id}/pdf`}>
            Download PDF
          </a>{' '}
          {card.email ? (
            <form action={sendEventCard.bind(null, card.id)} style={{ display: 'inline' }}>
              <button type="submit" className="btn btn-primary btn-small">
                Send by email
              </button>
            </form>
          ) : null}{' '}
          <Link className="btn btn-ghost btn-small" href="/intern/cards">
            ← All cards
          </Link>
        </p>
      </div>
      <section className="intern-section card-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/intern/cards/event/${id}/png?inline=1`} alt={`Event card of ${card.personName}, front and back`} />
      </section>
    </>
  )
}
