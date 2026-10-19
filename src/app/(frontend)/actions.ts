'use server'

import { getClient } from '@/lib/payload'

export type FormState = { ok: boolean; error?: boolean } | null

const str = (fd: FormData, key: string, max = 2000) => String(fd.get(key) ?? '').trim().slice(0, max)

/** Simple bot protection: hidden honeypot field + minimum fill time. */
function looksLikeBot(fd: FormData) {
  if (str(fd, 'website')) return true
  const started = Number(fd.get('_t') || 0)
  return started > 0 && Date.now() - started < 2500
}

export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  if (looksLikeBot(fd)) return { ok: true }
  const data = { name: str(fd, 'name', 200), email: str(fd, 'email', 200), subject: str(fd, 'subject', 200), message: str(fd, 'message', 5000) }
  if (!data.name || !data.email || !data.subject || !data.message || fd.get('consent') !== 'on') return { ok: false, error: true }
  const payload = await getClient()
  await payload.create({ collection: 'contact-messages', data, overrideAccess: true })
  return { ok: true }
}

export async function submitMembership(_prev: FormState, fd: FormData): Promise<FormState> {
  if (looksLikeBot(fd)) return { ok: true }
  const payload = await getClient()
  // Membership types are admin-defined; only accept an id that actually exists
  const typeId = Number(str(fd, 'membershipType', 20))
  const type = Number.isInteger(typeId)
    ? await payload.findByID({ collection: 'membership-types', id: typeId, overrideAccess: true }).catch(() => null)
    : null
  const data = {
    name: str(fd, 'name', 200),
    email: str(fd, 'email', 200),
    phone: str(fd, 'phone', 100),
    street: str(fd, 'street', 200),
    postalCode: str(fd, 'postalCode', 20),
    city: str(fd, 'city', 100),
    membershipType: type ? type.id : undefined,
    message: str(fd, 'message', 3000),
  }
  if (!data.name || !data.email || !data.phone || !data.street || !data.postalCode || !data.city || !data.message || fd.get('consent') !== 'on') {
    return { ok: false, error: true }
  }
  await payload.create({ collection: 'membership-applications', data: data as any, overrideAccess: true })
  return { ok: true }
}

export async function submitRegistration(_prev: FormState, fd: FormData): Promise<FormState> {
  if (looksLikeBot(fd)) return { ok: true }
  const eventId = str(fd, 'event', 50)
  const data = {
    name: str(fd, 'name', 200),
    email: str(fd, 'email', 200),
    phone: str(fd, 'phone', 100),
    participants: Math.min(Math.max(Number(fd.get('participants')) || 1, 1), 20),
    message: str(fd, 'message', 2000),
  }
  if (!eventId || !data.name || (!data.email && !data.phone) || fd.get('consent') !== 'on') return { ok: false, error: true }
  const payload = await getClient()
  const event: any = await payload.findByID({ collection: 'events', id: eventId }).catch(() => null)
  if (!event?.registrationEnabled) return { ok: false, error: true }
  await payload.create({ collection: 'event-registrations', data: { ...data, event: event.id }, overrideAccess: true })
  return { ok: true }
}
