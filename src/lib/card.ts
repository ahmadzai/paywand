import { PDFDocument } from 'pdf-lib'
import type { Payload } from 'payload'
import QRCode from 'qrcode'
import sharp from 'sharp'

/* Credit-card format (CR80), rendered at ~300 dpi.
   Portrait (ID-badge style, default) reads naturally on phones and badge holders;
   landscape is the classic credit-card look. Admin-selectable in the card settings. */
const P = { W: 638, H: 1012 } // 54 × 85.6 mm portrait
const L = { W: 1012, H: 638 } // 85.6 × 54 mm landscape

export const CARD_STRINGS = {
  en: {
    membershipCard: 'MEMBERSHIP CARD',
    eventCard: 'EVENT STAFF CARD',
    memberSince: 'Member since',
    validUntil: 'Valid until',
    staffCard: 'Event staff card',
    verifyMembership: 'Verify membership',
    verifyCard: 'Verify card',
    dateLocale: 'en-GB',
  },
  de: {
    membershipCard: 'MITGLIEDSAUSWEIS',
    eventCard: 'EVENT-TEAMAUSWEIS',
    memberSince: 'Mitglied seit',
    validUntil: 'Gültig bis',
    staffCard: 'Team-Ausweis',
    verifyMembership: 'Mitgliedschaft prüfen',
    verifyCard: 'Ausweis prüfen',
    dateLocale: 'de-DE',
  },
} as const
export type CardLang = keyof typeof CARD_STRINGS

const C = {
  lapis: '#23408E',
  lapisDeep: '#16254F',
  saffron: '#E2A72E',
  pomegranate: '#B0283F',
  ink: '#171A2B',
  soft: '#4A4F66',
  line: '#D9DEEB',
  paper: '#FFFFFF',
}

const FONT_SANS = "'Instrument Sans', 'DejaVu Sans', sans-serif"
const FONT_SERIF = "'Literata', Georgia, serif"
const FONT_ARABIC = "'Noto Naskh Arabic', sans-serif"

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Naive word wrap for SVG text (monospace-ish estimate works fine for short card texts). */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = (line + ' ' + word).trim()
    }
    if (lines.length === maxLines) break
  }
  if (line && lines.length < maxLines) lines.push(line)
  if (words.join(' ').length > lines.join(' ').length && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\.?$/, ' …')
  }
  return lines
}

/** The interlaced Paywand rings as plain SVG (fixed ids are fine – one logo per SVG). */
function rings(x: number, y: number, size: number): string {
  const s = size / 112
  return `
  <g transform="translate(${x} ${y}) scale(${s})">
    <defs>
      <clipPath id="over"><circle cx="56" cy="27" r="11"/></clipPath>
      <clipPath id="under"><circle cx="56" cy="73" r="11"/></clipPath>
    </defs>
    <circle cx="40" cy="50" r="28" fill="none" stroke="${C.lapis}" stroke-width="11"/>
    <circle cx="72" cy="50" r="28" fill="none" stroke="${C.saffron}" stroke-width="11"/>
    <g clip-path="url(#over)">
      <circle cx="40" cy="50" r="28" fill="none" stroke="${C.paper}" stroke-width="15"/>
      <circle cx="40" cy="50" r="28" fill="none" stroke="${C.lapis}" stroke-width="11"/>
    </g>
    <g clip-path="url(#under)">
      <circle cx="72" cy="50" r="28" fill="none" stroke="${C.paper}" stroke-width="15"/>
      <circle cx="72" cy="50" r="28" fill="none" stroke="${C.saffron}" stroke-width="11"/>
    </g>
    <path d="M56 40 L59.2 46.8 L66 50 L59.2 53.2 L56 60 L52.8 53.2 L46 50 L52.8 46.8 Z" fill="${C.pomegranate}"/>
  </g>`
}

/** Kilim-inspired accent strip. */
function kilim(x: number, y: number, width: number, h = 8): string {
  const a = Math.round(width * 0.62)
  const b = Math.round(width * 0.86)
  return `
  <g>
    <rect x="${x}" y="${y}" width="${a}" height="${h}" rx="${h / 2}" fill="${C.lapis}"/>
    <rect x="${x + a + 6}" y="${y}" width="${b - a - 6}" height="${h}" rx="${h / 2}" fill="${C.saffron}"/>
    <rect x="${x + b + 6}" y="${y}" width="${width - b - 6}" height="${h}" rx="${h / 2}" fill="${C.pomegranate}"/>
  </g>`
}

export type CardData = {
  kind: 'member' | 'event'
  name: string
  /** Membership type – or the role on an event card (Security, Stage management …) */
  label: string
  /** Member number – or the event name */
  meta: string
  /** "Member since Jun 2026" – or "Valid until 21 Nov 2026" */
  sinceLine: string
  /** 'MEMBERSHIP CARD' | 'EVENT STAFF CARD' (already localized) */
  subtitle: string
  /** Caption under the QR code (already localized) */
  verifyLabel: string
  orientation: 'portrait' | 'landscape'
  lang: CardLang
  accent?: string
  verifyUrl: string
  verein: { officialName: string; addressLines: string[] }
  back: { title: string; text: string; verifyHint: string; footerText: string }
}

function frontSvgPortrait(d: CardData, qr: string): string {
  const { W, H } = P
  const cx = W / 2
  const qrSize = 226
  const qrX = (W - qrSize) / 2
  const qrY = 566
  const qrEmbedded = qr.replace('<svg ', `<svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" `)
  // long names get a smaller size so they stay on one centred line
  const nameSize = d.name.length <= 14 ? 46 : d.name.length <= 20 ? 40 : d.name.length <= 26 ? 33 : 27
  const address = d.verein.addressLines
    .map((l, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : 26}">${esc(l)}</tspan>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/>
  ${rings(cx - 54, 46, 108)}
  <text x="${cx}" y="204" text-anchor="middle" font-family="${FONT_SERIF}" font-size="42" font-weight="650" fill="${C.ink}">Paywand <tspan fill="${C.soft}" font-weight="400">e.V.</tspan></text>
  <text x="${cx}" y="252" text-anchor="middle" font-family="${FONT_ARABIC}" font-size="34" fill="${C.lapis}">پیوند</text>
  <text x="${cx}" y="296" text-anchor="middle" font-family="${FONT_SANS}" font-size="18" letter-spacing="5" fill="${C.soft}">${esc(d.subtitle)}</text>
  <line x1="70" y1="326" x2="${W - 70}" y2="326" stroke="${C.line}" stroke-width="2"/>
  <text x="${cx}" y="398" text-anchor="middle" font-family="${FONT_SERIF}" font-size="${nameSize}" font-weight="600" fill="${C.ink}">${esc(d.name)}</text>
  <text x="${cx}" y="444" text-anchor="middle" font-family="${FONT_SANS}" font-size="26" fill="${d.accent || C.lapis}" font-weight="600">${esc(d.label)}</text>
  <text x="${cx}" y="480" text-anchor="middle" font-family="${FONT_SANS}" font-size="22" fill="${C.soft}">${esc(d.meta)}</text>
  <text x="${cx}" y="514" text-anchor="middle" font-family="${FONT_SANS}" font-size="21" fill="${C.soft}">${esc(d.sinceLine)}</text>
  <rect x="${qrX - 12}" y="${qrY - 12}" width="${qrSize + 24}" height="${qrSize + 24}" rx="14" fill="#fff" stroke="${C.line}" stroke-width="2"/>
  ${qrEmbedded}
  <text x="${cx}" y="${qrY + qrSize + 44}" text-anchor="middle" font-family="${FONT_SANS}" font-size="17" fill="${C.soft}">${esc(d.verifyLabel)}</text>
  <text x="${cx}" y="${H - 72}" text-anchor="middle" font-family="${FONT_SANS}" font-size="18" fill="${C.soft}">${address}</text>
  ${kilim(70, H - 36, W - 140)}
</svg>`
}

function backSvgPortrait(d: CardData): string {
  const { W, H } = P
  const lines = wrap(d.back.text, 34, 11)
    .map((l, i) => `<tspan x="64" dy="${i === 0 ? 0 : 36}">${esc(l)}</tspan>`)
    .join('')
  const hintLines = wrap(d.back.verifyHint, 44, 2)
    .map((l, i) => `<tspan x="64" dy="${i === 0 ? 0 : 26}">${esc(l)}</tspan>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.lapisDeep}" stroke="${C.lapisDeep}"/>
  ${kilim(64, 60, 140, 8)}
  <text x="64" y="150" font-family="${FONT_SERIF}" font-size="38" font-weight="600" fill="${C.saffron}">${esc(d.back.title)}</text>
  <text x="64" y="212" font-family="${FONT_SANS}" font-size="25" fill="#E9EDF8">${lines}</text>
  <text x="64" y="${H - 184}" font-family="${FONT_SANS}" font-size="19" fill="#AEB9DC">${hintLines}</text>
  <line x1="64" y1="${H - 122}" x2="${W - 64}" y2="${H - 122}" stroke="#2C3E73" stroke-width="2"/>
  <text x="64" y="${H - 80}" font-family="${FONT_SANS}" font-size="19" fill="#AEB9DC">Paywand e.V.</text>
  <text x="64" y="${H - 48}" font-family="${FONT_SANS}" font-size="19" fill="#AEB9DC">${esc(d.back.footerText)}</text>
</svg>`
}

function frontSvgLandscape(d: CardData, qr: string): string {
  const { W, H } = L
  const qrSize = 176
  const qrX = W - 56 - qrSize
  const qrY = H - 92 - qrSize
  const qrEmbedded = qr.replace('<svg ', `<svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" `)
  const nameSize = d.name.length <= 20 ? 54 : d.name.length <= 28 ? 44 : 36
  const address = d.verein.addressLines
    .map((l, i) => `<tspan x="56" dy="${i === 0 ? 0 : 26}">${esc(l)}</tspan>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/>
  ${rings(50, 44, 92)}
  <text x="166" y="92" font-family="${FONT_SERIF}" font-size="46" font-weight="650" fill="${C.ink}">Paywand <tspan fill="${C.soft}" font-weight="400">e.V.</tspan></text>
  <text x="166" y="128" font-family="${FONT_SANS}" font-size="21" letter-spacing="5" fill="${C.soft}">${esc(d.subtitle)}</text>
  <text x="${W - 56}" y="100" text-anchor="end" font-family="${FONT_ARABIC}" font-size="52" fill="${C.lapis}">پیوند</text>
  <line x1="56" y1="172" x2="${W - 56}" y2="172" stroke="${C.line}" stroke-width="2"/>
  <text x="56" y="268" font-family="${FONT_SERIF}" font-size="${nameSize}" font-weight="600" fill="${C.ink}">${esc(d.name)}</text>
  <text x="56" y="316" font-family="${FONT_SANS}" font-size="27" fill="${d.accent || C.lapis}" font-weight="600">${esc(d.label)}<tspan fill="${C.soft}" font-weight="400" dx="12">·</tspan><tspan fill="${C.soft}" font-weight="400" dx="12">${esc(d.meta)}</tspan></text>
  <text x="56" y="356" font-family="${FONT_SANS}" font-size="24" fill="${C.soft}">${esc(d.sinceLine)}</text>
  <text x="56" y="${H - 148}" font-family="${FONT_SANS}" font-size="21" fill="${C.soft}">${address}</text>
  <rect x="${qrX - 10}" y="${qrY - 10}" width="${qrSize + 20}" height="${qrSize + 20}" rx="12" fill="#fff" stroke="${C.line}" stroke-width="2"/>
  ${qrEmbedded}
  <text x="${qrX + qrSize / 2}" y="${H - 56}" text-anchor="middle" font-family="${FONT_SANS}" font-size="17" fill="${C.soft}">${esc(d.verifyLabel)}</text>
  ${kilim(56, H - 36, W - 112)}
</svg>`
}

function backSvgLandscape(d: CardData): string {
  const { W, H } = L
  const lines = wrap(d.back.text, 58, 6)
    .map((l, i) => `<tspan x="56" dy="${i === 0 ? 0 : 38}">${esc(l)}</tspan>`)
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.lapisDeep}" stroke="${C.lapisDeep}"/>
  ${kilim(56, 52, 150, 8)}
  <text x="56" y="128" font-family="${FONT_SERIF}" font-size="40" font-weight="600" fill="${C.saffron}">${esc(d.back.title)}</text>
  <text x="56" y="186" font-family="${FONT_SANS}" font-size="27" fill="#E9EDF8">${lines}</text>
  <text x="56" y="${H - 108}" font-family="${FONT_SANS}" font-size="20" fill="#AEB9DC">${esc(d.back.verifyHint)}</text>
  <line x1="56" y1="${H - 84}" x2="${W - 56}" y2="${H - 84}" stroke="#2C3E73" stroke-width="2"/>
  <text x="56" y="${H - 48}" font-family="${FONT_SANS}" font-size="20" fill="#AEB9DC">Paywand e.V.</text>
  <text x="${W - 56}" y="${H - 48}" text-anchor="end" font-family="${FONT_SANS}" font-size="20" fill="#AEB9DC">${esc(d.back.footerText)}</text>
</svg>`
}

export async function renderCardPngs(d: CardData): Promise<{ front: Buffer; back: Buffer }> {
  const qr = await QRCode.toString(d.verifyUrl, { type: 'svg', margin: 0, color: { dark: C.lapisDeep, light: '#ffffff' } })
  const toPng = (svg: string) => sharp(Buffer.from(svg), { density: 144 }).png().toBuffer()
  const landscape = d.orientation === 'landscape'
  return {
    front: await toPng(landscape ? frontSvgLandscape(d, qr) : frontSvgPortrait(d, qr)),
    back: await toPng(landscape ? backSvgLandscape(d) : backSvgPortrait(d)),
  }
}

export async function renderCardPdf(d: CardData): Promise<Buffer> {
  const { front, back } = await renderCardPngs(d)
  const pdf = await PDFDocument.create()
  // CR80 in PDF points (54 × 85.6 mm)
  const pw = d.orientation === 'landscape' ? 242.65 : 153.07
  const ph = d.orientation === 'landscape' ? 153.07 : 242.65
  for (const png of [front, back]) {
    const img = await pdf.embedPng(png)
    const page = pdf.addPage([pw, ph])
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph })
  }
  pdf.setTitle('Paywand e.V. membership card')
  return Buffer.from(await pdf.save())
}

const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

/** Orientation, language and (localized) back texts from the card settings global. */
async function loadCardConfig(payload: Payload, req?: any) {
  const base: any = await payload.findGlobal({ slug: 'membership-card', depth: 0, req })
  const lang: CardLang = base?.cardLanguage === 'de' ? 'de' : 'en'
  const orientation: 'portrait' | 'landscape' = base?.orientation === 'landscape' ? 'landscape' : 'portrait'
  const texts: any = lang === 'en' ? base : await payload.findGlobal({ slug: 'membership-card', depth: 0, locale: lang, req })
  return { lang, orientation, texts, S: CARD_STRINGS[lang] }
}

const defaultBack = (texts: any, S: (typeof CARD_STRINGS)[CardLang]) => ({
  title: texts?.backTitle || 'Our mission',
  text: texts?.backText || '',
  verifyHint: texts?.verifyHint || (S.dateLocale === 'de-DE' ? 'QR-Code scannen, um diesen Ausweis online zu prüfen.' : 'Scan the QR code to verify this card online.'),
  footerText: texts?.footerText || '',
})

/** Collects everything the card needs for one member. */
export async function loadCardData(payload: Payload, memberId: string | number, req?: any): Promise<{ member: any; data: CardData } | null> {
  const member: any = await payload.findByID({ collection: 'members', id: memberId, depth: 1, overrideAccess: true, req }).catch(() => null)
  if (!member) return null
  const [settings, verein, cfg]: any[] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0, req }),
    payload.findGlobal({ slug: 'vereinsdaten', depth: 0, req }),
    loadCardConfig(payload, req),
  ])
  const { lang, orientation, texts, S } = cfg
  // fetch the type in the card language (the name is a localized field)
  const type: any = member.membershipType
    ? await payload.findByID({ collection: 'membership-types', id: idOf(member.membershipType), overrideAccess: true, locale: lang, req }).catch(() => null)
    : null
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const since = member.joinedOn
    ? new Intl.DateTimeFormat(S.dateLocale, { month: 'short', year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date(member.joinedOn))
    : new Intl.DateTimeFormat(S.dateLocale, { year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date(member.createdAt))
  const addressLines = [[settings?.street, [settings?.postalCode, settings?.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ')].filter(Boolean) as string[]
  return {
    member,
    data: {
      kind: 'member' as const,
      name: member.name,
      label: type?.name || (lang === 'de' ? 'Mitglied' : 'Member'),
      meta: member.memberNumber || '',
      sinceLine: `${S.memberSince} ${since}`,
      subtitle: S.membershipCard,
      verifyLabel: S.verifyMembership,
      orientation,
      lang,
      verifyUrl: `${serverUrl}/verify/${member.cardToken}`,
      verein: { officialName: verein?.officialName || 'Paywand e.V.', addressLines },
      back: defaultBack(texts, S),
    },
  }
}

/** Collects everything an EVENT/staff card needs. */
export async function loadEventCardData(payload: Payload, cardId: string | number, req?: any): Promise<{ card: any; data: CardData } | null> {
  const card: any = await payload.findByID({ collection: 'event-cards', id: cardId, depth: 1, overrideAccess: true, req }).catch(() => null)
  if (!card) return null
  const [settings, verein, cfg]: any[] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 0, req }),
    payload.findGlobal({ slug: 'vereinsdaten', depth: 0, req }),
    loadCardConfig(payload, req),
  ])
  const { lang, orientation, texts, S } = cfg
  // event titles are localized – fetch in the card language when a website event is linked
  let eventName = card.eventLabel || ''
  if (!eventName && card.event) {
    const ev: any = await payload.findByID({ collection: 'events', id: idOf(card.event), depth: 0, overrideAccess: true, locale: lang, req }).catch(() => null)
    eventName = ev?.title || card.event?.title || 'Paywand event'
  }
  if (!eventName) eventName = 'Paywand event'
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const sinceLine = card.validUntil
    ? `${S.validUntil} ${new Intl.DateTimeFormat(S.dateLocale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Berlin' }).format(new Date(card.validUntil))}`
    : S.staffCard
  const addressLines = [[settings?.street, [settings?.postalCode, settings?.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ')].filter(Boolean) as string[]
  return {
    card,
    data: {
      kind: 'event' as const,
      name: card.personName,
      label: card.role,
      meta: eventName,
      sinceLine,
      subtitle: S.eventCard,
      verifyLabel: S.verifyCard,
      orientation,
      lang,
      accent: '#B0283F',
      verifyUrl: `${serverUrl}/verify/${card.cardToken}`,
      verein: { officialName: verein?.officialName || 'Paywand e.V.', addressLines },
      back: defaultBack(texts, S),
    },
  }
}
