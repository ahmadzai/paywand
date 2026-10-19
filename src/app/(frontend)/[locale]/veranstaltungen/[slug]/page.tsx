import { notFound } from 'next/navigation'
import { submitRegistration } from '@/app/(frontend)/actions'
import { SiteForm } from '@/components/site/Forms'
import { RichText } from '@/components/site/RichText'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale, LOCALE_META } from '@/i18n'
import { fmtDate, fmtTime } from '@/lib/format'
import { getClient, mediaUrl } from '@/lib/payload'

type P = { params: Promise<{ locale: string; slug: string }> }

async function load(locale: any, slug: string) {
  const payload = await getClient()
  const res = await payload.find({ collection: 'events', locale, where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] as any
}

export async function generateMetadata({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const e = await load(locale, slug)
  return e ? { title: e.title, description: e.summary } : {}
}

export default async function EventPage({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const e = await load(locale, slug)
  if (!e) notFound()

  let spotsLeft: number | null = null
  if (e.capacity) {
    const payload = await getClient()
    const regs = await payload.find({ collection: 'event-registrations', where: { event: { equals: e.id } }, limit: 1000, depth: 0, overrideAccess: true, select: { participants: true } })
    const taken = regs.docs.reduce((s: number, r: any) => s + (r.participants || 1), 0)
    spotsLeft = Math.max(e.capacity - taken, 0)
  }
  const isPast = new Date(e.endsAt || e.startsAt) < new Date()
  const img = mediaUrl(e.image, 'hero')
  const langs = (e.languages || []).map((l: string) => LOCALE_META[l as keyof typeof LOCALE_META]?.label || l).join(', ')

  return (
    <>
      <PageHead title={e.title} lead={e.summary} crumb={{ href: `/${locale}/veranstaltungen`, label: t.events.title }} />
      <section className="section">
        <div className="wrap detail-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img ? <img className="detail-image" src={img} alt={e.image?.alt || ''} /> : null}
            <RichText data={e.description} />
            {e.registrationEnabled && !isPast ? (
              <div id="anmeldung" style={{ marginTop: '3rem' }}>
                <h2>{t.events.registerTitle}</h2>
                {spotsLeft === 0 ? (
                  <p className="form-error">{t.events.full}</p>
                ) : (
                  <SiteForm
                    action={submitRegistration}
                    hidden={{ event: String(e.id) }}
                    fields={[
                      { name: 'name', label: t.form.name, required: true },
                      { name: 'participants', label: t.form.participants, type: 'number' },
                      { name: 'email', label: t.form.email, type: 'email' },
                      { name: 'phone', label: t.form.phone, type: 'tel' },
                      { name: 'message', label: t.form.message, type: 'textarea' },
                    ]}
                    submitLabel={t.cta.register}
                    sendingLabel={t.form.sending}
                    successText={t.form.success}
                    errorText={t.form.error}
                    consentText={t.form.consent}
                    privacyHref={`/${locale}/datenschutz`}
                    privacyLabel={t.footer.privacy}
                    requiredLabel={t.form.required}
                    phoneInvalidText={t.form.phoneInvalid}
                  />
                )}
              </div>
            ) : null}
          </div>
          <aside className="aside-box">
            <dl>
              <dt>{t.events.when}</dt>
              <dd>
                {fmtDate(e.startsAt, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <br />
                {fmtTime(e.startsAt, locale)}
                {e.endsAt ? ` – ${fmtTime(e.endsAt, locale)}` : ''}
              </dd>
              {e.location ? (
                <>
                  <dt>{t.events.where}</dt>
                  <dd>
                    {e.location}
                    {e.address ? (
                      <>
                        <br />
                        <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(e.address)}`} rel="noopener noreferrer" target="_blank">
                          {e.address}
                        </a>
                      </>
                    ) : null}
                  </dd>
                </>
              ) : null}
              {langs ? (
                <>
                  <dt>{t.events.languages}</dt>
                  <dd>{langs}</dd>
                </>
              ) : null}
              {e.price ? (
                <>
                  <dt>{t.events.cost}</dt>
                  <dd>{e.price}</dd>
                </>
              ) : null}
              {spotsLeft !== null && !isPast ? (
                <>
                  <dt>{t.events.registerTitle}</dt>
                  <dd>
                    {spotsLeft} {t.events.spotsLeft}
                  </dd>
                </>
              ) : null}
            </dl>
            {e.registrationEnabled && !isPast && spotsLeft !== 0 ? (
              <a className="btn btn-primary" href="#anmeldung">
                {t.cta.register}
              </a>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  )
}
