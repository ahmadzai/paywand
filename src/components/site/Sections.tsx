import Link from 'next/link'
import React from 'react'
import { getDict, type Locale } from '@/i18n'
import { dateParts, fmtDate, fmtTime } from '@/lib/format'
import { mediaUrl } from '@/lib/payload'
import { FocusIcon } from './Brand'

export function FocusList({ items, locale }: { items: any[]; locale: Locale }) {
  return (
    <ul className="focus-list">
      {items.map((f) => (
        <li key={f.id} className="focus-item">
          <Link href={`/${locale}/angebote/${f.slug}`}>
            <h3>
              <span className="focus-icon">
                <FocusIcon name={f.icon} size={22} />
              </span>
              {f.title}
            </h3>
            <p>{f.summary}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function EventList({ items, locale }: { items: any[]; locale: Locale }) {
  const t = getDict(locale)
  if (!items.length) return <p className="empty">{t.events.none}</p>
  return (
    <ul className="event-list">
      {items.map((e) => {
        const d = dateParts(e.startsAt, locale)
        return (
          <li key={e.id} className="event-row">
            <div className="event-date" aria-hidden="true">
              <span className="day">{d.day}</span>
              <span className="month">{d.month}</span>
            </div>
            <div>
              <h3>
                <Link href={`/${locale}/veranstaltungen/${e.slug}`}>{e.title}</Link>
              </h3>
              <p className="event-meta">
                <time dateTime={e.startsAt}>
                  {d.weekday}, {fmtDate(e.startsAt, locale)}, {fmtTime(e.startsAt, locale)}
                </time>
                {e.location ? <> – {e.location}</> : null}
              </p>
              {e.registrationEnabled ? <span className="tag">{t.events.registerTitle}</span> : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function NewsGrid({ items, locale }: { items: any[]; locale: Locale }) {
  const t = getDict(locale)
  if (!items.length) return <p className="empty">{t.news.none}</p>
  return (
    <div className="news-grid">
      {items.map((p) => {
        const img = mediaUrl(p.image, 'card')
        return (
          <article key={p.id} className="news-item">
            <Link href={`/${locale}/aktuelles/${p.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img ? <img src={img} alt={p.image?.alt || ''} loading="lazy" /> : null}
              <time dateTime={p.publishedAt}>{fmtDate(p.publishedAt, locale)}</time>
              <h3>{p.title}</h3>
              {p.excerpt ? <p>{p.excerpt}</p> : null}
            </Link>
          </article>
        )
      })}
    </div>
  )
}

export function PageHead({ title, lead, crumb }: { title: string; lead?: string | null; crumb?: { href: string; label: string } }) {
  return (
    <section className="page-head">
      <div className="wrap">
        {crumb ? (
          <Link className="crumb" href={crumb.href}>
            {crumb.label}
          </Link>
        ) : null}
        <h1>{title}</h1>
        {lead ? <p>{lead}</p> : null}
      </div>
    </section>
  )
}
