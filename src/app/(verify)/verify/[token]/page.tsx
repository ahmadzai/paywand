import { LogoSymbol } from '@/components/site/Brand'
import { fmtDate } from '@/lib/format'
import { getClient } from '@/lib/payload'

const isActiveMember = (m: any) => Boolean(m?.active) && (!m.leftOn || new Date(m.leftOn) > new Date())
const isActiveEventCard = (c: any) => Boolean(c?.active) && (!c.validUntil || new Date(c.validUntil) > new Date())

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  let member: any = null
  let eventCard: any = null
  if (/^[a-f0-9]{16,64}$/i.test(token)) {
    const payload = await getClient()
    const res = await payload.find({ collection: 'members', where: { cardToken: { equals: token } }, limit: 1, depth: 1, overrideAccess: true })
    member = res.docs[0] ?? null
    if (!member) {
      const ec = await payload.find({ collection: 'event-cards', where: { cardToken: { equals: token } }, limit: 1, depth: 1, overrideAccess: true })
      eventCard = ec.docs[0] ?? null
    }
  }
  const valid = member ? isActiveMember(member) : eventCard ? isActiveEventCard(eventCard) : false

  return (
    <div className="verify-wrap">
      <div className={`verify-card ${valid ? 'verify-valid' : 'verify-invalid'}`}>
        <div className="verify-brand">
          <LogoSymbol size={56} />
          <div>
            <strong>Paywand e.V.</strong>
            <span>Membership verification · Mitgliedschaftsprüfung</span>
          </div>
        </div>
        {valid && member ? (
          <>
            <p className="verify-status">✓ Valid membership</p>
            <p className="verify-status-sub">Gültige Mitgliedschaft</p>
            <table className="info-table">
              <tbody>
                <tr><th>Name</th><td>{member.name}</td></tr>
                <tr><th>Member no.</th><td>{member.memberNumber}</td></tr>
                {member.membershipType?.name ? <tr><th>Type</th><td>{member.membershipType.name}</td></tr> : null}
                {member.joinedOn ? <tr><th>Member since</th><td>{fmtDate(member.joinedOn, 'en')}</td></tr> : null}
              </tbody>
            </table>
            <p className="verify-note">Checked live against the member register · Stand: {fmtDate(new Date(), 'en')}</p>
          </>
        ) : valid && eventCard ? (
          <>
            <p className="verify-status">✓ Valid event card</p>
            <p className="verify-status-sub">Gültige Veranstaltungskarte</p>
            <table className="info-table">
              <tbody>
                <tr><th>Name</th><td>{eventCard.personName}</td></tr>
                <tr><th>Role</th><td>{eventCard.role}</td></tr>
                {eventCard.eventLabel || eventCard.event?.title ? <tr><th>Event</th><td>{eventCard.eventLabel || eventCard.event?.title}</td></tr> : null}
                {eventCard.validUntil ? <tr><th>Valid until</th><td>{fmtDate(eventCard.validUntil, 'en')}</td></tr> : null}
              </tbody>
            </table>
            <p className="verify-note">Checked live · Stand: {fmtDate(new Date(), 'en')}</p>
          </>
        ) : (
          <>
            <p className="verify-status">✕ Not valid</p>
            <p className="verify-status-sub">Nicht (mehr) gültig</p>
            <p className="verify-note">
              This card is not (or no longer) linked to an active membership or event accreditation of Paywand e.V. If you believe this is an error, please
              contact the association.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
