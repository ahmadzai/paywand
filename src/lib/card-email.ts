import type { Payload } from 'payload'
import { loadCardData, loadEventCardData, renderCardPdf, renderCardPngs } from './card'

const paragraphs = (text: string) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('\n')

/** Renders a MEMBER card and emails it (PDF + PNGs). Returns false when the member has no email.
 *  Pass `req` when calling from a hook so reads join the current transaction. */
export async function emailMemberCard(payload: Payload, memberId: string | number, opts: { welcome?: boolean; req?: any } = {}): Promise<boolean> {
  const card = await loadCardData(payload, memberId, opts.req)
  if (!card?.member?.email) return false
  const de = card.data.lang === 'de'
  const cardGlobal: any = await payload.findGlobal({ slug: 'membership-card', depth: 0, locale: card.data.lang, req: opts.req })
  const [pdf, pngs] = await Promise.all([renderCardPdf(card.data), renderCardPngs(card.data)])
  const safe = (card.data.meta || 'card').toLowerCase()
  const welcome = opts.welcome && cardGlobal?.welcomeText ? paragraphs(cardGlobal.welcomeText) : ''
  const name = card.member.name
  const org = card.data.verein.officialName
  await payload.sendEmail({
    to: card.member.email,
    subject: opts.welcome
      ? de
        ? `Willkommen bei ${org}`
        : `Welcome to ${org}`
      : de
        ? `Dein Mitgliedsausweis – ${org}`
        : `Your ${org} membership card`,
    html: de
      ? `<p>Liebe/r ${name},</p>
${welcome || '<p>anbei findest du deinen digitalen Mitgliedsausweis (PDF zum Drucken, PNG fürs Handy).</p>'}
<p>Der QR-Code auf dem Ausweis bestätigt deine Mitgliedschaft jederzeit online.</p>
<p>Herzliche Grüße<br/>${org}</p>`
      : `<p>Dear ${name},</p>
${welcome || '<p>attached you find your digital membership card (PDF for printing, PNG for your phone).</p>'}
<p>The QR code on the card confirms your membership online at any time.</p>
<p>Warm regards<br/>${org}</p>`,
    attachments: [
      { filename: `paywand-card-${safe}.pdf`, content: pdf },
      { filename: `paywand-card-${safe}-front.png`, content: pngs.front },
      { filename: `paywand-card-${safe}-back.png`, content: pngs.back },
    ],
  })
  await payload.update({ collection: 'members', id: memberId, data: { cardSentAt: new Date().toISOString() } as any, overrideAccess: true, req: opts.req })
  return true
}

/** Renders an EVENT/staff card and emails it. Returns false when the card has no email. */
export async function emailEventCard(payload: Payload, cardId: string | number): Promise<boolean> {
  const card = await loadEventCardData(payload, cardId)
  if (!card?.card?.email) return false
  const [pdf, pngs] = await Promise.all([renderCardPdf(card.data), renderCardPngs(card.data)])
  const de = card.data.lang === 'de'
  const org = card.data.verein.officialName
  await payload.sendEmail({
    to: card.card.email,
    subject: de
      ? `Dein Ausweis für ${card.data.meta} – ${org}`
      : `Your ${card.data.meta} ${card.data.label} card – ${org}`,
    html: de
      ? `<p>Liebe/r ${card.card.personName},</p>
<p>anbei findest du deinen Ausweis für <strong>${card.data.meta}</strong> (Rolle: ${card.data.label}).</p>
<p>Der QR-Code auf dem Ausweis kann bei der Veranstaltung gescannt und geprüft werden.</p>
<p>Herzliche Grüße<br/>${org}</p>`
      : `<p>Dear ${card.card.personName},</p>
<p>attached you find your card for <strong>${card.data.meta}</strong> (role: ${card.data.label}).</p>
<p>The QR code on the card can be scanned to verify it at the event.</p>
<p>Warm regards<br/>${org}</p>`,
    attachments: [
      { filename: `paywand-event-card.pdf`, content: pdf },
      { filename: `paywand-event-card-front.png`, content: pngs.front },
      { filename: `paywand-event-card-back.png`, content: pngs.back },
    ],
  })
  await payload.update({ collection: 'event-cards', id: cardId, data: { cardSentAt: new Date().toISOString() } as any, overrideAccess: true })
  return true
}
