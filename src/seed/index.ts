/**
 * Demo-/Platzhalterdaten für die Entwicklung: `npm run seed`
 * Idempotent: Bereiche, in denen schon Daten existieren, werden übersprungen.
 * Reale Inhalte werden später im Admin-Panel gepflegt.
 */
import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { deflateSync } from 'node:zlib'

/* ---------- Helfer ---------- */

const text = (t: string) => ({ type: 'text', version: 1, text: t, format: 0, mode: 'normal', style: '', detail: 0 })
const para = (t: string) => ({ type: 'paragraph', version: 1, children: [text(t)], direction: null, format: '', indent: 0, textFormat: 0 })
const heading = (t: string) => ({ type: 'heading', tag: 'h2', version: 1, children: [text(t)], direction: null, format: '', indent: 0 })
/** Einfacher Lexical-RichText aus Absätzen; Strings mit führendem "## " werden Überschriften. */
const rt = (...blocks: string[]) => ({
  root: {
    type: 'root',
    version: 1,
    children: blocks.map((b) => (b.startsWith('## ') ? heading(b.slice(3)) : para(b))),
    direction: null,
    format: '',
    indent: 0,
  },
})

const bullets = (...items: string[]) => items.map((t) => ({ text: t }))
const daysFromNow = (days: number, hour = 16) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

/* Minimaler PNG-Generator (einfarbig mit dunklerem Streifen unten) für Platzhalterbilder. */
function crc32(buf: Buffer): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function makePng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const darker = rgb.map((v) => Math.round(v * 0.72)) as [number, number, number]
  const rows: Buffer[] = []
  for (let y = 0; y < height; y++) {
    const c = y > height * 0.78 ? darker : rgb
    const row = Buffer.alloc(1 + width * 3)
    for (let x = 0; x < width; x++) {
      row[1 + x * 3] = c[0]
      row[2 + x * 3] = c[1]
      row[3 + x * 3] = c[2]
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(Buffer.concat(rows))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

async function isEmpty(payload: Payload, collection: any): Promise<boolean> {
  const { totalDocs } = await payload.count({ collection })
  return totalDocs === 0
}

/* Localised fields: German content is authored in the seed and written explicitly to the
   'de' locale (English is the default locale); the other locales are added afterwards. */
type SeedLocale = 'de' | 'en' | 'ps' | 'fa'
type LocaleData = Partial<Record<SeedLocale, Record<string, unknown>>>
async function translate(payload: Payload, collection: any, id: string | number, locales: LocaleData) {
  for (const [locale, data] of Object.entries(locales)) {
    await payload.update({ collection, id, data, locale: locale as SeedLocale })
  }
}
async function translateGlobal(payload: Payload, slug: any, locales: LocaleData) {
  for (const [locale, data] of Object.entries(locales)) {
    await payload.updateGlobal({ slug, data, locale: locale as SeedLocale })
  }
}

/* ---------- Seed-Bereiche ---------- */

async function seedRoles(payload: Payload) {
  if (!(await isEmpty(payload, 'roles'))) return console.log('– roles exist, skipped')
  const roles: Record<string, [string, string[]]> = {
    Administrator: ['Manages website, users and association data (no finances)', ['manageContent', 'manageSettings', 'manageBoard', 'manageUsers', 'viewSubmissions']],
    Treasurer: ['Full finance administration incl. year-end closing (Kassenwart/in)', ['financeAdmin']],
    Board: ['Website content, inbox, plus viewing and approving finances (Vorstand)', ['manageContent', 'viewSubmissions', 'financeView', 'financeApprove']],
    'Cash auditor': ['Read-only access to all finance data (Kassenprüfer/in)', ['financeView']],
    Editorial: ['Maintains programmes, events and posts', ['manageContent']],
    'Project lead': ['Enters own transactions and receipts', ['financeEntry']],
  }
  for (const [name, [description, perms]] of Object.entries(roles)) {
    await payload.create({
      collection: 'roles',
      data: { name, description, permissions: Object.fromEntries(perms.map((p) => [p, true])) } as any,
    })
  }
  console.log('✓ 6 roles')
}

async function seedMedia(payload: Payload): Promise<Record<string, string | number>> {
  const existing = await payload.find({ collection: 'media', limit: 10 })
  if (existing.totalDocs > 0) {
    console.log('– media exist, skipped')
    const ids: Record<string, string | number> = {}
    existing.docs.forEach((d: any, i: number) => (ids[`img${i + 1}`] = d.id))
    return ids
  }
  const images: [string, string, [number, number, number]][] = [
    ['placeholder-lapis.png', 'Placeholder image in lapis blue', [35, 64, 142]],
    ['placeholder-saffron.png', 'Placeholder image in saffron gold', [226, 167, 46]],
    ['placeholder-pomegranate.png', 'Placeholder image in pomegranate red', [176, 40, 63]],
  ]
  const ids: Record<string, string | number> = {}
  let i = 1
  for (const [name, alt, rgb] of images) {
    const data = makePng(1200, 800, rgb)
    const doc = await payload.create({
      collection: 'media',
      data: { alt, consentOnFile: true } as any,
      file: { data, mimetype: 'image/png', name, size: data.length },
    })
    ids[`img${i++}`] = doc.id
  }
  console.log('✓ 3 placeholder images')
  return ids
}

async function seedGlobals(payload: Payload, img: Record<string, string | number>) {
  const site: any = await payload.findGlobal({ slug: 'site-settings' })
  if (site?.email) {
    console.log('– globals exist, skipped')
    return
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'de',
    data: {
      siteName: 'Paywand',
      nativeName: 'پیوند',
      tagline: 'Afghanischer Verein für Integration und Kultur in Berlin',
      email: 'info@paywand-berlin.de',
      phone: '+49 30 1234567',
      whatsapp: '+49 176 12345678',
      street: 'Beispielstraße 12',
      postalCode: '12049',
      city: 'Berlin',
      officeHours: 'Di & Do 15–18 Uhr\nsowie nach Vereinbarung',
      social: [{ platform: 'instagram', url: 'https://instagram.com/paywand.ev' }],
      accountHolder: 'Paywand e.V.',
      iban: 'DE02 1203 0000 0000 2020 51',
      bic: 'BYLADEM1001',
      bank: 'Deutsche Kreditbank (DKB)',
      donationNote: 'Paywand e.V. ist als gemeinnützig anerkannt. Für Spenden stellen wir gerne eine Zuwendungsbestätigung aus – bitte Anschrift im Verwendungszweck angeben.',
    } as any,
  })
  await translateGlobal(payload, 'site-settings', {
    en: {
      tagline: 'Afghan association for integration and culture in Berlin',
      officeHours: 'Tue & Thu 3–6 pm\nand by appointment',
      donationNote: 'Paywand e.V. is a registered non-profit. We are happy to issue a donation receipt (Zuwendungsbestätigung) – please include your address in the payment reference.',
    },
    ps: { tagline: 'په برلین کې د ادغام او کلتور لپاره افغان ټولنه' },
    fa: { tagline: 'انجمن افغان برای ادغام و فرهنگ در برلین' },
  })

  await payload.updateGlobal({
    slug: 'vereinsdaten',
    locale: 'de',
    data: {
      officialName: 'Paywand – Afghanischer Verein für Integration und Kultur in Berlin e.V.',
      foundedOn: '2024-05-15T12:00:00.000Z',
      registerCourt: 'Amtsgericht Charlottenburg',
      registerNumber: 'VR 41234 B',
      taxOffice: 'Finanzamt für Körperschaften I Berlin',
      exemptionType: 'feststellung',
      exemptionDate: '2024-09-10T12:00:00.000Z',
      purposes:
        'Der Verein fördert die Integration von Menschen mit afghanischer Einwanderungsgeschichte in Berlin, insbesondere durch Bildungsangebote, Jugendförderung, kulturelle Veranstaltungen und interkulturellen Dialog. Er arbeitet überparteilich und überkonfessionell.',
      memberCount: 48,
      volunteerCount: 15,
      staffInfo: 'Der Verein arbeitet vollständig ehrenamtlich; es gibt keine hauptamtlichen Beschäftigten.',
      affiliations: 'Paywand e.V. ist an keinen Unternehmen beteiligt und mit keinen Organisationen gesellschaftsrechtlich verbunden.',
      majorDonors: 'Im letzten Geschäftsjahr gab es keine juristische Person, deren Zuwendungen mehr als 10 % der Gesamteinnahmen ausmachten.',
    } as any,
  })
  await translateGlobal(payload, 'vereinsdaten', {
    en: {
      purposes:
        'The association supports the integration of people with Afghan roots in Berlin, in particular through education, youth work, cultural events and intercultural dialogue. It is non-partisan and non-denominational.',
      staffInfo: 'The association is run entirely by volunteers; there are no paid staff.',
      affiliations: 'Paywand e.V. holds no shares in companies and has no corporate affiliations.',
      majorDonors: 'In the last financial year no legal entity contributed more than 10% of total income.',
    },
    ps: { purposes: 'ټولنه په برلین کې د افغان پس‌منظر لرونکو خلکو ادغام ملاتړ کوي – د زده‌کړې، ځوانانو، کلتوري پروګرامونو او بین‌الثقافتي خبرو اترو له لارې.' },
    fa: { purposes: 'انجمن از ادغام افراد با پیشینه افغانی در برلین حمایت می‌کند – از طریق آموزش، کار با جوانان، برنامه‌های فرهنگی و گفتگوی بین‌فرهنگی.' },
  })

  await payload.updateGlobal({
    slug: 'homepage',
    locale: 'de',
    data: {
      heroTitle: 'Gemeinsam ankommen. Gemeinsam gestalten.',
      heroText:
        'Paywand heißt Verbindung: Wir bringen afghanische Familien, Nachbarinnen und Nachbarn in Berlin zusammen – mit Sprachkursen, Jugendangeboten, Festen und offenen Ohren.',
      heroImage: img.img1,
      introTitle: 'Wer wir sind',
      introText:
        'Paywand e.V. ist ein gemeinnütziger Verein aus Berlin. Seit der Gründung engagieren wir uns ehrenamtlich für Integration, Bildung, Jugendförderung, Kultur und interkulturellen Dialog.',
      facts: [
        { value: '48', label: 'Mitglieder' },
        { value: '15', label: 'Ehrenamtliche' },
        { value: '5', label: 'Schwerpunkte' },
        { value: '4', label: 'Sprachen' },
      ],
      quote: {
        text: 'Bei Paywand habe ich nicht nur Deutsch gelernt, sondern Menschen gefunden, die wie Familie sind.',
        author: 'Teilnehmerin des Konversationskurses',
      },
    } as any,
  })
  await translateGlobal(payload, 'homepage', {
    en: {
      heroTitle: 'Arriving together. Shaping together.',
      heroText:
        'Paywand means connection: we bring Afghan families and Berlin neighbours together – with language courses, youth activities, festivals and open ears.',
      introTitle: 'Who we are',
      introText:
        'Paywand e.V. is a registered non-profit from Berlin. Since our founding we have been volunteering for integration, education, youth work, culture and intercultural dialogue.',
      quote: { text: 'At Paywand I did not just learn German – I found people who feel like family.', author: 'Participant of the conversation course' },
    },
    ps: { heroTitle: 'یوځای رارسېدل، یوځای جوړول.', heroText: 'پیوند د اړیکې مانا لري: موږ افغان کورنۍ او د برلین ګاونډیان سره یوځای کوو.', introTitle: 'موږ څوک یو' },
    fa: { heroTitle: 'با هم رسیدن، با هم ساختن.', heroText: 'پیوند یعنی ارتباط: ما خانواده‌های افغان و همسایگان برلین را گرد هم می‌آوریم.', introTitle: 'ما کی هستیم' },
  })
  // Kennzahl-Beschriftungen je Sprache: Zeilen-IDs aus dem gespeicherten Stand übernehmen,
  // damit dieselben Zeilen aktualisiert statt neu angelegt werden.
  const savedHome: any = await payload.findGlobal({ slug: 'homepage', depth: 0, locale: 'de' })
  if (savedHome?.facts?.length) {
    const labels: Record<string, string[]> = {
      en: ['members', 'volunteers', 'focus areas', 'languages'],
      ps: ['غړي', 'رضاکاران', 'برخې', 'ژبې'],
      fa: ['اعضا', 'رضاکاران', 'بخش‌ها', 'زبان‌ها'],
    }
    for (const [locale, l] of Object.entries(labels)) {
      await payload.updateGlobal({
        slug: 'homepage',
        locale: locale as 'en' | 'ps' | 'fa',
        data: { facts: savedHome.facts.map((f: any, i: number) => ({ id: f.id, value: f.value, label: l[i] ?? f.label })) } as any,
      })
    }
  }

  await payload.updateGlobal({
    slug: 'legal-pages',
    locale: 'de',
    data: {
      impressumExtra: rt(
        'Inhaltlich verantwortlich nach § 18 Abs. 2 MStV ist der vertretungsberechtigte Vorstand (Anschrift wie oben).',
        'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: https://ec.europa.eu/consumers/odr. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
      ),
      privacy: rt(
        '## Verantwortliche Stelle',
        'Verantwortlich für die Datenverarbeitung auf dieser Website ist Paywand e.V. (Kontaktdaten siehe Impressum).',
        '## Welche Daten wir verarbeiten',
        'Beim Besuch der Website verarbeitet unser Hoster technisch notwendige Server-Logdaten (IP-Adresse, Zeitpunkt, aufgerufene Seite) zur Bereitstellung und Sicherheit des Angebots (Art. 6 Abs. 1 lit. f DSGVO). Diese Website setzt keine Tracking-Cookies und keine Analysedienste von Drittanbietern ein.',
        '## Formulare',
        'Angaben aus Kontakt-, Anmelde- und Mitgliedsformularen verarbeiten wir ausschließlich zur Bearbeitung der jeweiligen Anfrage (Art. 6 Abs. 1 lit. b DSGVO) und löschen sie, sobald sie nicht mehr erforderlich sind und keine gesetzlichen Aufbewahrungspflichten bestehen.',
        '## Ihre Rechte',
        'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch (Art. 15–21 DSGVO) und können sich bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit beschweren.',
        'Hinweis: Diese Datenschutzerklärung ist ein Platzhalter für die Entwicklung und muss vor dem Livegang rechtlich geprüft werden.',
      ),
    } as any,
  })
  await translateGlobal(payload, 'legal-pages', {
    en: {
      impressumExtra: rt(
        'Responsible for content pursuant to § 18 (2) MStV: the authorised board (address as above).',
        'The European Commission provides a platform for online dispute resolution: https://ec.europa.eu/consumers/odr. We are neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.',
      ),
      privacy: rt(
        '## Controller',
        'The controller for data processing on this website is Paywand e.V. (contact details in the legal notice).',
        '## What data we process',
        'When you visit this website, our hosting provider processes technically necessary server log data (IP address, time, page requested) to deliver and secure the service (Art. 6 (1) (f) GDPR). This website sets no tracking cookies and uses no third-party analytics.',
        '## Forms',
        'Details from contact, registration and membership forms are processed solely to handle the respective request (Art. 6 (1) (b) GDPR) and deleted once no longer required and no statutory retention periods apply.',
        '## Your rights',
        'You have the right to access, rectification, erasure, restriction of processing, data portability and objection (Art. 15–21 GDPR), and you may lodge a complaint with the Berlin Commissioner for Data Protection and Freedom of Information.',
        'Note: this privacy policy is a development placeholder and must be legally reviewed before going live.',
      ),
    },
  })
  console.log('✓ globals (SiteSettings, Vereinsdaten, Homepage, LegalPages)')
}

async function seedBoard(payload: Payload) {
  if (!(await isEmpty(payload, 'board-roles'))) return console.log('– board exists, skipped')
  const roles: [string, string, number, boolean][] = [
    ['1. Vorsitzende/r', 'Chairperson', 1, true],
    ['2. Vorsitzende/r', 'Vice chairperson', 2, true],
    ['Kassenwart/in', 'Treasurer', 3, true],
    ['Schriftführer/in', 'Secretary', 4, false],
    ['Beisitzer/in', 'Board member', 5, false],
  ]
  const roleIds: (string | number)[] = []
  for (const [title, en, order, represents] of roles) {
    const doc = await payload.create({ collection: 'board-roles', locale: 'de', data: { title, order, representsVerein: represents } as any })
    await translate(payload, 'board-roles', doc.id, { en: { title: en } })
    roleIds.push(doc.id)
  }
  const members: [string, number, string, string][] = [
    ['Nadia Rahimi', 0, 'Mitgründerin von Paywand, Sozialpädagogin, seit 2010 in Berlin.', 'Co-founder of Paywand, social worker, in Berlin since 2010.'],
    ['Jawid Karimi', 1, 'Ingenieur und ehrenamtlicher Deutschlehrer, verantwortlich für die Kursangebote.', 'Engineer and volunteer German teacher, responsible for the course programme.'],
    ['Farida Azimi', 2, 'Betriebswirtin, führt die Vereinskasse und erstellt den Jahresabschluss.', 'Business economist, keeps the books and prepares the annual accounts.'],
    ['Omid Safi', 3, 'Student, protokolliert die Sitzungen und betreut die Mitgliederliste.', 'Student, takes the minutes and maintains the membership list.'],
    ['Laila Noori', 4, 'Organisiert Feste und den Frauentreff.', "Organises festivals and the women's meet-up."],
  ]
  for (const [name, roleIdx, bioDe, bioEn] of members) {
    const doc = await payload.create({
      collection: 'board-members',
      locale: 'de',
      data: { name, role: roleIds[roleIdx], bio: bioDe, order: roleIdx + 1, active: true, termStart: '2025-03-20T12:00:00.000Z', termEnd: '2027-03-20T12:00:00.000Z' } as any,
    })
    await translate(payload, 'board-members', doc.id, { en: { bio: bioEn } })
  }
  console.log('✓ 5 board roles, 5 board members')
}

async function seedFocusAreas(payload: Payload, img: Record<string, string | number>): Promise<(string | number)[]> {
  if (!(await isEmpty(payload, 'focus-areas'))) {
    console.log('– focus areas exist, skipped')
    return (await payload.find({ collection: 'focus-areas', limit: 10, sort: 'order' })).docs.map((d: any) => d.id)
  }
  const areas = [
    {
      de: {
        title: 'Integration & Beratung',
        slug: 'integration-beratung',
        icon: 'integration',
        order: 1,
        image: img.img1,
        summary: 'Wir begleiten Neuangekommene bei Behördengängen, Wohnungssuche und im Alltag – vertraulich und auf Augenhöhe.',
        bullets: bullets('Hilfe bei Anträgen und Behördenpost', 'Begleitung zu Terminen (Jobcenter, LEA, Schule)', 'Vermittlung an Fachberatungsstellen'),
        body: rt(
          'Ankommen ist mehr als ein Stempel im Pass. Unsere ehrenamtlichen Lots*innen unterstützen auf Deutsch, Paschtu und Dari – von der ersten Anmeldung bis zur Anerkennung von Abschlüssen.',
          'Die Beratung ist kostenlos. Wir ersetzen keine Rechtsberatung, kennen aber die richtigen Anlaufstellen in Berlin.',
        ),
        howToJoin: 'Komm einfach in die Sprechstunde (Di & Do 15–18 Uhr) oder schreib uns – wir melden uns innerhalb weniger Tage.',
      },
      en: {
        title: 'Integration & counselling',
        summary: 'We support newcomers with authorities, housing and everyday life – confidentially and at eye level.',
        bullets: bullets('Help with applications and official letters', 'Accompaniment to appointments (job centre, immigration office, school)', 'Referral to specialist counselling services'),
        body: rt(
          'Arriving is more than a stamp in a passport. Our volunteer guides help in German, Pashto and Dari – from the first registration to the recognition of qualifications.',
          'Counselling is free of charge. We do not replace legal advice, but we know the right places to go in Berlin.',
        ),
        howToJoin: 'Just drop by during office hours (Tue & Thu 3–6 pm) or write to us – we reply within a few days.',
      },
      ps: { title: 'ادغام او مشوره', summary: 'موږ له نویو راغلو سره د ادارو، کور لټون او ورځني ژوند په چارو کې مرسته کوو.' },
      fa: { title: 'ادغام و مشاوره', summary: 'ما تازه‌واردان را در امور ادارات، جستجوی خانه و زندگی روزمره همراهی می‌کنیم.' },
    },
    {
      de: {
        title: 'Bildung & Sprache',
        slug: 'bildung-sprache',
        icon: 'bildung',
        order: 2,
        image: img.img2,
        summary: 'Deutsch-Konversationskurse, Hausaufgabenhilfe und Nachhilfe für Kinder und Erwachsene.',
        bullets: bullets('Deutsch-Konversation für Erwachsene (A2–B2)', 'Hausaufgabenhilfe für Schüler/innen', 'Alphabetisierung und Lernbegleitung für Frauen'),
        body: rt(
          'Sprache öffnet Türen. Zweimal pro Woche üben wir in kleinen Gruppen Alltagsgespräche; parallel helfen Ehrenamtliche Kindern bei den Hausaufgaben.',
          'Alle Angebote sind kostenlos. Quereinstieg ist jederzeit möglich.',
        ),
        howToJoin: 'Anmeldung per E-Mail oder einfach zum Schnuppern vorbeikommen – Termine stehen im Kalender.',
      },
      en: {
        title: 'Education & language',
        summary: 'German conversation courses, homework help and tutoring for children and adults.',
        bullets: bullets('German conversation for adults (A2–B2)', 'Homework help for pupils', 'Literacy and learning support for women'),
        body: rt(
          'Language opens doors. Twice a week we practise everyday conversations in small groups; volunteers help children with their homework in parallel.',
          'All offers are free of charge. You can join at any time.',
        ),
        howToJoin: 'Register by email or just come by for a trial session – dates are in the calendar.',
      },
      ps: { title: 'زده‌کړه او ژبه', summary: 'د الماني خبرو اترو کورسونه، د کورنۍ دندې مرسته او ښوونیزه ملاتړ.' },
      fa: { title: 'آموزش و زبان', summary: 'کورس‌های مکالمه آلمانی، کمک درسی و تقویتی برای کودکان و بزرگسالان.' },
    },
    {
      de: {
        title: 'Jugend & Sport',
        slug: 'jugend-sport',
        icon: 'jugend',
        order: 3,
        image: img.img3,
        summary: 'Fußball, Ausflüge und ein offener Jugendtreff – Räume, in denen junge Menschen wachsen können.',
        bullets: bullets('Wöchentliches Fußballtraining', 'Jugendtreff mit Spielen und Workshops', 'Ausflüge und Ferienaktionen'),
        body: rt(
          'Im Jugendtreff planen die Jugendlichen selbst, was passiert – vom Bewerbungstraining bis zum Kinoabend. Beim Sport zählt nicht, woher du kommst, sondern dass du dabei bist.',
        ),
        howToJoin: 'Komm donnerstags ab 17 Uhr vorbei oder schreib uns auf Instagram.',
      },
      en: {
        title: 'Youth & sports',
        summary: 'Football, excursions and an open youth club – spaces where young people can grow.',
        bullets: bullets('Weekly football training', 'Youth club with games and workshops', 'Excursions and holiday activities'),
        body: rt(
          'At the youth club, young people decide themselves what happens – from application training to cinema nights. In sports it does not matter where you come from, only that you join in.',
        ),
        howToJoin: 'Come by on Thursdays from 5 pm or message us on Instagram.',
      },
      ps: { title: 'ځوانان او سپورت', summary: 'فوټبال، سیلونه او د ځوانانو خلاص ټولځای.' },
      fa: { title: 'جوانان و ورزش', summary: 'فوتبال، گردش‌ها و یک پاتوق باز برای جوانان.' },
    },
    {
      de: {
        title: 'Kultur & Feste',
        slug: 'kultur-feste',
        icon: 'kultur',
        order: 4,
        image: img.img2,
        summary: 'Nouruz, Eid und Nachbarschaftsfeste: Wir feiern afghanische Kultur und teilen sie mit ganz Berlin.',
        bullets: bullets('Nouruz- und Eid-Feiern', 'Musik-, Poesie- und Kochabende', 'Offene Nachbarschaftsfeste im Kiez'),
        body: rt(
          'Kultur verbindet Generationen. Bei unseren Festen kommen Familien zusammen, Kinder lernen Traditionen kennen, und Nachbarinnen und Nachbarn sind ausdrücklich eingeladen.',
        ),
        howToJoin: 'Die nächsten Feste stehen im Kalender – hilf gerne beim Aufbau oder bring etwas für das Buffet mit.',
      },
      en: {
        title: 'Culture & festivals',
        summary: 'Nowruz, Eid and neighbourhood festivals: we celebrate Afghan culture and share it with all of Berlin.',
        bullets: bullets('Nowruz and Eid celebrations', 'Music, poetry and cooking evenings', 'Open neighbourhood festivals'),
        body: rt(
          'Culture connects generations. At our festivals families come together, children get to know traditions, and neighbours are expressly invited.',
        ),
        howToJoin: 'Upcoming festivals are in the calendar – feel free to help with the setup or bring something for the buffet.',
      },
      ps: { title: 'کلتور او جشنونه', summary: 'نوروز، اختر او د ګاونډیتوب جشنونه: موږ افغان کلتور لمانځو او له ټول برلین سره یې شریکوو.' },
      fa: { title: 'فرهنگ و جشن‌ها', summary: 'نوروز، عید و جشن‌های محله: ما فرهنگ افغانی را جشن می‌گیریم و با تمام برلین شریک می‌سازیم.' },
    },
    {
      de: {
        title: 'Dialog & Begegnung',
        slug: 'dialog-begegnung',
        icon: 'dialog',
        order: 5,
        image: img.img1,
        summary: 'Gesprächsrunden, Frauentreff und Austausch mit Schulen, Kirchen und Moscheen im Bezirk.',
        bullets: bullets('Monatlicher Frauentreff', 'Erzählcafé für Jung und Alt', 'Dialogveranstaltungen mit Nachbarschaftsinitiativen'),
        body: rt(
          'Vorurteile schrumpfen am schnellsten am gemeinsamen Tisch. Unsere Dialogformate bringen Menschen ins Gespräch, die sich sonst selten begegnen würden.',
        ),
        howToJoin: 'Alle Termine sind offen – komm einfach dazu oder lade uns zu deiner Initiative ein.',
      },
      en: {
        title: 'Dialogue & encounter',
        summary: "Discussion groups, a women's meet-up and exchange with schools, churches and mosques in the district.",
        bullets: bullets("Monthly women's meet-up", 'Storytelling café for young and old', 'Dialogue events with neighbourhood initiatives'),
        body: rt('Prejudices shrink fastest at a shared table. Our dialogue formats bring people into conversation who would otherwise rarely meet.'),
        howToJoin: 'All dates are open – just join in or invite us to your initiative.',
      },
      ps: { title: 'خبرې اترې او لیدنې', summary: 'د خبرو اترو ناستې، د ښځو ټولنه او له ښوونځیو او ګاونډیو سره تبادله.' },
      fa: { title: 'گفتگو و دیدار', summary: 'حلقه‌های گفتگو، نشست زنان و تبادل با مکاتب و ابتکارات محله.' },
    },
  ]
  const ids: (string | number)[] = []
  for (const a of areas) {
    const doc = await payload.create({ collection: 'focus-areas', locale: 'de', data: a.de as any })
    await translate(payload, 'focus-areas', doc.id, { en: a.en, ps: a.ps, fa: a.fa })
    ids.push(doc.id)
  }
  console.log('✓ 5 focus areas')
  return ids
}

async function seedEvents(payload: Payload, focus: (string | number)[], img: Record<string, string | number>) {
  if (!(await isEmpty(payload, 'events'))) return console.log('– events exist, skipped')
  const events = [
    {
      de: {
        title: 'Offenes Nachbarschaftsfest im Herbst',
        slug: 'nachbarschaftsfest-herbst',
        startsAt: daysFromNow(21, 14),
        endsAt: daysFromNow(21, 19),
        location: 'Hof des Nachbarschaftshauses',
        address: 'Beispielstraße 12, 12049 Berlin',
        focusArea: focus[3],
        languages: ['de', 'ps', 'fa'],
        price: 'kostenlos',
        summary: 'Musik, afghanisches Essen und Mitmachangebote für Kinder – alle Nachbarinnen und Nachbarn sind herzlich willkommen.',
        description: rt('Wir feiern den Herbst mit Livemusik, einem großen Buffet und Spielen für Kinder. Bringt gerne Freundinnen, Freunde und Familie mit!'),
        image: img.img3,
        registrationEnabled: false,
      },
      en: {
        title: 'Open neighbourhood festival in autumn',
        location: 'Courtyard of the neighbourhood house',
        price: 'free',
        summary: 'Music, Afghan food and activities for children – all neighbours are warmly welcome.',
        description: rt('We celebrate autumn with live music, a big buffet and games for children. Bring your friends and family!'),
      },
      ps: { title: 'د منی د ګاونډیتوب خلاص جشن', price: 'وړیا', summary: 'موسیقي، افغاني خواړه او د ماشومانو لپاره لوبې – ټول ګاونډیان ښه راغلاست.' },
      fa: { title: 'جشن باز محله در خزان', price: 'رایگان', summary: 'موسیقی، غذای افغانی و برنامه برای کودکان – همه همسایگان خوش آمدید.' },
    },
    {
      de: {
        title: 'Deutsch-Konversationskurs: neuer Durchgang',
        slug: 'konversationskurs-neuer-durchgang',
        startsAt: daysFromNow(10, 18),
        location: 'Vereinsräume Paywand',
        address: 'Beispielstraße 12, 12049 Berlin',
        focusArea: focus[1],
        languages: ['de'],
        price: 'kostenlos',
        summary: 'Acht Abende Alltagsdeutsch in kleiner Runde (Niveau A2–B1). Anmeldung erforderlich, Plätze begrenzt.',
        description: rt('In lockerer Runde üben wir Gespräche aus dem Alltag: Arztbesuch, Elternabend, Smalltalk. Der Kurs läuft acht Wochen, je dienstags 18–19:30 Uhr.'),
        image: img.img2,
        registrationEnabled: true,
        capacity: 14,
      },
      en: {
        title: 'German conversation course: new round',
        location: 'Paywand club rooms',
        price: 'free',
        summary: 'Eight evenings of everyday German in a small group (level A2–B1). Registration required, places limited.',
        description: rt('In a relaxed group we practise everyday conversations: doctor visits, parent-teacher evenings, small talk. The course runs for eight weeks, Tuesdays 6–7:30 pm.'),
      },
      ps: { title: 'د الماني خبرو اترو کورس: نوی پړاو', price: 'وړیا', summary: 'اته ماښامه ورځنۍ الماني په کوچنۍ ډله کې (A2–B1). نوم لیکنه اړینه ده.' },
      fa: { title: 'کورس مکالمه آلمانی: دور جدید', price: 'رایگان', summary: 'هشت شب آلمانی روزمره در گروه کوچک (سطح A2–B1). ثبت‌نام ضروری است.' },
    },
    {
      de: {
        title: 'Info-Abend: Schulsystem in Berlin',
        slug: 'infoabend-schulsystem',
        startsAt: daysFromNow(35, 18),
        location: 'Vereinsräume Paywand',
        address: 'Beispielstraße 12, 12049 Berlin',
        focusArea: focus[0],
        languages: ['de', 'ps', 'fa'],
        price: 'kostenlos',
        summary: 'Für Eltern: Wie funktioniert die Berliner Schule? Mit Übersetzung in Paschtu und Dari.',
        description: rt('Eine Lehrerin erklärt Einschulung, Notensystem und Elternrechte. Im Anschluss beantworten wir Fragen – auf Deutsch, Paschtu und Dari.'),
        image: img.img1,
        registrationEnabled: true,
        capacity: 30,
      },
      en: {
        title: 'Info evening: the Berlin school system',
        location: 'Paywand club rooms',
        price: 'free',
        summary: 'For parents: how does school in Berlin work? With interpretation into Pashto and Dari.',
        description: rt('A teacher explains enrolment, grading and parents’ rights. Afterwards we answer questions – in German, Pashto and Dari.'),
      },
      ps: { title: 'معلوماتي ماښام: په برلین کې ښوونیز نظام', price: 'وړیا', summary: 'د والدینو لپاره: د برلین ښوونځي څنګه کار کوي؟ له پښتو او دري ژباړې سره.' },
      fa: { title: 'شب معلوماتی: نظام مکتب در برلین', price: 'رایگان', summary: 'برای والدین: مکتب در برلین چگونه کار می‌کند؟ با ترجمه به پشتو و دری.' },
    },
  ]
  for (const e of events) {
    const doc = await payload.create({ collection: 'events', locale: 'de', data: e.de as any })
    await translate(payload, 'events', doc.id, { en: e.en, ps: e.ps, fa: e.fa })
  }
  console.log('✓ 3 events')
}

async function seedPosts(payload: Payload, focus: (string | number)[], img: Record<string, string | number>) {
  if (!(await isEmpty(payload, 'posts'))) return console.log('– posts exist, skipped')
  const posts = [
    {
      de: {
        title: 'Paywand ist jetzt ein eingetragener Verein',
        slug: 'paywand-eingetragener-verein',
        published: true,
        publishedAt: daysFromNow(-40, 10),
        excerpt: 'Nach vielen Monaten Vorbereitung sind wir offiziell: Das Amtsgericht hat Paywand e.V. ins Vereinsregister eingetragen.',
        content: rt(
          'Was 2023 als lose Nachbarschaftsinitiative begann, ist jetzt offiziell: Paywand ist ein eingetragener, gemeinnütziger Verein.',
          'Damit können wir Fördermittel beantragen, Spendenbescheinigungen ausstellen und unsere Angebote auf stabile Füße stellen. Danke an alle, die bis hierher mitgeholfen haben!',
        ),
        image: img.img1,
      },
      en: {
        title: 'Paywand is now a registered association',
        excerpt: 'After months of preparation it is official: the district court has entered Paywand e.V. in the register of associations.',
        content: rt(
          'What began in 2023 as a loose neighbourhood initiative is now official: Paywand is a registered non-profit association.',
          'This allows us to apply for funding, issue donation receipts and put our activities on a stable footing. Thank you to everyone who helped along the way!',
        ),
      },
      ps: { title: 'پیوند اوس یوه ثبت شوې ټولنه ده', excerpt: 'له ډېرو میاشتو چمتووالي وروسته رسمي شو: محکمې پیوند په راجستر کې ثبت کړ.' },
      fa: { title: 'پیوند اکنون یک انجمن ثبت‌شده است', excerpt: 'پس از ماه‌ها آمادگی رسمی شد: محکمه پیوند را در راجستر انجمن‌ها ثبت کرد.' },
    },
    {
      de: {
        title: 'Rückblick: Unser erstes Sommerfest',
        slug: 'rueckblick-sommerfest',
        published: true,
        publishedAt: daysFromNow(-12, 10),
        focusArea: focus[3],
        excerpt: 'Über 120 Gäste, drei Generationen, ein Hof voller Musik – das erste Paywand-Sommerfest war ein voller Erfolg.',
        content: rt(
          'Bei strahlendem Wetter kamen über 120 Nachbarinnen, Nachbarn und Mitglieder zusammen. Es gab Bolani und Kabuli Palau, ein Kinderprogramm und am Abend Rubab-Musik.',
          'Danke an alle Helferinnen und Helfer – und an alle, die etwas zum Buffet beigetragen haben. Das nächste Fest kommt bestimmt.',
        ),
        image: img.img3,
      },
      en: {
        title: 'Looking back: our first summer festival',
        excerpt: 'Over 120 guests, three generations, a courtyard full of music – the first Paywand summer festival was a great success.',
        content: rt(
          'In glorious weather, over 120 neighbours and members came together. There was bolani and Kabuli palau, a children’s programme and rubab music in the evening.',
          'Thanks to all the helpers – and to everyone who contributed to the buffet. The next festival is sure to come.',
        ),
      },
      ps: { title: 'بیاکتنه: زموږ لومړی دوبني جشن', excerpt: 'له ۱۲۰ زیات مېلمانه، درې پښتونه، له موسیقۍ ډک انګړ – لومړی جشن بریالی و.' },
      fa: { title: 'مروری بر نخستین جشن تابستانی ما', excerpt: 'بیش از ۱۲۰ مهمان، سه نسل، حویلی پر از موسیقی – نخستین جشن تابستانی موفق بود.' },
    },
  ]
  for (const p of posts) {
    const doc = await payload.create({ collection: 'posts', locale: 'de', data: p.de as any })
    await translate(payload, 'posts', doc.id, { en: p.en, ps: p.ps, fa: p.fa })
  }
  console.log('✓ 2 posts')
}

async function seedPartners(payload: Payload) {
  if (!(await isEmpty(payload, 'partners'))) return console.log('– partners exist, skipped')
  const partners = [
    { name: 'District office (placeholder)', kind: 'funder', order: 1 },
    { name: 'Sample Foundation Berlin (placeholder)', kind: 'funder', order: 2 },
    { name: 'Neighbourhood house (placeholder)', kind: 'partner', order: 3 },
  ]
  for (const p of partners) await payload.create({ collection: 'partners', data: p as any })
  console.log('✓ 3 partners/funders (placeholders)')
}

async function seedFinance(payload: Payload) {
  if (await isEmpty(payload, 'accounts')) {
    await payload.create({ collection: 'accounts', data: { name: 'Main bank account', type: 'bank', iban: 'DE02 1203 0000 0000 2020 51', openingBalance: 0, openingDate: '2026-01-01T00:00:00.000Z', active: true } as any })
    await payload.create({ collection: 'accounts', data: { name: 'Cash box', type: 'cash', openingBalance: 0, openingDate: '2026-01-01T00:00:00.000Z', active: true } as any })
    console.log('✓ 2 accounts')
  } else console.log('– accounts exist, skipped')

  if (await isEmpty(payload, 'finance-categories')) {
    // name = internal (English); publicLabel = what the public transparency page shows, en + de
    const cats: [string, 'income' | 'expense', string, string?, string?][] = [
      ['Membership fees', 'income', 'ideell', 'Membership fees', 'Mitgliedsbeiträge'],
      ['Donations', 'income', 'ideell', 'Donations', 'Spenden'],
      ['Public grants', 'income', 'ideell', 'Public grants', 'Zuschüsse der öffentlichen Hand'],
      ['Course participation fees', 'income', 'zweckbetrieb', 'Participation fees', 'Teilnahmebeiträge'],
      ['Interest income', 'income', 'vermoegen'],
      ['Room rent', 'expense', 'ideell', 'Rent and room costs', 'Miete und Raumkosten'],
      ['Course instructor fees', 'expense', 'zweckbetrieb', 'Instructor fees', 'Honorare'],
      ['Materials & supplies', 'expense', 'ideell', 'Material costs', 'Sachkosten'],
      ['Event costs', 'expense', 'ideell', 'Events', 'Veranstaltungen'],
      ['Administration, postage & bank fees', 'expense', 'ideell', 'Administrative costs', 'Verwaltungskosten'],
    ]
    for (const [name, type, sphere, publicLabelEn, publicLabelDe] of cats) {
      const doc = await payload.create({ collection: 'finance-categories', data: { name, type, sphere, publicLabel: publicLabelEn } as any })
      if (publicLabelDe) await translate(payload, 'finance-categories', doc.id, { de: { publicLabel: publicLabelDe } })
    }
    console.log('✓ 10 transaction categories')
  } else console.log('– categories exist, skipped')
}

async function seedMembership(payload: Payload) {
  const byName = async (collection: any, name: string): Promise<string | number | null> => {
    const res = await payload.find({ collection, where: { name: { equals: name } }, limit: 1, depth: 0 })
    return (res.docs[0] as any)?.id ?? null
  }

  // Auto-bookkeeping defaults: contributions/donations create linked draft transactions
  const fs: any = await payload.findGlobal({ slug: 'finance-settings' })
  if (!fs?.autoBooking?.defaultAccount) {
    const [account, contribCat, donationCat] = await Promise.all([
      byName('accounts', 'Main bank account'),
      byName('finance-categories', 'Membership fees'),
      byName('finance-categories', 'Donations'),
    ])
    if (account && contribCat && donationCat) {
      await payload.updateGlobal({
        slug: 'finance-settings',
        data: { autoBooking: { defaultAccount: account, contributionCategory: contribCat, donationCategory: donationCat } } as any,
      })
      console.log('✓ auto-booking defaults in finance settings')
    }
  } else console.log('– auto-booking defaults exist, skipped')

  let typeIds: (string | number)[] = []
  if (await isEmpty(payload, 'membership-types')) {
    const types: [string, string, number, number][] = [
      // en, de, fee, order
      ['Full member', 'Ordentliches Mitglied', 10, 1],
      ['Supporting member', 'Fördermitglied', 15, 2],
      ['Reduced fee', 'Ermäßigt (Schüler/innen, Studierende, ohne Einkommen)', 5, 3],
    ]
    for (const [en, de, monthlyFee, order] of types) {
      const doc = await payload.create({ collection: 'membership-types', data: { name: en, monthlyFee, order, active: true } as any })
      await translate(payload, 'membership-types', doc.id, { de: { name: de } })
      typeIds.push(doc.id)
    }
    console.log('✓ 3 membership types')
  } else {
    typeIds = (await payload.find({ collection: 'membership-types', sort: 'order', limit: 10, depth: 0 })).docs.map((d: any) => d.id)
    console.log('– membership types exist, skipped')
  }

  const mc: any = await payload.findGlobal({ slug: 'membership-card' })
  if (mc?.backText && typeof mc.autoSendOnAccept !== 'boolean') {
    // field added later – persist its default
    await payload.updateGlobal({ slug: 'membership-card', data: { autoSendOnAccept: true } as any })
    console.log('✓ auto-send-on-accept enabled')
  }
  if (!mc?.backText) {
    await payload.updateGlobal({
      slug: 'membership-card',
      data: {
        backTitle: 'Our mission',
        backText:
          'Paywand means connection. We bring Afghan families and Berlin neighbours together – through education, youth work, culture and open dialogue.',
        verifyHint: 'Scan the QR code on the front to verify this membership online.',
        footerText: 'paywand-berlin.de · info@paywand-berlin.de',
      } as any,
    })
    await translateGlobal(payload, 'membership-card', {
      de: {
        backTitle: 'Unser Leitbild',
        backText:
          'Paywand heißt Verbindung. Wir bringen afghanische Familien und Berliner Nachbarschaft zusammen – durch Bildung, Jugendarbeit, Kultur und offenen Dialog.',
        verifyHint: 'QR-Code auf der Vorderseite scannen, um die Mitgliedschaft online zu prüfen.',
      },
    })
    console.log('✓ membership card texts')
  } else console.log('– membership card texts exist, skipped')

  if (await isEmpty(payload, 'members')) {
    const year = new Date().getFullYear()
    const joined = `${year}-06-01T12:00:00.000Z`
    const demo: [string, number, number[], number | undefined, string | undefined][] = [
      // name, type index, months already paid (June = 6 …), fee override, demo email
      ['Ahmad Walizada', 0, [6, 7, 8, 9, 10], undefined, 'ahmad@example.org'],
      ['Shabnam Hotak', 0, [6, 7, 8, 9, 10], undefined, undefined],
      ['Zalmai Sherzad', 1, [6, 7, 8, 9, 10], undefined, undefined],
      ['Maryam Qaderi', 2, [6, 7, 8], undefined, 'maryam@example.org'],
      ['Hamid Stanikzai', 0, [6], 12, undefined],
      ['Freshta Mangal', 2, [6], undefined, undefined],
    ]
    let payments = 0
    for (const [name, typeIdx, paidMonths, feeOverride, email] of demo) {
      const member = await payload.create({
        collection: 'members',
        data: { name, membershipType: typeIds[typeIdx], monthlyFee: feeOverride, email, joinedOn: joined, active: true } as any,
      })
      for (const month of paidMonths) {
        await payload.create({
          collection: 'member-contributions',
          data: { member: member.id, year, month: String(month), paidOn: `${year}-${String(month).padStart(2, '0')}-05T12:00:00.000Z`, method: 'transfer' } as any,
        })
        payments++
      }
    }
    console.log(`✓ 6 members, ${payments} contribution payments (+ linked draft transactions)`)
  } else console.log('– members exist, skipped')

  if (await isEmpty(payload, 'event-cards')) {
    const fest = await payload.find({ collection: 'events', where: { slug: { equals: 'nachbarschaftsfest-herbst' } }, limit: 1, depth: 0 })
    const eventId = (fest.docs[0] as any)?.id
    const staff: [string, string, string | undefined][] = [
      ['Omid Safi', 'Organisation', 'omid@example.org'],
      ['Karim Nazari', 'Security', undefined],
      ['Laila Noori', 'Stage management', undefined],
    ]
    for (const [personName, role, email] of staff) {
      await payload.create({
        collection: 'event-cards',
        data: { personName, role, email, event: eventId, validUntil: daysFromNow(22, 23), active: true } as any,
      })
    }
    console.log('✓ 3 event/staff cards (autumn festival)')
  } else console.log('– event cards exist, skipped')

  if (await isEmpty(payload, 'donations')) {
    await payload.create({
      collection: 'donations',
      data: {
        donorName: 'Mustermann GmbH (placeholder)',
        date: '2026-09-12T12:00:00.000Z',
        amount: 500,
        method: 'transfer',
        purpose: "Kids' course",
        receiptRequested: true,
        donorAddress: 'Beispielweg 1, 10115 Berlin',
      } as any,
    })
    await payload.create({
      collection: 'donations',
      data: { donorName: 'Private donor', anonymous: true, date: '2026-10-02T12:00:00.000Z', amount: 80, method: 'paypal' } as any,
    })
    console.log('✓ 2 donations (+ linked draft transactions)')
  } else console.log('– donations exist, skipped')

  if (await isEmpty(payload, 'finance-projects')) {
    const project = await payload.create({
      collection: 'finance-projects',
      data: { name: "Kids' course autumn 2026", code: 'KIDS-26', budget: 500, status: 'active', startDate: '2026-09-01T12:00:00.000Z', endDate: '2026-12-20T12:00:00.000Z', notes: 'Free weekly course; covered by the earmarked donation.' } as any,
    })
    const [account, materials, rent] = await Promise.all([
      byName('accounts', 'Main bank account'),
      byName('finance-categories', 'Materials & supplies'),
      byName('finance-categories', 'Room rent'),
    ])
    if (account && materials && rent) {
      const expenses: [string, number, string | number, string][] = [
        ['Craft store Berlin', 45.9, materials, 'Markers, boards and stationery for the kids’ course'],
        ['Community hall e.V.', 150, rent, 'Room rent kids’ course September–October'],
      ]
      for (const [counterparty, amount, category, description] of expenses) {
        await payload.create({
          collection: 'transactions',
          data: { date: '2026-10-01T12:00:00.000Z', type: 'expense', amount, account, category, project: project.id, counterparty, description, status: 'draft' } as any,
        })
      }
      console.log("✓ demo project (Kids' course) with 2 draft expenses")
    }
  } else console.log('– projects exist, skipped')
}

/* ---------- Ablauf ---------- */

async function run() {
  const payload = await getPayload({ config })
  console.log('Seeding …')
  await seedRoles(payload)
  const img = await seedMedia(payload)
  await seedGlobals(payload, img)
  await seedBoard(payload)
  const focus = await seedFocusAreas(payload, img)
  await seedEvents(payload, focus, img)
  await seedPosts(payload, focus, img)
  await seedPartners(payload)
  await seedFinance(payload)
  await seedMembership(payload)
  console.log('Done. Create the first user at /admin (becomes super-admin automatically).')
  process.exit(0)
}

// Top-Level-Await ist Pflicht: `payload run` beendet den Prozess nach der Modul-Auswertung
// und wartet nicht auf schwebende Promises.
await run().catch((err) => {
  console.error(err)
  process.exit(1)
})
