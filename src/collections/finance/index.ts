import { APIError } from 'payload'
import type { CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'
import { can, financeRead, getPermissions } from '../../access/permissions'
import { auditHooks } from '../../hooks/audit'

export const SPHERES = [
  { label: 'Ideell (charitable core)', value: 'ideell' },
  { label: 'Vermögensverwaltung (asset management)', value: 'vermoegen' },
  { label: 'Zweckbetrieb (purpose-related operations)', value: 'zweckbetrieb' },
  { label: 'Wirtschaftlicher Geschäftsbetrieb (commercial operations)', value: 'wgb' },
]

const FINANCE_GROUP = 'Finance (internal)'
const financeAny = can('financeView', 'financeEntry', 'financeApprove', 'financeAdmin')

export const Accounts: CollectionConfig = {
  slug: 'accounts',
  labels: { singular: 'Account / Cash box', plural: 'Accounts & cash boxes' },
  admin: { useAsTitle: 'name', group: FINANCE_GROUP, defaultColumns: ['name', 'type', 'openingBalance', 'active'] },
  access: { read: financeAny, create: can('financeAdmin'), update: can('financeAdmin'), delete: can('financeAdmin') },
  hooks: auditHooks('Account'),
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      defaultValue: 'bank',
      options: [
        { label: 'Bank account', value: 'bank' },
        { label: 'Cash box', value: 'cash' },
        { label: 'PayPal / online', value: 'online' },
      ],
    },
    { name: 'iban', label: 'IBAN (optional)', type: 'text' },
    { name: 'openingBalance', label: 'Opening balance (€)', type: 'number', defaultValue: 0, required: true },
    { name: 'openingDate', label: 'Opening balance date', type: 'date', required: true },
    { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true },
  ],
}

export const Categories: CollectionConfig = {
  slug: 'finance-categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: { useAsTitle: 'name', group: FINANCE_GROUP, defaultColumns: ['name', 'type', 'sphere', 'code'] },
  access: { read: financeAny, create: can('financeAdmin'), update: can('financeAdmin'), delete: can('financeAdmin') },
  hooks: auditHooks('Category'),
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'type',
      label: 'Income / Expense',
      type: 'select',
      required: true,
      options: [
        { label: 'Income', value: 'income' },
        { label: 'Expense', value: 'expense' },
      ],
    },
    {
      name: 'sphere',
      label: 'Tax sphere (Sphäre)',
      type: 'select',
      required: true,
      defaultValue: 'ideell',
      options: SPHERES,
      admin: { description: 'Used as the default for every transaction in this category.' },
    },
    { name: 'code', label: 'Account number (e.g. SKR 49, optional)', type: 'text' },
    { name: 'publicLabel', label: 'Label in the transparency report', type: 'text', localized: true },
  ],
}

export const Projects: CollectionConfig = {
  slug: 'finance-projects',
  labels: { singular: 'Project / Grant', plural: 'Projects & grants' },
  admin: { useAsTitle: 'name', group: FINANCE_GROUP, defaultColumns: ['name', 'funder', 'budget', 'status'] },
  access: { read: financeAny, create: can('financeAdmin'), update: can('financeAdmin'), delete: can('financeAdmin') },
  hooks: auditHooks('Project'),
  fields: [
    { name: 'name', label: 'Project name', type: 'text', required: true },
    { name: 'code', label: 'Code / reference number', type: 'text' },
    { name: 'funder', label: 'Funding body', type: 'text' },
    { name: 'budget', label: 'Approved budget (€)', type: 'number' },
    {
      type: 'row',
      fields: [
        { name: 'startDate', label: 'Start', type: 'date' },
        { name: 'endDate', label: 'End', type: 'date' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Ongoing', value: 'active' },
        { label: 'Completed', value: 'closed' },
      ],
    },
    { name: 'notes', label: 'Notes (e.g. grant conditions for the proof of use)', type: 'textarea' },
  ],
}

export const Receipts: CollectionConfig = {
  slug: 'receipts',
  labels: { singular: 'Receipt', plural: 'Receipts' },
  admin: { group: FINANCE_GROUP, useAsTitle: 'filename', description: 'Invoices, receipts, bank statements. Visible to finance users only.' },
  access: {
    read: financeAny,
    create: can('financeEntry', 'financeAdmin'),
    update: can('financeAdmin'),
    delete: can('financeAdmin'),
  },
  hooks: auditHooks('Receipt'),
  upload: {
    staticDir: 'private/receipts',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [{ name: 'note', label: 'Note', type: 'text' }],
}

export const FinancePeriods: CollectionConfig = {
  slug: 'finance-periods',
  labels: { singular: 'Financial year', plural: 'Financial years / Closing' },
  admin: {
    useAsTitle: 'year',
    group: FINANCE_GROUP,
    defaultColumns: ['year', 'locked', 'auditDate'],
    description: 'After the cash audit (Kassenprüfung), lock the year – no further transactions are possible in that year.',
  },
  access: { read: financeAny, create: can('financeAdmin'), update: can('financeAdmin'), delete: () => false },
  hooks: {
    ...auditHooks('Financial year'),
    beforeChange: [
      ({ data, originalDoc, req }) => {
        if (data.locked && !originalDoc?.locked) {
          data.lockedBy = req.user?.id
          data.lockedAt = new Date().toISOString()
        }
        if (originalDoc?.locked && data.locked === false && !(req.user as any)?.isSuperAdmin) {
          throw new APIError('A locked financial year can only be reopened by a super admin.', 403)
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'year', label: 'Year', type: 'number', required: true, unique: true },
    { name: 'locked', label: 'Locked (closed)', type: 'checkbox', defaultValue: false },
    { name: 'auditDate', label: 'Date of the cash audit (Kassenprüfung)', type: 'date' },
    { name: 'auditors', label: 'Cash auditors (Kassenprüfer/innen)', type: 'text' },
    { name: 'report', label: 'Audit report (PDF)', type: 'upload', relationTo: 'receipts' },
    { name: 'lockedBy', type: 'relationship', relationTo: 'users', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'lockedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
  ],
}

/* ------------------------------------------------------------------ */
/* Buchungen                                                          */
/* ------------------------------------------------------------------ */

const KEY_FIELDS = ['date', 'type', 'amount', 'account', 'category', 'sphere', 'project', 'counterparty', 'description']
const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

const transactionBeforeChange: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (req.context?.system) return data
  const perms = await getPermissions(req)
  const settings: any = await req.payload.findGlobal({ slug: 'finance-settings', overrideAccess: true, req })
  const required = Number(settings?.approvalsRequired ?? 1)
  const merged = { ...(originalDoc || {}), ...data }

  // 1) Geschäftsjahr gesperrt?
  const year = new Date(merged.date).getFullYear()
  const period = await req.payload.find({
    collection: 'finance-periods',
    where: { year: { equals: year } },
    limit: 1,
    overrideAccess: true,
    req,
  })
  if ((period.docs[0] as any)?.locked) {
    throw new APIError(`The financial year ${year} is closed. Please record a correcting transaction in the current year.`, 400)
  }

  // 2) Freigegebene Buchungen sind unveränderlich
  if (originalDoc && ['approved', 'reversed'].includes(originalDoc.status)) {
    throw new APIError('Approved transactions cannot be changed. Please create a reversal (storno) transaction.', 400)
  }

  if (operation === 'create') {
    data.createdBy = req.user?.id
    data.approvals = []
    if (!['draft', 'submitted'].includes(data.status)) data.status = 'draft'

    // Fortlaufende Belegnummer je Jahr, z. B. 2026-0007
    const { totalDocs } = await req.payload.count({
      collection: 'transactions',
      where: { receiptNumber: { like: `${year}-` } },
      overrideAccess: true,
      req,
    })
    data.receiptNumber = `${year}-${String(totalDocs + 1).padStart(4, '0')}`

    // Storno: Gegenbuchung aus Original übernehmen
    if (data.reversalOf) {
      const orig: any = await req.payload.findByID({ collection: 'transactions', id: idOf(data.reversalOf), overrideAccess: true, req })
      if (orig.status !== 'approved') throw new APIError('Only approved transactions can be reversed.', 400)
      Object.assign(data, {
        type: orig.type === 'income' ? 'expense' : 'income',
        amount: orig.amount,
        account: idOf(orig.account),
        category: idOf(orig.category),
        sphere: orig.sphere,
        project: idOf(orig.project),
        counterparty: orig.counterparty,
        description: `REVERSAL (storno) of ${orig.receiptNumber}: ${data.description || orig.description}`,
      })
    }
  }

  // 3) Sphäre aus Kategorie vorbelegen
  if (!merged.sphere && merged.category) {
    const cat: any = await req.payload.findByID({ collection: 'finance-categories', id: idOf(merged.category), overrideAccess: true, req })
    data.sphere = cat?.sphere
  }

  // 4) Inhaltliche Änderung setzt bisherige Freigaben zurück
  if (originalDoc && (originalDoc.approvals?.length ?? 0) > 0) {
    const changed = KEY_FIELDS.some((f) => f in data && JSON.stringify(idOf(data[f])) !== JSON.stringify(idOf(originalDoc[f])))
    if (changed) {
      data.approvals = []
      if (merged.status === 'submitted') data.status = 'submitted'
    }
  }

  // 5) Einreichen: Beleg erforderlich?
  const submitting = merged.status === 'submitted' || data.approveNow
  if (submitting && settings?.requireReceipt !== false) {
    const receipts = (merged.receipts || []).filter(Boolean)
    if (!receipts.length) throw new APIError('Please upload at least one receipt before submitting the transaction.', 400)
  }

  // 6) Ablehnen
  if (data.rejectNow) {
    if (!perms.financeApprove) throw new APIError('No permission to reject.', 403)
    if (!data.rejectionReason && !originalDoc?.rejectionReason) throw new APIError('Please provide a rejection reason.', 400)
    data.status = 'rejected'
    data.approvals = []
  }

  // 7) Freigeben (Vier-Augen-Prinzip, 1 oder 2 Freigaben je nach Einstellung)
  if (data.approveNow && !data.rejectNow) {
    if (!perms.financeApprove) throw new APIError('No permission to approve.', 403)
    const creator = idOf(merged.createdBy)
    if (!settings?.allowSelfApproval && String(creator) === String(req.user?.id)) {
      throw new APIError('Four-eyes principle (Vier-Augen-Prinzip): your own transactions can only be approved by another person.', 403)
    }
    const approvals = [...(data.approvals ?? originalDoc?.approvals ?? [])]
    if (approvals.some((a: any) => String(idOf(a.user)) === String(req.user?.id))) {
      throw new APIError('You have already approved this transaction.', 400)
    }
    approvals.push({ user: req.user?.id, approvedAt: new Date().toISOString() })
    data.approvals = approvals
    data.status = approvals.length >= required ? 'approved' : 'submitted'
    // Die Status-Validierung lehnt „approved“ ab, außer die Freigabe kam aus diesem Hook
    if (data.status === 'approved' && req.context) (req.context as any).workflowApproval = true
  }

  data.approveNow = false
  data.rejectNow = false
  return data
}

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  labels: { singular: 'Transaction', plural: 'Transactions (cash book)' },
  admin: {
    useAsTitle: 'receiptNumber',
    group: FINANCE_GROUP,
    defaultColumns: ['receiptNumber', 'date', 'type', 'amount', 'counterparty', 'category', 'status'],
    listSearchableFields: ['receiptNumber', 'counterparty', 'description'],
    description: 'Workflow: Draft → Submitted → Approved. Approved transactions are immutable; corrections via a reversal (storno) transaction.',
  },
  defaultSort: '-date',
  access: {
    read: financeRead,
    create: can('financeEntry', 'financeAdmin'),
    update: async ({ req }) => {
      const p = await getPermissions(req)
      const notFinal: Where = { status: { not_in: ['approved', 'reversed'] } }
      if (p.financeAdmin || p.financeApprove) return notFinal
      if (p.financeEntry && req.user) return { and: [notFinal, { createdBy: { equals: req.user.id } }] }
      return false
    },
    delete: async ({ req }) => {
      const p = await getPermissions(req)
      if (!p.financeAdmin) return false
      return { status: { in: ['draft', 'rejected'] } }
    },
  },
  hooks: {
    beforeChange: [transactionBeforeChange],
    afterChange: [
      ...auditHooks('Transaction').afterChange,
      async ({ doc, previousDoc, req }) => {
        // Wird eine Stornobuchung freigegeben, wird das Original als „storniert“ markiert
        if (doc.reversalOf && doc.status === 'approved' && previousDoc?.status !== 'approved') {
          await req.payload.update({
            collection: 'transactions',
            id: idOf(doc.reversalOf),
            data: { status: 'reversed' },
            overrideAccess: true,
            context: { system: true },
            req,
          })
        }
        return doc
      },
    ],
    afterDelete: auditHooks('Transaction').afterDelete,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { width: '33%' } },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          options: [
            { label: 'Income', value: 'income' },
            { label: 'Expense', value: 'expense' },
          ],
          admin: { width: '33%' },
        },
        { name: 'amount', label: 'Amount (€)', type: 'number', required: true, min: 0.01, admin: { step: 0.01, width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'account', label: 'Account / Cash box', type: 'relationship', relationTo: 'accounts', required: true, admin: { width: '50%' } },
        { name: 'category', label: 'Category', type: 'relationship', relationTo: 'finance-categories', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'sphere', label: 'Tax sphere (Sphäre)', type: 'select', options: SPHERES, admin: { width: '50%', description: 'Leave empty = taken from the category' } },
        { name: 'project', label: 'Project / Grant', type: 'relationship', relationTo: 'finance-projects', admin: { width: '50%' } },
      ],
    },
    { name: 'counterparty', label: 'Counterparty (payee/payer)', type: 'text', required: true },
    { name: 'description', label: 'Purpose / description', type: 'textarea', required: true },
    {
      name: 'receipts',
      label: 'Receipts',
      type: 'upload',
      relationTo: 'receipts',
      hasMany: true,
      admin: { description: 'Photo or PDF of the invoice / receipt.' },
    },
    { name: 'reversalOf', label: 'Reversal of transaction', type: 'relationship', relationTo: 'transactions', admin: { description: 'For corrections only: select the original; the values are reversed automatically.' } },

    // Sidebar: Workflow
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Submitted (awaiting approval)', value: 'submitted' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Reversed', value: 'reversed' },
      ],
      admin: { position: 'sidebar', description: 'Set to “Submitted” to submit.' },
      validate: (val: any, { req }: any) => {
        if (req?.context?.system || req?.context?.workflowApproval) return true
        if (val === 'approved' || val === 'reversed') {
          return 'Please approve via “Approve this transaction”; corrections via a reversal (storno) transaction.'
        }
        return true
      },
    },
    { name: 'receiptNumber', label: 'Receipt number', type: 'text', unique: true, admin: { position: 'sidebar', readOnly: true } },
    { name: 'approveNow', label: '✔ Approve this transaction', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'rejectNow', label: '✖ Reject transaction', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'rejectionReason', label: 'Rejection reason', type: 'textarea', admin: { position: 'sidebar' } },
    {
      name: 'approvals',
      label: 'Approvals',
      type: 'array',
      admin: { position: 'sidebar', readOnly: true },
      fields: [
        { name: 'user', type: 'relationship', relationTo: 'users' },
        { name: 'approvedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'createdBy', label: 'Created by', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
  ],
}
