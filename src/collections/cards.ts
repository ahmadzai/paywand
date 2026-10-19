import { randomBytes } from 'node:crypto'
import type { CollectionConfig } from 'payload'
import { can } from '../access/permissions'
import { auditHooks } from '../hooks/audit'

const cardManagers = can('manageContent', 'manageUsers', 'financeAdmin')

/**
 * Special cards for events: management staff, security, organisation, stage …
 * Same QR verification as membership cards; a card stops verifying when it is
 * deactivated or its validity date has passed.
 */
export const EventCards: CollectionConfig = {
  slug: 'event-cards',
  labels: { singular: 'Event card', plural: 'Event & staff cards' },
  admin: {
    group: 'Association',
    useAsTitle: 'personName',
    defaultColumns: ['personName', 'role', 'event', 'validUntil', 'active'],
    description: 'Special cards (security, organisation, stage management …) for events. Generate, preview and send them at /intern/cards.',
    listSearchableFields: ['personName', 'role', 'eventLabel'],
  },
  defaultSort: '-createdAt',
  access: {
    read: cardManagers,
    create: cardManagers,
    update: cardManagers,
    delete: cardManagers,
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (!data.cardToken) data.cardToken = randomBytes(16).toString('hex')
        return data
      },
    ],
    ...auditHooks('Event card'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'personName', label: 'Name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'role', label: 'Role on the card', type: 'text', required: true, admin: { width: '50%', placeholder: 'e.g. Security, Organisation, Stage management' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'event', label: 'Event (from the website)', type: 'relationship', relationTo: 'events', admin: { width: '50%' } },
        { name: 'eventLabel', label: 'Event name override (free text)', type: 'text', admin: { width: '50%', description: 'Used when the event is not on the website, or to shorten the title.' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', label: 'Email (for sending the card)', type: 'email', admin: { width: '50%' } },
        { name: 'validUntil', label: 'Valid until', type: 'date', admin: { width: '50%', description: 'After this date the QR verification shows the card as invalid.' } },
      ],
    },
    { name: 'note', label: 'Note', type: 'textarea' },
    { name: 'active', label: 'Active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar', description: 'Inactive cards fail the QR verification.' } },
    { name: 'cardToken', label: 'Card verification token', type: 'text', unique: true, admin: { position: 'sidebar', readOnly: true } },
    { name: 'cardSentAt', label: 'Card last sent', type: 'date', admin: { position: 'sidebar', readOnly: true } },
  ],
}
