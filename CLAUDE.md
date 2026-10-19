# CLAUDE.md – Paywand e.V. Website & Finanzmodul

Project memory for Claude Code. Read this first. Keep it updated when decisions change.

## The client

**Paywand – Afghanischer Verein für Integration und Kultur in Berlin e.V.** (Pashto: پیوند = "bond/connection"; also romanised "Peiwand" – Latin spelling used on the site: **Paywand**).
Mission: *Gemeinsam für Integration, Bildung, Jugendförderung, Kultur und interkulturellen Dialog.*
Audience: Afghan families and youth in Berlin, German neighbours, volunteers, funders (Bezirksamt, Senat, foundations).
Domain candidates: paywand.de (recommended primary), paywand.org, paywand-ev.de, paywand-ev.org – availability not yet checked.
Developer: Jan (Ubuntu/WSL, VS Code, project in `~/dev/paywand`).

## Requirements from the client

- Dynamic website modelled on good German Verein sites (reference: vafo.ngo – Verband Afghanischer Organisationen; also Afghanic e.V., MAH Frauenverein, Start with a Friend).
- **Everything editable in the admin panel**: logo, colours, Vereinsdaten (Satzung, founding date, VR number, Freistellungsbescheid), Vorstand members AND freely definable Vorstand roles, texts for the five focus areas, photos. Real data exists – current content is placeholder for development.
- **Password-protected finance module** replacing their current Google Sheets/Excel. Main user: the Vorstand member responsible for finances (Kassenwart/in). Other users get access per role: view, entry, approval. **Approval by one or two users** (configurable).
- Languages: **English (primary, decided 2026-10-18 – site default AND admin UI)**, German, Pashto, Dari. Pashto/Dari are RTL.

## Stack

- Next.js **16.3.3** + Payload CMS **3.91.0** (admin at `/admin`), React 19.2.6, TypeScript 5.7.
- DB: **PostgreSQL 17 in Docker also for dev** (since 2026-10-18): container `paywand-db` (postgres:17-alpine, port **5433**, volume `paywand-pgdata`, `--restart unless-stopped`; credentials in `.env`). The adapter switches on the `DATABASE_URL` prefix; the old dev SQLite file is kept as `paywand.db.sqlite-backup`. If the container is down: `docker start paywand-db`. Dev uses drizzle push (no migrations yet – needed for production). Gotcha: a **destructive** schema change (dropping/renaming a column) makes push wait on an interactive prompt – in non-interactive runs it hangs. Apply such changes manually via `docker exec paywand-db psql -U paywand -d paywand -c "ALTER TABLE …"`, then push is a no-op again (done 2026-10-18 for membership_applications street/postal_code/city replacing address).
- Fonts self-hosted via @fontsource (no Google Fonts CDN – GDPR): Literata (Latin headings), Instrument Sans (Latin body), Noto Kufi Arabic (RTL headings), Noto Naskh Arabic (RTL body – covers Pashto letters ټ ډ ړ ښ ګ ڼ ې).
- GraphQL disabled. Plain CSS (no Tailwind) in `src/app/(frontend)/site.css`, logical properties for RTL.
- Planned hosting: Germany/EU (e.g. Hetzner) with AVV; no tracking cookies (cookieless analytics if any).

## Commands

    npm install
    cp .env.example .env        # PAYLOAD_SECRET=$(openssl rand -hex 32)
    npm run dev                 # http://localhost:3000 → redirects to /de
    npm run generate:importmap  # after adding/changing admin custom components
    npm run generate:types      # regenerates src/payload-types.ts
    npm run build

The first user created at `/admin` becomes super-admin automatically (hook in Users).

## Architecture

    src/payload.config.ts              config, locales en/de/ps/fa (en default; ps, fa rtl), DB switch
    src/access/permissions.ts          role → permission flags; getPermissions(req) cached per request
    src/hooks/audit.ts                 audit-log hooks (create/update/delete)
    src/collections/system             Users, Roles, AuditLog
    src/collections/content            Media, Documents, FocusAreas, Events, Posts, Partners,
                                       BoardRoles, BoardMembers, EventRegistrations,
                                       MembershipApplications, ContactMessages
    src/collections/finance            Accounts, Categories, Projects, Receipts, FinancePeriods, Transactions
    src/collections/finance/membership MembershipTypes (admin-defined), Members, MemberContributions,
                                       Donations (contributions/donations auto-create linked draft
                                       transactions via FinanceSettings.autoBooking)
    src/lib/card.ts                    membership card renderer: SVG → sharp PNG → pdf-lib PDF, QR via
                                       `qrcode`; /intern/cards UI + [id]/pdf|png routes; /verify/[token]
                                       public check page (own root layout in src/app/(verify))
    src/app/(intern)/...               finance admin: dashboard, /intern/contributions (monthly matrix,
                                       record payments via server action), /intern/donations (register +
                                       receipt tracking), /intern/expenses (by category/project), CSV, EÜR
    src/globals                        SiteSettings, Vereinsdaten, Homepage, LegalPages, FinanceSettings
    src/lib/payload.ts                 getClient(), getSiteData(locale), mediaUrl()
    src/lib/finance.ts                 summarize(), accountBalances(), isBooked()
    src/lib/format.ts                  date/currency formatting (Europe/Berlin)
    src/i18n/index.ts                  UI strings for 4 languages + LOCALE_META (dir, htmlLang)
    src/components/site                Brand (logo, kilim band, icons), Chrome (header/footer),
                                       LanguageSwitcher, Forms (client), Sections, RichText
    src/app/(frontend)/[locale]/...    public pages (root layout sets lang/dir + theme CSS vars)
    src/app/(frontend)/actions.ts      server actions for forms (honeypot + min-fill-time)
    src/app/(payload)/...              Payload admin + REST (generated files – don't edit)

Public URL paths are (still) German for all locales: `/{locale}/ueber-uns`, `/angebote/[slug]`, `/veranstaltungen/[slug]`, `/aktuelles/[slug]`, `/mitmachen` (#mitglied, #spenden), `/kontakt`, `/transparenz`, `/impressum`, `/datenschutz`. `/` redirects to `/en`. **Open question for the client: rename URL paths to English?** Internal: `/intern` (finance dashboard, English UI, own root layout outside `[locale]`).

## Permission model

Roles are a collection; each role ticks permission flags: `manageContent`, `manageSettings`, `manageBoard`, `manageUsers`, `viewSubmissions`, `financeView`, `financeEntry`, `financeApprove`, `financeAdmin` (implies the other finance flags). Users can hold several roles (OR-combined). `isSuperAdmin` on user = all rights; only super-admins can set it.
Seeded default roles (English names since 2026-10-18): Administrator, Treasurer (financeAdmin), Board (financeView + financeApprove + content), Cash auditor (financeView), Editorial (manageContent), Project lead (financeEntry – sees only own bookings).
Form inbox collections have `create: () => false`; website forms write via server actions with `overrideAccess`.

## Finance rules (important – Gemeinnützigkeit depends on correct books)

- Every booking has one of the 4 tax spheres: `ideell`, `vermoegen` (Vermögensverwaltung), `zweckbetrieb`, `wgb` (wirtschaftlicher Geschäftsbetrieb). Defaults from category if empty.
- Workflow: `draft` → `submitted` → `approved`; also `rejected`, `reversed`. Approval via sidebar checkbox `approveNow` (hook adds `{user, approvedAt}` to `approvals`); status `approved` is never set directly – field validation blocks it unless `req.context.system` or `req.context.workflowApproval` (set by the approve hook itself; field validation runs *after* collection beforeChange hooks).
- FinanceSettings: `approvalsRequired` '1' | '2', `allowSelfApproval` (default false = four-eyes), `requireReceipt` on submit (default true).
- Changing key fields resets existing approvals.
- **Approved bookings are immutable** (access + hook). Corrections = storno: new booking with `reversalOf` → values copied & type inverted; when the storno is approved, the original becomes `reversed`. `isBooked()` excludes both halves of a storno pair from totals.
- Receipt numbers auto: `YYYY-0001` per year.
- FinancePeriods: locking a year blocks all bookings in it; only super-admin can unlock.
- Receipts stored in `private/receipts`, readable only by finance users. Retention: books 10 years, Buchungsbelege 8 years (since 2025).
- Audit log is read-only for everyone (writes only via hooks with overrideAccess). `req.context.system = true` bypasses business hooks for internal updates.

## Design

Palette (first three editable in SiteSettings → injected as CSS vars `--c-primary/--c-accent/--c-highlight`):
lapis `#23408E` (Badakhshan lapis lazuli), saffron gold `#E2A72E` (shared with German flag gold), pomegranate `#B0283F`, ink `#171A2B`, paper `#F6F7FB`, line `#D9DEEB`, mist `#E8ECF6`.
Logo: two interlaced rings (lapis + saffron, woven over/under) with a pomegranate four-point star where they meet; wordmark "Paywand e.V." + پیوند. Built-in SVG in `Brand.tsx` follows the CSS colour vars; an uploaded logo in SiteSettings replaces it. Static copies: `public/logo-symbol.svg`, `public/favicon.svg`.
Signature elements: large پیوند type in the hero; kilim-pattern band (stepped diamonds) as divider. Left-aligned layouts, no generic card grids, no all-caps eyebrow labels, motion minimal. WCAG 2.1 AA, keyboard focus visible, reduced motion respected.

## Status

Done: all collections/globals, permissions, finance workflow, audit log, public pages (Start, Über uns, Angebote + detail, Termine + detail with registration/capacity, Aktuelles + detail, Mitmachen, Kontakt, Transparenz, Impressum, Datenschutz), header/footer, language switcher, forms, i18n strings.
`npx tsc --noEmit` passes with zero errors; `src/payload-types.ts` is generated; `next build` succeeds (all routes dynamic, checked 2026-10-18).
Transparenz renders all 10 ITZ points (points 9/10 come from the new Vereinsdaten fields `affiliations`/`majorDonors`); the finance summary appears only when FinanceSettings.publishTransparency is on, transparencyYear is set AND that FinancePeriod is locked. Impressum = Vereinsdaten + SiteSettings contact + board members whose role has `representsVerein` + LegalPages.impressumExtra. Datenschutz = LegalPages.privacy with a fallback note while empty.
`/intern` is done (own root layout in `src/app/(intern)`, German only): dashboard (account balances, YTD by sphere, pending approvals, project budget vs actual, recent bookings; financeEntry-only users see just their own bookings), CSV export at `/intern/export?year=YYYY` (German Excel format: BOM, semicolons, decimal comma), printable EÜR at `/intern/jahresbericht/[year]` (by sphere, year-end balances, signature lines, print CSS). Auth via `getInternSession()` in `src/lib/intern.ts` (Payload cookie + permission flags); unauthenticated → redirect to `/admin/login?redirect=%2Fintern`.
Whole finance workflow verified end-to-end via REST: requireReceipt blocks submit without Beleg, four-eyes blocks self-approval, approved bookings are immutable, locked year hides nothing retroactively but blocks new bookings, only approved bookings appear in published transparency figures. Note for API tests: Payload cookie auth requires an `Origin` or `Sec-Fetch-Site: same-origin` header (CSRF guard) – with curl use `Authorization: JWT <token>` or send that header.
Seed script `src/seed/index.ts` is done (`npm run seed`, idempotent per section): 6 roles, 3 generated PNG placeholder images, all globals (incl. placeholder Datenschutzerklärung – legal review before launch!), 5 board roles / 5 members, 5 focus areas (DE+EN full; PS/FA titles+summaries), 3 events, 2 posts, 3 partners, 2 accounts, 10 categories. Gotchas learned: (1) `payload run` kills the process after module evaluation – a seed must `await` its main function at top level; (2) `localized: true` on an **array** field breaks on SQLite when another locale is saved (duplicate row-id insert) – localize fields inside the array instead (done for Homepage.facts: only `label` is localized).
Dev DB (`paywand.db`) = seed + super-admin `test@paywand.local` / `Testpass123!` + two demo bookings (2026-0001 approved, 2026-0002 submitted).
Language switch to English-first is complete (2026-10-18): `/` → `/en`, Payload defaultLocale/admin i18n 'en', all admin labels/errors English (German legal terms in parentheses), `/intern` + CSV + annual report English, donation-box labels moved to i18n, seeded role/account/category names English.
Membership-finance module is done (2026-10-18): collections Members (auto member number M-0001), MemberContributions (one per member+month, duplicate-guarded, amount defaults to the member's monthly fee), Donations (donor data for Zuwendungsbestätigung, receiptRequested/receiptIssuedOn). Recording a contribution or donation auto-creates a linked DRAFT transaction (FinanceSettings.autoBooking group: defaultAccount + categories; seeded) that goes through the normal approve workflow. `/intern` grew pages: contributions (year matrix members × months, “+” records a payment via server action in `src/app/(intern)/actions.ts`, arrears list, expected/received/outstanding), donations (register, totals, “mark receipt issued”), expenses (totals by category and by project budget vs spent, full expense list). Verified via REST on Postgres: duplicate guard, fee default, linked draft tx `2026-0025`.
Seed adds: autoBooking defaults, 6 demo members with 20 contribution payments (2 members in arrears), 2 donations, project “Kids' course autumn 2026” (budget 500) with 2 draft expenses (stationery, room rent).
Form/UI feedback round (2026-10-18): contact-form subject is full-width (`wide` flag on SiteForm fields); membership form asks for a structured German/EU address (street+no., PLZ, city – collection fields `street`/`postalCode`/`city` replaced the old `address` textarea, with autocomplete attributes); the event “Registration” tag moved inside the event text column (it overflowed the narrow aside on focus-area pages).
Admin panel is branded (2026-10-18): `src/app/(payload)/custom.scss` (Paywand theme) + `admin.components.graphics` Logo/Icon in `src/components/admin/AdminLogo.tsx`. custom.scss is NOT generated – it is ours to edit; after component changes run `npm run generate:importmap`. **Client feedback: sidebar must stay LIGHT with clear grouping – no dark nav.** Current design: light sidebar with small-caps muted group headers + hairline separators + lapis active pill; serif (Literata) dashboard group headings with a lapis/saffron underline; lapis primary buttons & focus rings; branded login card (ring logo, saffron top band, gradient backdrop); fonts self-hosted via `public/fonts/*.woff2` (GDPR-safe). Payload 3.91 dashboard headings use class `collections__label` (not `dashboard__label`).
Membership types & digital cards are done (2026-10-18): `membership-types` collection (admin-defined, localized names, default fee, active flag) replaces the hard-coded select on Members, MembershipApplications and the public form (which loads active types dynamically). **Note: Members.membershipType is required at app level only (validate fn) – a DB NOT NULL would make drizzle push prompt interactively.** Digital membership cards: credit-card-format front (logo, پیوند, name, type, member no., member since, Verein address, QR) + back (admin texts in the `membership-card` global: mission, verify hint, footer), rendered via `src/lib/card.ts`. `/intern/cards` (visible to financeAdmin/manageContent/manageUsers – nav + pages gate finance links via `session.isFinance`) offers PNG/PDF download and “Send by email” (PDF+PNGs attached; Payload email adapter – nodemailer when SMTP_* env set, console otherwise; sets `cardSentAt`). QR → `/verify/<cardToken>` checks LIVE against the register: member inactive or left ⇒ “No active membership” (verified round-trip). **Deployment requirement: the server needs the three woff2 fonts registered with fontconfig (`~/.fonts` + `fc-cache`) for sharp/librsvg card rendering – Instrument Sans, Literata, Noto Naskh Arabic (from @fontsource-variable packages).**
Card workflows (2026-10-19): `/intern/cards` is the hub (Add member, Create event card, card settings, open-applications banner, per-card Preview page `/intern/cards/[id]/preview` rendering the PNG inline via `?inline=1`). **Option 1 – auto:** setting a membership application to status “Accepted” always creates the member (address composed, type from application or first active type, token via hook) and links it on the application; when `membership-card.autoSendOnAccept` is ON (toggle, seeded true) the card is also emailed with the localized `welcomeText`. **Option 2 – manual:** send buttons on /intern/cards (shared logic in `src/lib/card-email.ts`). **Event/staff cards:** `event-cards` collection (Association group; personName, role free text, event rel or eventLabel, email, validUntil, active) rendered by the same template with 'EVENT STAFF CARD' subtitle + pomegranate role accent; routes under `/intern/cards/event/[id]/…`; `/verify/[token]` checks members first, then event cards (invalid when inactive or past validUntil). **Transaction gotcha:** hooks that read docs created in the same request MUST pass `req` into local-API calls (loadCardData/emailMemberCard accept `req`) – without it the uncommitted row is invisible and the card send silently no-ops.
Card **orientation (portrait/landscape) and language (en/de) are admin settings** in the membership-card global (2026-10-19; both layouts implemented in `src/lib/card.ts`, strings in `CARD_STRINGS`, dates via locale, type/event names + back texts fetched in the card language, card emails localized too; combined PNG adapts: portrait = side by side, landscape = stacked; PDF page size follows orientation). Current setting: portrait + German. Phone-wallet passes (Apple .pkpass / Google Wallet) are Phase 2: both need paid/approved issuer accounts; token + verify URL are already wallet-ready.
User guides (2026-10-19): `/intern/guide` (admin guide – any logged-in user) and `/intern/guide/finance` (gated: finance perms only, others redirect to the admin guide). Linked from the Payload admin sidebar via `FinanceNavLink` (now an async server component receiving `payload`+`user`, so the finance dashboard + finance guide links render only for finance users; verified with editor-only user `editor@paywand.local` / `Editorpass123!`). The /intern nav has a “Guide” link that targets the right guide per role.
Admin screenshots for visual checks work headlessly without sudo: playwright-core (scratchpad) + `~/.cache/ms-playwright/chromium_headless_shell-*` with `LD_LIBRARY_PATH` pointing at libs extracted from `apt-get download libnspr4 libnss3 libasound2t64` + `dpkg -x` (no root needed).

TODO (rough priority):
1. Replace `any` with generated types from `src/payload-types.ts` where useful.
2. Phase 2: 2FA (TOTP plugin), membership fees, Zuwendungsbestätigung PDF generation (amtliches Muster), CSV import from their existing Excel/Google Sheet, email notifications for new submissions, deployment (Postgres, Hetzner, backups).

## Conventions & notes

- Admin UI labels in English (client decision 2026-10-18); German tax/legal terms kept in parentheses, e.g. 'Ideell (charitable core)', 'Statutes (Satzung)'. UI strings for the public site live in `src/i18n` – Pashto and Dari need review by a native speaker (Jan).
- Localized content fields use `localized: true`; fallback locale is **English** (Payload defaultLocale 'en'). The seed authors German content and writes it explicitly with `locale: 'de'`.
- Don't make a localized field inside a shared array `required` – every locale update would have to re-supply it (see Homepage.facts.label).
- CSV export is international format (comma separator, decimal point, ISO dates, UTF-8 BOM).
- Use `<img>` for Payload media (URLs under `/api/media/file/...`), not next/image, unless configured.
- Legal: Impressum per §5 DDG, photo consent (parents for minors), no third-party embeds without consent.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
