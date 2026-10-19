import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { AuditLog, Roles, Users } from './collections/system'
import {
  BoardMembers,
  BoardRoles,
  ContactMessages,
  Documents,
  EventRegistrations,
  Events,
  FocusAreas,
  Media,
  MembershipApplications,
  Partners,
  Posts,
} from './collections/content'
import { EventCards } from './collections/cards'
import { Accounts, Categories, FinancePeriods, Projects, Receipts, Transactions } from './collections/finance'
import { Donations, MemberContributions, Members, MembershipTypes } from './collections/finance/membership'
import { FinanceSettings, Homepage, LegalPages, MembershipCard, SiteSettings, Vereinsdaten } from './globals'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUrl = process.env.DATABASE_URL || 'file:./paywand.db'
const db = databaseUrl.startsWith('postgres')
  ? postgresAdapter({ pool: { connectionString: databaseUrl } })
  : sqliteAdapter({ client: { url: databaseUrl } })

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' – Paywand Admin' },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      afterNavLinks: ['@/components/admin/FinanceNavLink#FinanceNavLink'],
      graphics: {
        Logo: '@/components/admin/AdminLogo#AdminLogo',
        Icon: '@/components/admin/AdminLogo#AdminIcon',
      },
    },
  },
  i18n: {
    fallbackLanguage: 'en',
  },
  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'de', label: 'Deutsch' },
      { code: 'ps', label: 'پښتو (Pashto)', rtl: true },
      { code: 'fa', label: 'دری (Dari)', rtl: true },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [
    // Website
    FocusAreas,
    Events,
    Posts,
    Partners,
    Media,
    Documents,
    // Verein
    BoardMembers,
    BoardRoles,
    EventCards,
    // Eingänge
    EventRegistrations,
    MembershipApplications,
    ContactMessages,
    // Finanzen
    Transactions,
    Members,
    MembershipTypes,
    MemberContributions,
    Donations,
    Accounts,
    Categories,
    Projects,
    Receipts,
    FinancePeriods,
    // System
    Users,
    Roles,
    AuditLog,
  ],
  globals: [Homepage, SiteSettings, Vereinsdaten, LegalPages, MembershipCard, FinanceSettings],
  // Real email only when SMTP is configured; otherwise Payload logs emails to the console (dev)
  ...(process.env.SMTP_HOST
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM || 'noreply@paywand-berlin.de',
          defaultFromName: 'Paywand e.V.',
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
          },
        }),
      }
    : {}),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db,
  sharp,
  graphQL: { disable: true },
})
