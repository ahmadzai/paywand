import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

const IGNORED = new Set(['updatedAt', 'createdAt', 'hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration', 'sessions', 'loginAttempts', 'lockUntil'])

function idOf(v: unknown) {
  return v && typeof v === 'object' && 'id' in (v as any) ? (v as any).id : v
}

function diff(prev: Record<string, any> = {}, next: Record<string, any> = {}) {
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)])
  for (const k of keys) {
    if (IGNORED.has(k)) continue
    const a = JSON.stringify(Array.isArray(prev[k]) ? prev[k].map(idOf) : idOf(prev[k]))
    const b = JSON.stringify(Array.isArray(next[k]) ? next[k].map(idOf) : idOf(next[k]))
    if (a !== b) changes[k] = { from: prev[k] ?? null, to: next[k] ?? null }
  }
  return changes
}

/**
 * Writes an entry to the read-only "audit-log" collection for every create, update
 * and delete. Nobody (not even admins) can edit or delete audit entries via the UI or API.
 */
export const auditAfterChange =
  (label: string): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, operation, req, collection }) => {
    try {
      const changes = operation === 'create' ? {} : diff(previousDoc, doc)
      if (operation === 'update' && Object.keys(changes).length === 0) return doc
      await req.payload.create({
        collection: 'audit-log',
        data: {
          collectionSlug: collection.slug,
          documentId: String(doc.id),
          action: operation,
          user: req.user?.id ?? null,
          summary: `${label}: ${doc.title || doc.name || doc.receiptNumber || doc.email || doc.id}`,
          changes,
        },
        overrideAccess: true,
        req,
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Audit log write failed' })
    }
    return doc
  }

export const auditAfterDelete =
  (label: string): CollectionAfterDeleteHook =>
  async ({ doc, req, collection }) => {
    try {
      await req.payload.create({
        collection: 'audit-log',
        data: {
          collectionSlug: collection.slug,
          documentId: String(doc.id),
          action: 'delete',
          user: req.user?.id ?? null,
          summary: `${label} deleted: ${doc.title || doc.name || doc.receiptNumber || doc.id}`,
          changes: { deleted: { from: doc, to: null } },
        },
        overrideAccess: true,
        req,
      })
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Audit log write failed' })
    }
    return doc
  }

export const auditHooks = (label: string) => ({
  afterChange: [auditAfterChange(label)],
  afterDelete: [auditAfterDelete(label)],
})
