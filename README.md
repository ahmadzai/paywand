# Paywand e.V. – Website & Finanzmodul

Next.js 16 + Payload CMS 3 (admin panel at `/admin`). SQLite for development, PostgreSQL for production.

## Status (work in progress)

Done:
- Backend: all collections and globals (content, Vorstand, roles/permissions, inboxes, finance).
- Finance workflow: approvals, storno, year locking, audit log.
- Public pages: Start, Über uns, Angebote, Termine, Aktuelles, Mitmachen, Kontakt (in 4 languages, with RTL support).

Not done yet:
- Pages: `/transparenz`, `/impressum`, `/datenschutz` (linked in the footer, currently 404).
- Finance dashboard `/intern` (linked in the admin sidebar), CSV export.
- Demo-data seed script (`npm run seed` is defined but `src/seed/index.ts` doesn't exist yet) and example photos.
- Full TypeScript check / production build not yet run.

## Setup (Ubuntu / WSL)

Requires Node.js 20.18+ (22 LTS recommended).

    npm install
    cp .env.example .env      # set PAYLOAD_SECRET (openssl rand -hex 32)
    npm run dev

Then:
1. Open http://localhost:3000/admin and create the first user. That user automatically becomes super-admin.
2. Under **Einstellungen**, fill in **Vereinsdaten**, **Website-Einstellungen** and the **Startseite**.
3. The website is at http://localhost:3000 (redirects to `/de`).

After adding or changing custom admin components, run `npm run generate:importmap`.

## Structure

- `src/payload.config.ts` – config, languages (de, ps, fa, en), DB switch via `DATABASE_URL`
- `src/access/permissions.ts` – definable roles → permission flags
- `src/collections/finance` – Buchungen, Konten, Kategorien (4 Sphären), Projekte, Belege, Geschäftsjahre
- `src/collections/content`, `src/globals` – website content, Vorstand, Vereinsdaten
- `src/i18n` – UI texts (Pashto/Dari need native review)
- `src/components/site/Brand.tsx` – logo (colours follow admin settings), kilim band, icons
- `src/app/(frontend)/[locale]` – public pages

Uploaded files go to `media/`, `documents/` and `private/receipts/` (git-ignored). Receipts are only served to logged-in finance users.
