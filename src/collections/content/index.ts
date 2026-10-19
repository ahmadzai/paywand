import type { CollectionConfig, Field } from 'payload'
import { anyone, can } from '../../access/permissions'

const CONTENT = 'Website'
const BOARD = 'Association'
const INBOX = 'Inbox'

const slugField: Field = {
  name: 'slug',
  label: 'URL slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'Lowercase letters and hyphens only, e.g. “sommerfest-2026”' },
  validate: (v: any) => (/^[a-z0-9-]+$/.test(v || '') ? true : 'Only a–z, 0–9 and hyphens'),
}

const contentAccess = {
  read: anyone,
  create: can('manageContent'),
  update: can('manageContent'),
  delete: can('manageContent'),
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Images & media' },
  admin: { group: CONTENT, description: 'Only use photos for which the people shown have given their consent (for minors: their parents).' },
  access: { read: anyone, create: can('manageContent', 'manageSettings', 'manageBoard'), update: can('manageContent', 'manageSettings', 'manageBoard'), delete: can('manageContent') },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumb', width: 480 },
      { name: 'card', width: 960 },
      { name: 'hero', width: 1920 },
    ],
  },
  fields: [
    { name: 'alt', label: 'Image description (alt text, for accessibility)', type: 'text', required: true, localized: true },
    { name: 'credit', label: 'Image credit', type: 'text' },
    { name: 'consentOnFile', label: 'Consent of the people shown is on file', type: 'checkbox', defaultValue: false },
  ],
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Document', plural: 'Documents & downloads' },
  admin: { group: CONTENT, useAsTitle: 'title', defaultColumns: ['title', 'language', 'showInDownloads'] },
  access: { read: anyone, create: can('manageContent', 'manageSettings'), update: can('manageContent', 'manageSettings'), delete: can('manageContent', 'manageSettings') },
  upload: { staticDir: 'documents', mimeTypes: ['application/pdf', 'image/*'] },
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, localized: true },
    {
      name: 'language',
      label: 'Document language',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'German', value: 'de' },
        { label: 'Pashto', value: 'ps' },
        { label: 'Dari', value: 'fa' },
        { label: 'English', value: 'en' },
      ],
    },
    { name: 'showInDownloads', label: 'Show in downloads section', type: 'checkbox', defaultValue: true },
  ],
}

export const FocusAreas: CollectionConfig = {
  slug: 'focus-areas',
  labels: { singular: 'Offering / focus area', plural: 'Offerings & focus areas' },
  admin: { group: CONTENT, useAsTitle: 'title', defaultColumns: ['title', 'order', 'slug'] },
  defaultSort: 'order',
  access: contentAccess,
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, localized: true },
    slugField,
    { name: 'order', label: 'Order', type: 'number', defaultValue: 10, admin: { position: 'sidebar' } },
    {
      name: 'icon',
      label: 'Icon',
      type: 'select',
      defaultValue: 'integration',
      options: [
        { label: 'Integration (bridge)', value: 'integration' },
        { label: 'Education (book)', value: 'bildung' },
        { label: 'Youth (star)', value: 'jugend' },
        { label: 'Culture (ornament)', value: 'kultur' },
        { label: 'Dialogue (speech bubbles)', value: 'dialog' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'summary', label: 'Short description (1–2 sentences)', type: 'textarea', required: true, localized: true },
    {
      name: 'bullets',
      label: 'What we offer (bullet points)',
      type: 'array',
      localized: true,
      fields: [{ name: 'text', label: 'Point', type: 'text', required: true }],
    },
    { name: 'body', label: 'Full text', type: 'richText', localized: true },
    { name: 'howToJoin', label: '“How to join”', type: 'textarea', localized: true },
    { name: 'image', label: 'Image', type: 'upload', relationTo: 'media' },
  ],
}

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: { group: CONTENT, useAsTitle: 'title', defaultColumns: ['title', 'startsAt', 'location', 'registrationEnabled'] },
  defaultSort: 'startsAt',
  access: contentAccess,
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, localized: true },
    slugField,
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Start', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' }, width: '50%' } },
        { name: 'endsAt', label: 'End', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' }, width: '50%' } },
      ],
    },
    { name: 'location', label: 'Location', type: 'text', localized: true },
    { name: 'address', label: 'Address', type: 'text' },
    { name: 'focusArea', label: 'Focus area', type: 'relationship', relationTo: 'focus-areas', admin: { position: 'sidebar' } },
    {
      name: 'languages',
      label: 'Event languages',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'German', value: 'de' },
        { label: 'Pashto', value: 'ps' },
        { label: 'Dari', value: 'fa' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'price', label: 'Cost (e.g. “free”)', type: 'text', localized: true },
    { name: 'summary', label: 'Short description', type: 'textarea', localized: true },
    { name: 'description', label: 'Description', type: 'richText', localized: true },
    { name: 'image', label: 'Image', type: 'upload', relationTo: 'media' },
    { name: 'registrationEnabled', label: 'Enable online registration', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'capacity', label: 'Max. participants', type: 'number', admin: { position: 'sidebar' } },
  ],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'News' },
  admin: { group: CONTENT, useAsTitle: 'title', defaultColumns: ['title', 'publishedAt', 'published'] },
  defaultSort: '-publishedAt',
  access: {
    ...contentAccess,
    read: async ({ req }) => {
      if (req.user) return true
      return { published: { equals: true } }
    },
  },
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, localized: true },
    slugField,
    { name: 'published', label: 'Published', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'publishedAt', label: 'Date', type: 'date', required: true, defaultValue: () => new Date().toISOString(), admin: { position: 'sidebar' } },
    { name: 'focusArea', label: 'Focus area', type: 'relationship', relationTo: 'focus-areas', admin: { position: 'sidebar' } },
    { name: 'excerpt', label: 'Teaser', type: 'textarea', localized: true },
    { name: 'content', label: 'Content', type: 'richText', localized: true },
    { name: 'image', label: 'Image', type: 'upload', relationTo: 'media' },
  ],
}

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Partner / Funder', plural: 'Partners & funders' },
  admin: { group: CONTENT, useAsTitle: 'name' },
  defaultSort: 'order',
  access: contentAccess,
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'url', label: 'Website', type: 'text' },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    { name: 'kind', label: 'Type', type: 'select', defaultValue: 'partner', options: [{ label: 'Partner', value: 'partner' }, { label: 'Funder', value: 'funder' }] },
    { name: 'order', label: 'Order', type: 'number', defaultValue: 10 },
  ],
}

/* ---------------- Verein: Vorstand ---------------- */

export const BoardRoles: CollectionConfig = {
  slug: 'board-roles',
  labels: { singular: 'Board role', plural: 'Board roles' },
  admin: { group: BOARD, useAsTitle: 'title', defaultColumns: ['title', 'order', 'representsVerein'], description: 'Freely definable, e.g. “Chairperson (1. Vorsitzende/r)”, “Treasurer (Schatzmeister/in)”, “Assessor (Beisitzer/in)”.' },
  defaultSort: 'order',
  access: { read: anyone, create: can('manageBoard'), update: can('manageBoard'), delete: can('manageBoard') },
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, localized: true },
    { name: 'order', label: 'Order', type: 'number', defaultValue: 10 },
    {
      name: 'representsVerein',
      label: 'Authorized to represent the association under § 26 BGB (appears in the legal notice)',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}

export const BoardMembers: CollectionConfig = {
  slug: 'board-members',
  labels: { singular: 'Board member', plural: 'Board' },
  admin: { group: BOARD, useAsTitle: 'name', defaultColumns: ['name', 'role', 'active'] },
  defaultSort: 'order',
  access: { read: anyone, create: can('manageBoard'), update: can('manageBoard'), delete: can('manageBoard') },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'role', label: 'Role', type: 'relationship', relationTo: 'board-roles', required: true },
    { name: 'photo', label: 'Photo', type: 'upload', relationTo: 'media' },
    { name: 'bio', label: 'Short introduction', type: 'textarea', localized: true },
    { name: 'email', label: 'Public email (optional)', type: 'email' },
    {
      type: 'row',
      fields: [
        { name: 'termStart', label: 'Elected on', type: 'date' },
        { name: 'termEnd', label: 'Term ends', type: 'date' },
      ],
    },
    { name: 'order', label: 'Order', type: 'number', defaultValue: 10, admin: { position: 'sidebar' } },
    { name: 'active', label: 'Currently in office', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}

/* ---------------- Eingänge (Formulare) ---------------- */

const inboxAccess = {
  read: can('viewSubmissions'),
  create: () => false, // nur über die Website-Formulare (Server)
  update: can('viewSubmissions'),
  delete: can('viewSubmissions'),
}
const statusField: Field = {
  name: 'status',
  label: 'Status',
  type: 'select',
  defaultValue: 'new',
  options: [
    { label: 'New', value: 'new' },
    { label: 'In progress', value: 'progress' },
    { label: 'Done', value: 'done' },
  ],
  admin: { position: 'sidebar' },
}

export const EventRegistrations: CollectionConfig = {
  slug: 'event-registrations',
  labels: { singular: 'Registration', plural: 'Event registrations' },
  admin: { group: INBOX, useAsTitle: 'name', defaultColumns: ['name', 'event', 'participants', 'createdAt'] },
  access: inboxAccess,
  fields: [
    { name: 'event', label: 'Event', type: 'relationship', relationTo: 'events', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone / WhatsApp', type: 'text' },
    { name: 'participants', label: 'Participants', type: 'number', defaultValue: 1 },
    { name: 'message', label: 'Message', type: 'textarea' },
    statusField,
  ],
}

const idOfRel = (v: unknown) => (v && typeof v === 'object' && 'id' in (v as any) ? (v as any).id : v)

export const MembershipApplications: CollectionConfig = {
  slug: 'membership-applications',
  labels: { singular: 'Membership application', plural: 'Membership applications' },
  admin: {
    group: INBOX,
    useAsTitle: 'name',
    defaultColumns: ['name', 'membershipType', 'status', 'createdAt'],
    description:
      'Set the status to “Accepted” to create a member record from the application. If enabled in Settings → Membership card, the membership card is then generated and emailed automatically.',
  },
  access: inboxAccess,
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Accepting an application creates the member (once) and optionally auto-sends the card
        if (doc.status !== 'accepted' || previousDoc?.status === 'accepted' || doc.member || req.context?.acceptingApplication) return doc
        try {
          let typeId = idOfRel(doc.membershipType)
          if (!typeId) {
            const first = await req.payload.find({ collection: 'membership-types', where: { active: { equals: true } }, sort: 'order', limit: 1, overrideAccess: true, req })
            typeId = (first.docs[0] as any)?.id
          }
          const address = [doc.street, [doc.postalCode, doc.city].filter(Boolean).join(' ')].filter(Boolean).join('\n')
          const member: any = await req.payload.create({
            collection: 'members',
            data: {
              name: doc.name,
              email: doc.email || undefined,
              phone: doc.phone || undefined,
              address: address || undefined,
              membershipType: typeId,
              joinedOn: new Date().toISOString(),
              active: true,
            } as any,
            overrideAccess: true,
            req,
          })
          await req.payload.update({
            collection: 'membership-applications',
            id: doc.id,
            data: { member: member.id } as any,
            overrideAccess: true,
            context: { acceptingApplication: true },
            req,
          })
          const cardGlobal: any = await req.payload.findGlobal({ slug: 'membership-card', overrideAccess: true, req })
          if (cardGlobal?.autoSendOnAccept && member.email) {
            const { emailMemberCard } = await import('../../lib/card-email')
            // pass req: the member was created in this transaction and is not committed yet
            await emailMemberCard(req.payload, member.id, { welcome: true, req })
          }
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Accepting membership application failed' })
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'street', label: 'Street and house number', type: 'text' },
    {
      type: 'row',
      fields: [
        { name: 'postalCode', label: 'Postal code', type: 'text', admin: { width: '30%' } },
        { name: 'city', label: 'City', type: 'text', admin: { width: '70%' } },
      ],
    },
    {
      name: 'membershipType',
      label: 'Membership type',
      type: 'relationship',
      relationTo: 'membership-types',
    },
    { name: 'message', label: 'Message', type: 'textarea' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'In progress', value: 'progress' },
        { label: 'Accepted (creates member)', value: 'accepted' },
        { label: 'Done / declined', value: 'done' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'member', label: 'Created member', type: 'relationship', relationTo: 'members', admin: { position: 'sidebar', readOnly: true } },
  ],
}

export const ContactMessages: CollectionConfig = {
  slug: 'contact-messages',
  labels: { singular: 'Message', plural: 'Contact messages' },
  admin: { group: INBOX, useAsTitle: 'subject', defaultColumns: ['subject', 'name', 'status', 'createdAt'] },
  access: inboxAccess,
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'subject', label: 'Subject', type: 'text', required: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true },
    statusField,
  ],
}
