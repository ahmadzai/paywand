'use server'

import { revalidatePath } from 'next/cache'
import { headers as nextHeaders } from 'next/headers'
import type { PayloadRequest } from 'payload'
import { getPermissions } from '@/access/permissions'
import { getClient } from '@/lib/payload'

/** Records one month's membership contribution; the collection hooks handle the
 *  amount default, the duplicate check and the linked draft transaction. */
export async function recordContribution(memberId: string | number, year: number, month: string) {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) return
  const perms = await getPermissions({ user, payload, context: {} } as unknown as PayloadRequest)
  if (!perms.financeEntry && !perms.financeAdmin) return
  try {
    await payload.create({
      collection: 'member-contributions',
      data: { member: memberId, year, month } as any,
      user,
      overrideAccess: false,
    })
  } catch {
    // duplicate or validation error – the page re-renders with the current state anyway
  }
  revalidatePath('/intern/contributions')
}

/** Renders a member's card and emails it as PDF + PNG attachment. */
export async function sendMembershipCard(memberId: string | number) {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) return
  const perms = await getPermissions({ user, payload, context: {} } as unknown as PayloadRequest)
  if (!perms.financeAdmin && !perms.manageContent && !perms.manageUsers) return
  const { emailMemberCard } = await import('@/lib/card-email')
  await emailMemberCard(payload, memberId)
  revalidatePath('/intern/cards')
}

/** Renders an event/staff card and emails it. */
export async function sendEventCard(cardId: string | number) {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) return
  const perms = await getPermissions({ user, payload, context: {} } as unknown as PayloadRequest)
  if (!perms.financeAdmin && !perms.manageContent && !perms.manageUsers) return
  const { emailEventCard } = await import('@/lib/card-email')
  await emailEventCard(payload, cardId)
  revalidatePath('/intern/cards')
}

/** Marks a donation's receipt (Zuwendungsbestätigung) as issued today. */
export async function markDonationReceiptIssued(donationId: string | number) {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) return
  const perms = await getPermissions({ user, payload, context: {} } as unknown as PayloadRequest)
  if (!perms.financeAdmin) return
  try {
    await payload.update({
      collection: 'donations',
      id: donationId,
      data: { receiptIssuedOn: new Date().toISOString() } as any,
      user,
      overrideAccess: false,
    })
  } catch {
    // ignore – page re-renders with current state
  }
  revalidatePath('/intern/donations')
}
