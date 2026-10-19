import { randomBytes } from 'node:crypto'
import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'
import { anyone, can } from '../../access/permissions'
import { auditHooks } from '../../hooks/audit'

const FINANCE_GROUP = 'Finance (internal)'
const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

export const MONTH_OPTIONS = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
]

const financeRead = can('financeView', 'financeEntry', 'financeApprove', 'financeAdmin')

/**
 * Creates a linked DRAFT income transaction for a contribution or donation, using the
 * defaults from FinanceSettings. Returns the transaction id, or null when the defaults
 * are not configured. The draft then goes through the normal submit/approve workflow.
 */
async function createDraftIncome(
  req: PayloadRequest,
  args: { date: string; amount: number; counterparty: string; description: string; settingsField: 'contributionCategory' | 'donationCategory' },
): Promise<string | number | null> {
  const settings: any = await req.payload.findGlobal({ slug: 'finance-settings', overrideAccess: true, req })
  const account = idOf(settings?.autoBooking?.defaultAccount)
  const category = idOf(settings?.autoBooking?.[args.settingsField])
  if (!account || !category) return null
  const tx = await req.payload.create({
    collection: 'transactions',
    data: {
      date: args.date,
      type: 'income',
      amount: args.amount,
      account,
      category,
      counterparty: args.counterparty,
      description: args.description,
      status: 'draft',
    } as any,
    overrideAccess: true,
    req,
  })
  return tx.id
}

export const MembershipTypes: CollectionConfig = {
  slug: 'membership-types',
  labels: { singular: 'Membership type', plural: 'Membership types' },
  admin: {
    group: FINANCE_GROUP,
    useAsTitle: 'name',
    defaultColumns: ['name', 'monthlyFee', 'active', 'order'],
    description: 'Freely definable membership types. They appear in the website application form and set the default contribution for members.',
  },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: can('financeAdmin'),
    update: can('financeAdmin'),
    delete: can('financeAdmin'),
  },
  hooks: auditHooks('Membership type'),
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        { name: 'monthlyFee', label: 'Default monthly contribution (€)', type: 'number', required: true, min: 0, defaultValue: 10, admin: { width: '50%', step: 0.5 } },
        { name: 'order', label: 'Order', type: 'number', defaultValue: 10, admin: { width: '50%' } },
      ],
    },
    { name: 'description', label: 'Description (shown on the website)', type: 'textarea', localized: true },
    { name: 'active', label: 'Selectable', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Inactive types are hidden on the website form but kept for existing members.' } },
  ],
}

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Member', plural: 'Members' },
  admin: {
    group: FINANCE_GROUP,
    useAsTitle: 'name',
    defaultColumns: ['memberNumber', 'name', 'membershipType', 'monthlyFee', 'active'],
    description: 'Membership register for contribution tracking. Not the same as website users.',
    listSearchableFields: ['name', 'email', 'memberNumber'],
  },
  defaultSort: 'name',
  access: {
    read: financeRead,
    create: can('financeAdmin'),
    update: can('financeAdmin'),
    delete: can('financeAdmin'),
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        // Default the monthly contribution from the membership type
        if (data && !data.monthlyFee && data.membershipType) {
          const type: any = await req.payload.findByID({ collection: 'membership-types', id: idOf(data.membershipType), overrideAccess: true, req }).catch(() => null)
          if (type) data.monthlyFee = type.monthlyFee
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.memberNumber) {
          const { totalDocs } = await req.payload.count({ collection: 'members', overrideAccess: true, req })
          data.memberNumber = `M-${String(totalDocs + 1).padStart(4, '0')}`
        }
        // Secret token behind the membership-card QR code
        if (!data.cardToken) data.cardToken = randomBytes(16).toString('hex')
        return data
      },
    ],
    ...auditHooks('Member'),
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'email', label: 'Email', type: 'email', admin: { width: '50%' } },
        { name: 'phone', label: 'Phone', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'address', label: 'Address (for donation receipts)', type: 'textarea' },
    {
      type: 'row',
      fields: [
        {
          name: 'membershipType',
          label: 'Membership type',
          type: 'relationship',
          relationTo: 'membership-types',
          // Required at app level only: a DB-level NOT NULL would make drizzle push
          // prompt interactively on the existing members table.
          validate: (v: any) => (v ? true : 'Please choose a membership type.'),
          admin: { width: '50%' },
        },
        { name: 'monthlyFee', label: 'Monthly contribution (€)', type: 'number', min: 0, admin: { width: '50%', step: 0.5, description: 'Empty = default of the membership type' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'joinedOn', label: 'Joined on', type: 'date', admin: { width: '50%' } },
        { name: 'leftOn', label: 'Left on', type: 'date', admin: { width: '50%' } },
      ],
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
    { name: 'memberNumber', label: 'Member number', type: 'text', unique: true, admin: { position: 'sidebar', readOnly: true } },
    { name: 'active', label: 'Active member', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Inactive members fail the membership-card QR verification.' } },
    { name: 'user', label: 'Linked user account (optional)', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    { name: 'cardToken', label: 'Card verification token', type: 'text', unique: true, admin: { position: 'sidebar', readOnly: true, description: 'Secret behind the QR code on the membership card.' } },
    { name: 'cardSentAt', label: 'Card last sent', type: 'date', admin: { position: 'sidebar', readOnly: true } },
  ],
}

export const MemberContributions: CollectionConfig = {
  slug: 'member-contributions',
  labels: { singular: 'Contribution payment', plural: 'Contribution payments' },
  admin: {
    group: FINANCE_GROUP,
    defaultColumns: ['member', 'year', 'month', 'amount', 'paidOn'],
    description: 'One record per member and month. Recording a payment creates a linked draft transaction (see Finance settings).',
  },
  defaultSort: '-paidOn',
  access: {
    read: financeRead,
    create: can('financeEntry', 'financeAdmin'),
    update: can('financeAdmin'),
    delete: can('financeAdmin'),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data) return data
        // One payment per member and month
        const existing = await req.payload.find({
          collection: 'member-contributions',
          where: {
            and: [{ member: { equals: idOf(data.member) } }, { year: { equals: data.year } }, { month: { equals: data.month } }],
          },
          limit: 1,
          overrideAccess: true,
          req,
        })
        if (existing.totalDocs > 0) {
          throw new APIError('This month is already recorded as paid for this member.', 400)
        }
        // Default the amount to the member's monthly fee
        if (!data.amount && data.member) {
          const member: any = await req.payload.findByID({ collection: 'members', id: idOf(data.member), overrideAccess: true, req })
          data.amount = member?.monthlyFee ?? 0
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') data.recordedBy = req.user?.id ?? null
        return data
      },
    ],
    afterChange: [
      ...auditHooks('Contribution payment').afterChange,
      async ({ doc, operation, req }) => {
        if (operation !== 'create' || doc.transaction || req.context?.linkingTransaction) return doc
        const member: any = await req.payload.findByID({ collection: 'members', id: idOf(doc.member), overrideAccess: true, req })
        const monthLabel = MONTH_OPTIONS.find((m) => m.value === String(doc.month))?.label ?? doc.month
        const txId = await createDraftIncome(req, {
          date: doc.paidOn || new Date().toISOString(),
          amount: Number(doc.amount),
          counterparty: member?.name ?? 'Member',
          description: `Membership contribution ${monthLabel} ${doc.year} – ${member?.name ?? ''} (${member?.memberNumber ?? ''})`,
          settingsField: 'contributionCategory',
        })
        if (txId) {
          await req.payload.update({
            collection: 'member-contributions',
            id: doc.id,
            data: { transaction: txId } as any,
            overrideAccess: true,
            context: { linkingTransaction: true },
            req,
          })
        }
        return doc
      },
    ],
    afterDelete: auditHooks('Contribution payment').afterDelete,
  },
  fields: [
    { name: 'member', label: 'Member', type: 'relationship', relationTo: 'members', required: true },
    {
      type: 'row',
      fields: [
        { name: 'year', label: 'Year', type: 'number', required: true, min: 2000, max: 2100, defaultValue: () => new Date().getFullYear(), admin: { width: '33%' } },
        { name: 'month', label: 'Month', type: 'select', required: true, options: MONTH_OPTIONS, admin: { width: '33%' } },
        { name: 'amount', label: 'Amount (€)', type: 'number', min: 0, admin: { width: '33%', step: 0.5, description: 'Empty = member’s monthly fee' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'paidOn', label: 'Paid on', type: 'date', defaultValue: () => new Date().toISOString(), admin: { width: '50%' } },
        {
          name: 'method',
          label: 'Payment method',
          type: 'select',
          defaultValue: 'transfer',
          options: [
            { label: 'Bank transfer', value: 'transfer' },
            { label: 'Cash', value: 'cash' },
            { label: 'Other', value: 'other' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    { name: 'note', label: 'Note', type: 'text' },
    { name: 'transaction', label: 'Linked transaction', type: 'relationship', relationTo: 'transactions', admin: { position: 'sidebar', readOnly: true } },
    { name: 'recordedBy', label: 'Recorded by', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
  ],
}

export const Donations: CollectionConfig = {
  slug: 'donations',
  labels: { singular: 'Donation', plural: 'Donations' },
  admin: {
    group: FINANCE_GROUP,
    defaultColumns: ['donorName', 'date', 'amount', 'project', 'receiptIssuedOn'],
    description: 'Donation register. Recording a donation creates a linked draft transaction (see Finance settings). Donor address is needed for a donation receipt (Zuwendungsbestätigung).',
    useAsTitle: 'donorName',
    listSearchableFields: ['donorName', 'donorEmail', 'purpose'],
  },
  defaultSort: '-date',
  access: {
    read: financeRead,
    create: can('financeEntry', 'financeAdmin'),
    update: can('financeAdmin'),
    delete: can('financeAdmin'),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create') data.recordedBy = req.user?.id ?? null
        return data
      },
    ],
    afterChange: [
      ...auditHooks('Donation').afterChange,
      async ({ doc, operation, req }) => {
        if (operation !== 'create' || doc.transaction || req.context?.linkingTransaction) return doc
        const txId = await createDraftIncome(req, {
          date: doc.date || new Date().toISOString(),
          amount: Number(doc.amount),
          counterparty: doc.anonymous ? 'Anonymous donation' : doc.donorName,
          description: `Donation${doc.purpose ? ` – ${doc.purpose}` : ''}`,
          settingsField: 'donationCategory',
        })
        if (txId) {
          await req.payload.update({
            collection: 'donations',
            id: doc.id,
            data: { transaction: txId } as any,
            overrideAccess: true,
            context: { linkingTransaction: true },
            req,
          })
        }
        return doc
      },
    ],
    afterDelete: auditHooks('Donation').afterDelete,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'donorName', label: 'Donor', type: 'text', required: true, admin: { width: '70%' } },
        { name: 'anonymous', label: 'Publish as anonymous', type: 'checkbox', defaultValue: false, admin: { width: '30%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'donorEmail', label: 'Email', type: 'email', admin: { width: '50%' } },
        { name: 'method', label: 'Method', type: 'select', defaultValue: 'transfer', options: [
          { label: 'Bank transfer', value: 'transfer' },
          { label: 'Cash', value: 'cash' },
          { label: 'PayPal / platform', value: 'paypal' },
          { label: 'Other', value: 'other' },
        ], admin: { width: '50%' } },
      ],
    },
    { name: 'donorAddress', label: 'Donor address (for donation receipt)', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { width: '50%' } },
        { name: 'amount', label: 'Amount (€)', type: 'number', required: true, min: 0.01, admin: { width: '50%', step: 0.01 } },
      ],
    },
    { name: 'purpose', label: 'Purpose / earmark (optional)', type: 'text' },
    { name: 'project', label: 'Project', type: 'relationship', relationTo: 'finance-projects' },
    { name: 'note', label: 'Note', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'receiptRequested', label: 'Donation receipt requested', type: 'checkbox', defaultValue: false, admin: { width: '50%' } },
        { name: 'receiptIssuedOn', label: 'Receipt issued on', type: 'date', admin: { width: '50%' } },
      ],
    },
    { name: 'transaction', label: 'Linked transaction', type: 'relationship', relationTo: 'transactions', admin: { position: 'sidebar', readOnly: true } },
    { name: 'recordedBy', label: 'Recorded by', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar', readOnly: true } },
  ],
}
