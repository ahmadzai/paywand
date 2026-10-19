import { notFound } from 'next/navigation'
import { submitContact } from '@/app/(frontend)/actions'
import { SiteForm } from '@/components/site/Forms'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getSiteData } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).contact.title : '' }
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const { settings } = await getSiteData(locale)
  return (
    <>
      <PageHead title={t.contact.title} />
      <section className="section">
        <div className="wrap two-col">
          <div>
            <h2>{t.contact.address}</h2>
            <address className="measure">
              {settings?.street}<br />
              {settings?.postalCode} {settings?.city}
              <br /><br />
              {settings?.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : null}
              {settings?.phone ? (<><br /><a href={`tel:${settings.phone.replace(/\s/g, '')}`} dir="ltr">{settings.phone}</a></>) : null}
            </address>
            {settings?.officeHours ? (
              <>
                <h2 style={{ marginTop: '2rem' }}>{t.contact.hours}</h2>
                <p style={{ whiteSpace: 'pre-line' }}>{settings.officeHours}</p>
              </>
            ) : null}
          </div>
          <div>
            <h2>{t.contact.write}</h2>
            <SiteForm
              action={submitContact}
              fields={[
                { name: 'name', label: t.form.name, required: true },
                { name: 'email', label: t.form.email, type: 'email', required: true },
                { name: 'subject', label: t.form.subject, required: true, wide: true },
                { name: 'message', label: t.form.message, type: 'textarea', required: true },
              ]}
              submitLabel={t.cta.send}
              sendingLabel={t.form.sending}
              successText={t.form.success}
              errorText={t.form.error}
              consentText={t.form.consent}
              privacyHref={`/${locale}/datenschutz`}
              privacyLabel={t.footer.privacy}
              requiredLabel={t.form.required}
            />
          </div>
        </div>
      </section>
    </>
  )
}
