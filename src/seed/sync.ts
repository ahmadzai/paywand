/**
 * Pushes the current Payload schema to the database without seeding:
 * `npx payload run src/seed/sync.ts`
 * Useful after adding collections/fields, since `next start` (production
 * mode) never pushes schema changes. Destructive changes (dropped/renamed
 * columns) make the push prompt interactively – apply those manually via
 * psql first (see CLAUDE.md).
 */
import config from '@payload-config'
import { getPayload } from 'payload'

await getPayload({ config })
console.log('schema synced')
process.exit(0)
