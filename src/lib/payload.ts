import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'
import type { Locale } from '@/i18n'

export const getClient = cache(async () => getPayload({ config }))

/** Loads the globals every page needs, once per request. */
export const getSiteData = cache(async (locale: Locale) => {
  const payload = await getClient()
  const [settings, verein] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', locale, depth: 1 }),
    payload.findGlobal({ slug: 'vereinsdaten', locale, depth: 1 }),
  ])
  return { settings: settings as any, verein: verein as any }
})

export function mediaUrl(media: any, size?: 'thumb' | 'card' | 'hero'): string | null {
  if (!media || typeof media !== 'object') return null
  if (size && media.sizes?.[size]?.url) return media.sizes[size].url
  return media.url ?? null
}
