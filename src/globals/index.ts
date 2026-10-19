import type { GlobalConfig } from 'payload'
import { anyone, can, getPermissions } from '../access/permissions'

const hex = (v: any) => (!v || /^#[0-9a-fA-F]{6}$/.test(v) ? true : 'Enter a color in #RRGGBB format')

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Website settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: can('manageSettings') },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Logo & colors',
          fields: [
            { name: 'siteName', label: 'Name (short form)', type: 'text', required: true, defaultValue: 'Paywand' },
            { name: 'nativeName', label: 'Name in native script', type: 'text', defaultValue: 'پیوند' },
            { name: 'tagline', label: 'Tagline', type: 'text', localized: true },
            {
              name: 'logo',
              label: 'Logo (optional – replaces the built-in logo)',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'SVG or PNG with a transparent background. Leave empty = default logo.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'colorPrimary', label: 'Primary color', type: 'text', defaultValue: '#23408E', validate: hex, admin: { width: '33%' } },
                { name: 'colorAccent', label: 'Accent color', type: 'text', defaultValue: '#E2A72E', validate: hex, admin: { width: '33%' } },
                { name: 'colorHighlight', label: 'Highlight color', type: 'text', defaultValue: '#B0283F', validate: hex, admin: { width: '33%' } },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'Phone', type: 'text' },
            { name: 'whatsapp', label: 'WhatsApp (optional)', type: 'text' },
            { name: 'street', label: 'Street & house number', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'postalCode', label: 'Postal code', type: 'text', admin: { width: '30%' } },
                { name: 'city', label: 'City', type: 'text', defaultValue: 'Berlin', admin: { width: '70%' } },
              ],
            },
            { name: 'officeHours', label: 'Office hours', type: 'textarea', localized: true },
            {
              name: 'social',
              label: 'Social media',
              type: 'array',
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  options: ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'whatsapp', 'telegram'].map((v) => ({ label: v, value: v })),
                },
                { name: 'url', type: 'text', required: true },
              ],
            },
          ],
        },
        {
          label: 'Donations',
          fields: [
            { name: 'accountHolder', label: 'Account holder', type: 'text' },
            { name: 'iban', label: 'IBAN', type: 'text' },
            { name: 'bic', label: 'BIC', type: 'text' },
            { name: 'bank', label: 'Bank', type: 'text' },
            { name: 'paypalUrl', label: 'PayPal or donation platform link', type: 'text' },
            { name: 'donationNote', label: 'Donation note', type: 'textarea', localized: true },
          ],
        },
      ],
    },
  ],
}

export const Vereinsdaten: GlobalConfig = {
  slug: 'vereinsdaten',
  label: 'Association data (register, statutes, charitable status)',
  admin: { group: 'Settings', description: 'These details appear automatically in the legal notice (Impressum) and on the transparency page.' },
  access: { read: anyone, update: can('manageSettings') },
  fields: [
    { name: 'officialName', label: 'Full official name of the association', type: 'text', required: true, defaultValue: 'Paywand – Afghanischer Verein für Integration und Kultur in Berlin e.V.' },
    { name: 'foundedOn', label: 'Founding date', type: 'date' },
    {
      type: 'row',
      fields: [
        { name: 'registerCourt', label: 'Register court (Registergericht)', type: 'text', defaultValue: 'Amtsgericht Charlottenburg' },
        { name: 'registerNumber', label: 'Register number (Vereinsregister)', type: 'text', admin: { description: 'e.g. VR 12345 B' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'taxOffice', label: 'Tax office (Finanzamt)', type: 'text', defaultValue: 'Finanzamt für Körperschaften I Berlin' },
        { name: 'taxNumber', label: 'Tax number (optional)', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'exemptionType',
          label: 'Type of notice',
          type: 'select',
          defaultValue: 'freistellung',
          options: [
            { label: 'Tax exemption notice (Freistellungsbescheid)', value: 'freistellung' },
            { label: 'Determination notice under § 60a AO (Feststellungsbescheid)', value: 'feststellung' },
          ],
        },
        { name: 'exemptionDate', label: 'Date of the notice', type: 'date' },
      ],
    },
    { name: 'purposes', label: 'Statutory purposes (short version)', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'satzung', label: 'Statutes (Satzung) – PDF', type: 'upload', relationTo: 'documents' },
        { name: 'satzungDate', label: 'Version dated', type: 'date' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'memberCount', label: 'Number of members', type: 'number' },
        { name: 'volunteerCount', label: 'Number of volunteers', type: 'number' },
      ],
    },
    { name: 'staffInfo', label: 'Staff structure (transparency)', type: 'textarea', localized: true, admin: { description: 'e.g. “The association is run entirely by volunteers.”' } },
    { name: 'activityReport', label: 'Current activity report (PDF)', type: 'upload', relationTo: 'documents' },
    { name: 'affiliations', label: 'Corporate affiliations (transparency, item 9)', type: 'textarea', localized: true, admin: { description: 'e.g. “Paywand e.V. holds no shares in any companies and is not affiliated with any third parties.” Memberships in umbrella organizations can be listed here.' } },
    { name: 'majorDonors', label: 'Contributions above 10% of annual income (transparency, item 10)', type: 'textarea', localized: true, admin: { description: 'Names of legal entities whose annual contribution exceeds 10% of total income – or “none”.' } },
  ],
}

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: { group: 'Website' },
  access: { read: anyone, update: can('manageContent') },
  fields: [
    { name: 'heroTitle', label: 'Main heading', type: 'text', localized: true, required: true },
    { name: 'heroText', label: 'Introductory text', type: 'textarea', localized: true },
    { name: 'heroImage', label: 'Hero image', type: 'upload', relationTo: 'media' },
    { name: 'introTitle', label: 'About-us heading', type: 'text', localized: true },
    { name: 'introText', label: 'About-us text', type: 'textarea', localized: true },
    {
      name: 'facts',
      label: 'Key figures (optional)',
      type: 'array',
      // Nicht das Array lokalisieren (lokalisierte Arrays kollidieren in SQLite bei
      // Locale-Updates mit doppelten Zeilen-IDs) – nur die Beschriftung je Sprache.
      maxRows: 4,
      fields: [
        { name: 'value', label: 'Value', type: 'text', required: true },
        // Not required: a required localized field would force every locale update to
        // re-supply all labels (missing locales fall back to English).
        { name: 'label', label: 'Description', type: 'text', localized: true },
      ],
    },
    {
      name: 'quote',
      label: 'Voice from the association',
      type: 'group',
      fields: [
        { name: 'text', label: 'Quote', type: 'textarea', localized: true },
        { name: 'author', label: 'Name / role', type: 'text', localized: true },
      ],
    },
  ],
}

export const LegalPages: GlobalConfig = {
  slug: 'legal-pages',
  label: 'Legal notice (Impressum) & privacy',
  admin: { group: 'Settings' },
  access: { read: anyone, update: can('manageSettings') },
  fields: [
    { name: 'impressumExtra', label: 'Legal notice (Impressum) – additional text', type: 'richText', localized: true, admin: { description: 'Association name, address, board and register details are inserted automatically.' } },
    { name: 'privacy', label: 'Privacy policy', type: 'richText', localized: true },
  ],
}

export const MembershipCard: GlobalConfig = {
  slug: 'membership-card',
  label: 'Membership card',
  admin: {
    group: 'Settings',
    description: 'Texts on the digital membership card. Cards are generated and emailed from the internal area (/intern/cards); the QR code verifies the membership online and stops working when a member is set inactive.',
  },
  access: { read: anyone, update: can('manageContent', 'manageSettings') },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'orientation',
          label: 'Card orientation',
          type: 'select',
          defaultValue: 'portrait',
          options: [
            { label: 'Portrait (recommended for phones)', value: 'portrait' },
            { label: 'Landscape (classic credit card)', value: 'landscape' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'cardLanguage',
          label: 'Card language',
          type: 'select',
          defaultValue: 'en',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Deutsch', value: 'de' },
          ],
          admin: { width: '50%', description: 'Printed labels, dates, back texts and the card email use this language.' },
        },
      ],
    },
    { name: 'backTitle', label: 'Back of card – heading', type: 'text', localized: true, defaultValue: 'Our mission' },
    {
      name: 'backText',
      label: 'Back of card – text (e.g. mission / vision)',
      type: 'textarea',
      localized: true,
      admin: { description: 'Keep it short – the card is credit-card sized. Around 5 lines fit.' },
    },
    { name: 'verifyHint', label: 'QR hint', type: 'text', localized: true, defaultValue: 'Scan the QR code to verify this membership online.' },
    { name: 'footerText', label: 'Footer line (e.g. website · email)', type: 'text', localized: true },
    {
      name: 'autoSendOnAccept',
      label: 'Automatically email the card when a membership application is accepted',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'When an application is set to “Accepted”, a member record is always created. With this switch ON, the membership card is also generated and emailed to the new member together with the welcome message below. Cards can always be sent manually from /intern/cards as well.',
      },
    },
    {
      name: 'welcomeText',
      label: 'Welcome message (email on acceptance)',
      type: 'textarea',
      localized: true,
      defaultValue:
        'welcome to Paywand e.V.! Your membership application has been accepted. Attached you find your digital membership card – PDF for printing, PNG for your phone.',
    },
  ],
}

export const FinanceSettings: GlobalConfig = {
  slug: 'finance-settings',
  label: 'Finance settings',
  admin: { group: 'Finance (internal)' },
  access: {
    read: async ({ req }) => {
      const p = await getPermissions(req)
      return p.financeView || p.financeEntry || p.financeApprove || p.financeAdmin
    },
    update: can('financeAdmin'),
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        await req.payload.create({
          collection: 'audit-log',
          data: {
            collectionSlug: 'finance-settings',
            documentId: 'global',
            action: 'update',
            user: req.user?.id ?? null,
            summary: 'Finance settings changed',
            changes: { from: previousDoc, to: doc },
          },
          overrideAccess: true,
          req,
        })
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'approvalsRequired',
      label: 'Required approvals per transaction',
      type: 'select',
      defaultValue: '1',
      options: [
        { label: '1 approval', value: '1' },
        { label: '2 approvals (two different people)', value: '2' },
      ],
    },
    {
      name: 'allowSelfApproval',
      label: 'Users may approve their own transactions',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Recommendation: leave off (four-eyes principle / Vier-Augen-Prinzip).' },
    },
    { name: 'requireReceipt', label: 'A receipt is required when submitting', type: 'checkbox', defaultValue: true },
    {
      name: 'publishTransparency',
      label: 'Publish the income/expense overview on the transparency page',
      type: 'checkbox',
      defaultValue: false,
    },
    { name: 'transparencyYear', label: 'Published financial year', type: 'number', admin: { description: 'Only publish closed (locked) years.' } },
    {
      type: 'group',
      name: 'autoBooking',
      label: 'Automatic bookkeeping for contributions & donations',
      admin: { description: 'When all three are set, recording a contribution payment or a donation automatically creates a linked DRAFT transaction, which then goes through the normal submit/approve workflow. Leave empty to disable.' },
      fields: [
        { name: 'defaultAccount', label: 'Default account', type: 'relationship', relationTo: 'accounts' },
        { name: 'contributionCategory', label: 'Category for membership contributions', type: 'relationship', relationTo: 'finance-categories' },
        { name: 'donationCategory', label: 'Category for donations', type: 'relationship', relationTo: 'finance-categories' },
      ],
    },
  ],
}
