import { notFound } from 'next/navigation'
import { submitMembership } from '@/app/(frontend)/actions'
import { SiteForm } from '@/components/site/Forms'
import { PageHead } from '@/components/site/Sections'
import { getDict, isLocale } from '@/i18n'
import { getClient, getSiteData } from '@/lib/payload'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { title: isLocale(locale) ? getDict(locale).join.title : '' }
}

export default async function Join({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = getDict(locale)
  const { settings } = await getSiteData(locale)
  const payload = await getClient()
  const types = (
    await payload.find({ collection: 'membership-types', where: { active: { equals: true } }, sort: 'order', locale, limit: 20, depth: 0 })
  ).docs as any[]
  return (
    <>
      <PageHead title={t.join.title} lead={t.home.joinText} />
      <section className="section" id="mitglied">
        <div className="wrap two-col">
          <div>
            <h2>{t.join.memberTitle}</h2>
            <p className="measure">{t.join.memberText}</p>
            <h2 style={{ marginTop: '2.5rem' }}>{t.join.volunteerTitle}</h2>
            <p className="measure">{t.join.volunteerText}</p>
          </div>
          <SiteForm
            action={submitMembership}
            fields={[
              { name: 'name', label: t.form.name, required: true },
              { name: 'email', label: t.form.email, type: 'email', required: true },
              { name: 'phone', label: t.form.phone, type: 'tel', required: true },
              ...(types.length
                ? [
                    {
                      name: 'membershipType',
                      label: t.form.type,
                      type: 'select' as const,
                      options: types.map((mt) => ({ value: String(mt.id), label: mt.name })),
                    },
                  ]
                : []),
              { name: 'street', label: t.form.street, wide: true, autoComplete: 'street-address', required: true },
              { name: 'postalCode', label: t.form.postalCode, autoComplete: 'postal-code', dir: 'ltr', required: true },
              { name: 'city', label: t.form.city, autoComplete: 'address-level2', required: true },
              { name: 'message', label: t.form.message, type: 'textarea', required: true },
            ]}
            submitLabel={t.cta.apply}
            sendingLabel={t.form.sending}
            successText={t.form.success}
            errorText={t.form.error}
            consentText={t.form.consent}
            privacyHref={`/${locale}/datenschutz`}
            privacyLabel={t.footer.privacy}
            requiredLabel={t.form.required}
            phoneInvalidText={t.form.phoneInvalid}
            postalInvalidText={t.form.postalCodeInvalid}
          />
        </div>
      </section>
      <section className="section section-white" id="spenden">
        <div className="wrap two-col">
          <div>
            <h2>{t.join.donateTitle}</h2>
            <p className="measure">{settings?.donationNote || t.join.donateText}</p>
            {settings?.paypalUrl ? (
              <a className="btn btn-accent" href={settings.paypalUrl} rel="noopener noreferrer" target="_blank">
                {t.cta.donate}
              </a>
            ) : null}
          </div>
          {settings?.iban ? (
            <div className="bank">
              <dl>
                <dt>{t.join.bank.holder}</dt>
                <dd>{settings.accountHolder}</dd>
                <dt>{t.join.bank.iban}</dt>
                <dd dir="ltr">{settings.iban}</dd>
                {settings.bic ? (<><dt>{t.join.bank.bic}</dt><dd dir="ltr">{settings.bic}</dd></>) : null}
                {settings.bank ? (<><dt>{t.join.bank.bank}</dt><dd>{settings.bank}</dd></>) : null}
              </dl>
            </div>
          ) : null}
        </div>
      </section>
    </>
  )
}
