import { headers as nextHeaders } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { PayloadRequest } from 'payload'
import { getPermissions } from '@/access/permissions'
import { getClient } from '@/lib/payload'

export const metadata = { title: 'Admin guide' }

export default async function AdminGuide() {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user) redirect('/admin/login?redirect=%2Fintern%2Fguide')
  const perms = await getPermissions({ user, payload, context: {} } as unknown as PayloadRequest)
  const isFinance = perms.financeView || perms.financeEntry || perms.financeApprove || perms.financeAdmin

  return (
    <article className="guide">
      <h1>Admin guide</h1>
      <p className="guide-lead">
        How to run the Paywand website and member administration. Everything here happens in the <a href="/admin">admin panel</a>; what you can see and change
        depends on the roles assigned to your user account.
        {isFinance ? (
          <>
            {' '}
            For bookkeeping, contributions and donations see the separate <Link href="/intern/guide/finance">Finance guide</Link>.
          </>
        ) : null}
      </p>

      <nav className="guide-toc" aria-label="Contents">
        <a href="#roles">Roles</a>
        <a href="#content">Website content</a>
        <a href="#languages">Languages</a>
        <a href="#settings">Settings &amp; legal</a>
        <a href="#inbox">Inbox &amp; applications</a>
        <a href="#members">Members &amp; cards</a>
      </nav>

      <h2 id="roles">1. Roles and access</h2>
      <p>
        Access is role-based. A user can hold several roles; their rights add up. The default roles (editable under{' '}
        <a href="/admin/collections/roles">System → Roles</a>):
      </p>
      <ul>
        <li><strong>Administrator</strong> – website, users and association data (no finances).</li>
        <li><strong>Editorial</strong> – website content (programmes, events, news, media) and membership cards.</li>
        <li><strong>Treasurer / Board / Cash auditor / Project lead</strong> – finance roles, see the Finance guide.</li>
      </ul>
      <p>
        New users are created under <a href="/admin/collections/users">System → Users</a>. Only super-admins can grant the super-admin flag.
      </p>

      <h2 id="content">2. Website content</h2>
      <p>Everything under the <em>Website</em> group appears on the public site:</p>
      <ul>
        <li>
          <strong><a href="/admin/collections/focus-areas">Offerings &amp; focus areas</a></strong> – the five programme pages (counselling, education, youth,
          culture, dialogue). Each has a summary, bullet points, a long text and a “how to take part” box.
        </li>
        <li>
          <strong><a href="/admin/collections/events">Events</a></strong> – appear on the events page and the homepage. Tick <em>Enable online registration</em>{' '}
          and set a capacity to collect sign-ups; visitors see the remaining places.
        </li>
        <li>
          <strong><a href="/admin/collections/posts">News</a></strong> – blog posts. A post is only public once <em>Published</em> is ticked.
        </li>
        <li>
          <strong><a href="/admin/collections/partners">Partners &amp; funders</a></strong> – the logo/name list at the bottom of the homepage.
        </li>
        <li>
          <strong><a href="/admin/collections/media">Images &amp; media</a></strong> – upload photos here, then select them on pages. <strong>Only upload photos
          with consent</strong> of the people shown (for minors: parental consent) and tick the consent box.
        </li>
        <li>
          <strong><a href="/admin/collections/documents">Documents &amp; downloads</a></strong> – PDFs such as the statutes (Satzung) or the activity report;
          they are linked from the About and Transparency pages via the association data.
        </li>
      </ul>
      <p>
        The <strong><a href="/admin/globals/homepage">Homepage</a></strong> global holds the hero section, intro, key figures and the quote. Board members and
        their roles live under the <em>Association</em> group; roles marked <em>authorised to represent (§ 26 BGB)</em> automatically appear in the legal
        notice (Impressum).
      </p>

      <h2 id="languages">3. Languages</h2>
      <p>
        The site runs in English (primary), German, Pashto and Dari. In every edit form you switch the content language with the <strong>locale selector</strong>{' '}
        in the top bar. Fields marked as localized store one value per language; anything left empty falls back to English. Please have Pashto/Dari texts
        reviewed by a native speaker before publishing.
      </p>

      <h2 id="settings">4. Settings &amp; legal pages</h2>
      <ul>
        <li>
          <strong><a href="/admin/globals/site-settings">Website settings</a></strong> – name, logo upload, brand colours, contact data, office hours, social
          media, donation bank details.
        </li>
        <li>
          <strong><a href="/admin/globals/vereinsdaten">Association data</a></strong> – register number, tax office, statutes, member counts, transparency
          texts. These feed the legal notice, the About page and the Transparency page automatically.
        </li>
        <li>
          <strong><a href="/admin/globals/legal-pages">Impressum &amp; privacy</a></strong> – the privacy policy text and additions to the legal notice.{' '}
          <em>Have both legally reviewed before going live.</em>
        </li>
        <li>
          <strong><a href="/admin/globals/membership-card">Membership card</a></strong> – card orientation, card language (English/German), the texts on the
          back, and whether accepted applications automatically receive their card by email.
        </li>
      </ul>

      <h2 id="inbox">5. Inbox: messages, registrations, applications</h2>
      <p>
        Website forms arrive in the <em>Inbox</em> group: <a href="/admin/collections/contact-messages">contact messages</a>,{' '}
        <a href="/admin/collections/event-registrations">event registrations</a> and{' '}
        <a href="/admin/collections/membership-applications">membership applications</a>. Use the <em>Status</em> field to track processing.
      </p>
      <p>
        <strong>Accepting a membership application:</strong> set its status to <em>“Accepted (creates member)”</em>. This automatically creates the member
        record (number, verification token, contribution from the chosen type) and — if enabled in the membership-card settings — emails the new member their
        membership card with the welcome message.
      </p>

      <h2 id="members">6. Members &amp; cards</h2>
      <p>
        The member register lives under <a href="/admin/collections/members">Members</a>; the selectable types (with their default monthly contribution) under{' '}
        <a href="/admin/collections/membership-types">Membership types</a>. The <strong><Link href="/intern/cards">Cards page</Link></strong> is the hub for
        everything card-related: preview, download (PDF/PNG) and sending by email — for membership cards and for{' '}
        <a href="/admin/collections/event-cards">event &amp; staff cards</a> (e.g. Security or Stage management for a festival).
      </p>
      <p>
        Every card carries a QR code linking to a public verification page. It confirms the membership <em>live</em>: deactivate a member (or let an event
        card’s validity date pass) and the card immediately stops verifying. No reprint needed.
      </p>

      {isFinance ? (
        <p className="guide-next">
          Next: the <Link href="/intern/guide/finance">Finance guide</Link> — bookkeeping, contributions, donations, year-end closing.
        </p>
      ) : null}
    </article>
  )
}
