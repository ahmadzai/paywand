import { headers as nextHeaders } from 'next/headers'
import type { PayloadRequest } from 'payload'
import { getPermissions, type PermissionSet } from '@/access/permissions'
import { getClient } from './payload'

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  reversed: 'Reversed',
}

export type InternSession = {
  user: { id: string | number; name?: string; email: string }
  perms: PermissionSet
  /** May see all bookings and reports (financeEntry alone only sees own bookings). */
  viewAll: boolean
  /** Any finance permission – required for the finance pages. */
  isFinance: boolean
  /** May generate and send membership cards (admins/editors too). */
  canCards: boolean
}

/** Resolves the logged-in user (Payload auth cookie) and their permission flags. */
export async function getInternSession(): Promise<InternSession | null> {
  const payload = await getClient()
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })
  if (!user) return null
  const perms = await getPermissions({ user, payload, context: {} } as unknown as PayloadRequest)
  const isFinance = perms.financeView || perms.financeEntry || perms.financeApprove || perms.financeAdmin
  const canCards = perms.financeAdmin || perms.manageContent || perms.manageUsers
  if (!isFinance && !canCards) return null
  return {
    user: user as InternSession['user'],
    perms,
    viewAll: perms.financeView || perms.financeApprove || perms.financeAdmin,
    isFinance,
    canCards,
  }
}
