import type { Access, PayloadRequest, Where } from 'payload'

/**
 * Permission flags. Roles (collection "roles") are freely definable in the admin panel;
 * each role switches a set of these flags on. A user can hold several roles —
 * their permissions are combined.
 */
export const PERMISSIONS = {
  manageContent: 'Edit website content (offerings, events, news, media)',
  manageSettings: 'Edit association data & settings (logo, statutes, legal notice)',
  manageBoard: 'Manage board & board roles',
  manageUsers: 'Manage users & roles',
  viewSubmissions: 'View registrations, membership applications & messages',
  financeView: 'View finances (all transactions, reports)',
  financeEntry: 'Enter transactions & upload receipts',
  financeApprove: 'Approve / reject transactions',
  financeAdmin: 'Finance administration (accounts, categories, projects, year-end closing, settings)',
} as const

export type Permission = keyof typeof PERMISSIONS
export type PermissionSet = Record<Permission, boolean>

const NONE: PermissionSet = Object.fromEntries(
  Object.keys(PERMISSIONS).map((k) => [k, false]),
) as PermissionSet
const ALL: PermissionSet = Object.fromEntries(
  Object.keys(PERMISSIONS).map((k) => [k, true]),
) as PermissionSet

type UserLike = { id: string | number; isSuperAdmin?: boolean | null; roles?: unknown } | null

export async function getPermissions(req: PayloadRequest): Promise<PermissionSet> {
  const user = req.user as UserLike
  if (!user) return NONE
  if (user.isSuperAdmin) return ALL

  const cacheKey = `__perms_${user.id}`
  if (req.context?.[cacheKey]) return req.context[cacheKey] as PermissionSet

  const roleRefs = Array.isArray(user.roles) ? user.roles : []
  const ids = roleRefs
    .map((r: any) => (r && typeof r === 'object' ? r.id : r))
    .filter((id: unknown) => id !== null && id !== undefined)

  const result: PermissionSet = { ...NONE }
  if (ids.length) {
    const roles = await req.payload.find({
      collection: 'roles',
      where: { id: { in: ids } },
      depth: 0,
      limit: 100,
      overrideAccess: true,
      req,
    })
    for (const role of roles.docs as any[]) {
      for (const key of Object.keys(PERMISSIONS) as Permission[]) {
        if (role.permissions?.[key]) result[key] = true
      }
    }
  }
  // financeAdmin implies the other finance rights
  if (result.financeAdmin) {
    result.financeView = true
    result.financeEntry = true
    result.financeApprove = true
  }
  if (req.context) req.context[cacheKey] = result
  return result
}

export const hasPermission = async (req: PayloadRequest, ...perms: Permission[]) => {
  const p = await getPermissions(req)
  return perms.some((perm) => p[perm])
}

/** Access helper: allowed if the user holds ANY of the given permissions. */
export const can =
  (...perms: Permission[]): Access =>
  async ({ req }) =>
    hasPermission(req, ...perms)

export const anyone: Access = () => true
export const loggedIn: Access = ({ req }) => Boolean(req.user)

export const isFinanceUser = async (req: PayloadRequest) =>
  hasPermission(req, 'financeView', 'financeEntry', 'financeApprove', 'financeAdmin')

/** Finance read: viewers see all, pure "entry" users only see their own records. */
export const financeRead: Access = async ({ req }) => {
  const p = await getPermissions(req)
  if (p.financeView || p.financeApprove || p.financeAdmin) return true
  if (p.financeEntry && req.user) {
    const own: Where = { createdBy: { equals: req.user.id } }
    return own
  }
  return false
}
