import { LOCALE_META, type Locale } from '@/i18n'

export function fmtDate(value: string | Date | null | undefined, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat(LOCALE_META[locale].dateLocale, { timeZone: 'Europe/Berlin', ...opts }).format(new Date(value))
  } catch {
    return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', ...opts }).format(new Date(value))
  }
}

export function fmtTime(value: string | null | undefined, locale: Locale) {
  return fmtDate(value, locale, { hour: '2-digit', minute: '2-digit' })
}

export const fmtEUR = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n || 0)

export function dateParts(value: string, locale: Locale) {
  const d = new Date(value)
  return {
    day: fmtDate(d, locale, { day: 'numeric' }),
    month: fmtDate(d, locale, { month: 'short' }),
    weekday: fmtDate(d, locale, { weekday: 'long' }),
  }
}
