import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'
import { sendMembershipCard } from '../../../../actions'

export const metadata = { title: 'Card preview' }

export default async function CardPreview({ params }: { params: Promise<{ id: string }> }) {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern%2Fcards')
  if (!session.canCards) redirect('/intern')
  const { id } = await params
  const payload = await getClient()
  const member: any = await payload.findByID({ collection: 'members', id, depth: 0, overrideAccess: true }).catch(() => null)
  if (!member) notFound()

  return (
    <>
      <div className="intern-title-row">
        <h1>Card preview – {member.name}</h1>
        <p className="intern-actions">
          <a className="btn btn-ghost btn-small" href={`/intern/cards/${id}/png`}>
            Download PNG
          </a>{' '}
          <a className="btn btn-ghost btn-small" href={`/intern/cards/${id}/pdf`}>
            Download PDF
          </a>{' '}
          {member.email ? (
            <form action={sendMembershipCard.bind(null, member.id)} style={{ display: 'inline' }}>
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
        <img src={`/intern/cards/${id}/png?inline=1`} alt={`Membership card of ${member.name}, front and back`} />
      </section>
    </>
  )
}
