import type { CollectionConfig, FieldAccess } from 'payload'
import { PERMISSIONS, can, getPermissions, hasPermission } from '../../access/permissions'
import { auditHooks } from '../../hooks/audit'

const superAdminOnly: FieldAccess = ({ req }) => Boolean((req.user as any)?.isSuperAdmin)
const userManagersOnly: FieldAccess = async ({ req }) => hasPermission(req, 'manageUsers')

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'User', plural: 'Users' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'System',
  },
  auth: {
    tokenExpiration: 60 * 60 * 2, // 2 Stunden
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 Minuten Sperre nach 5 Fehlversuchen
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: async ({ req }) => {
      if (!req.user) return false
      if (await hasPermission(req, 'manageUsers')) return true
      return { id: { equals: req.user.id } }
    },
    create: can('manageUsers'),
    update: async ({ req }) => {
      if (!req.user) return false
      if (await hasPermission(req, 'manageUsers')) return true
      return { id: { equals: req.user.id } }
    },
    delete: can('manageUsers'),
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, data }) => {
        // Der allererste Benutzer wird automatisch Super-Admin
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
          if (totalDocs === 0) data.isSuperAdmin = true
        }
        return data
      },
    ],
    ...auditHooks('User'),
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'roles',
      label: 'Roles',
      type: 'relationship',
      relationTo: 'roles',
      hasMany: true,
      access: { create: userManagersOnly, update: userManagersOnly },
      admin: { description: 'Permissions are combined from all assigned roles.' },
    },
    {
      name: 'isSuperAdmin',
      label: 'Super admin (all permissions)',
      type: 'checkbox',
      defaultValue: false,
      access: { create: superAdminOnly, update: superAdminOnly },
      admin: { position: 'sidebar' },
    },
  ],
}

export const Roles: CollectionConfig = {
  slug: 'roles',
  labels: { singular: 'Role', plural: 'Roles' },
  admin: {
    useAsTitle: 'name',
    group: 'System',
    description:
      'Define roles freely and grant permissions via checkboxes, e.g. “Treasurer”, “Cash auditor (Kassenprüfer/in)”, “Editorial team”.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: can('manageUsers'),
    update: can('manageUsers'),
    delete: can('manageUsers'),
  },
  hooks: auditHooks('Role'),
  fields: [
    { name: 'name', label: 'Role name', type: 'text', required: true, unique: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'permissions',
      label: 'Permissions',
      type: 'group',
      fields: Object.entries(PERMISSIONS).map(([name, label]) => ({
        name,
        label,
        type: 'checkbox' as const,
        defaultValue: false,
      })),
    },
  ],
}

export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Log entry', plural: 'Audit log' },
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['createdAt', 'action', 'summary', 'user'],
    group: 'System',
    description: 'Immutable log of all changes to finance data, users and roles.',
  },
  access: {
    read: async ({ req }) => {
      const p = await getPermissions(req)
      return p.financeAdmin || p.manageUsers
    },
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'collectionSlug', label: 'Area', type: 'text', index: true },
    { name: 'documentId', label: 'Record ID', type: 'text', index: true },
    {
      name: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { label: 'Created', value: 'create' },
        { label: 'Updated', value: 'update' },
        { label: 'Deleted', value: 'delete' },
      ],
    },
    { name: 'user', label: 'User', type: 'relationship', relationTo: 'users' },
    { name: 'summary', label: 'Summary', type: 'text' },
    { name: 'changes', label: 'Changes', type: 'json' },
  ],
}
