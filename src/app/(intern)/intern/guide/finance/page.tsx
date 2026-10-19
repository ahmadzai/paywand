import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getInternSession } from '@/lib/intern'

export const metadata = { title: 'Finance guide' }

export default async function FinanceGuide() {
  const session = await getInternSession()
  if (!session) redirect('/admin/login?redirect=%2Fintern%2Fguide%2Ffinance')
  if (!session.isFinance) redirect('/intern/guide')

  return (
    <article className="guide">
      <h1>Finance guide</h1>
      <p className="guide-lead">
        How the finance module works: bookkeeping with approval workflow, membership contributions, donations, expenses and the year-end closing. General
        website administration is covered in the <Link href="/intern/guide">Admin guide</Link>.
      </p>

      <nav className="guide-toc" aria-label="Contents">
        <a href="#roles">Roles</a>
        <a href="#setup">Accounts &amp; categories</a>
        <a href="#workflow">Transaction workflow</a>
        <a href="#contributions">Contributions</a>
        <a href="#donations">Donations</a>
        <a href="#expenses">Expenses &amp; projects</a>
        <a href="#closing">Year-end &amp; reports</a>
      </nav>

      <h2 id="roles">1. Finance roles</h2>
      <ul>
        <li><strong>Treasurer (Kassenwart/in)</strong> – full finance administration including settings and year-end closing.</li>
        <li><strong>Board (Vorstand)</strong> – sees everything and approves transactions.</li>
        <li><strong>Cash auditor (Kassenprüfer/in)</strong> – read-only access to all finance data.</li>
        <li><strong>Project lead</strong> – records own transactions and receipts; sees only their own entries.</li>
      </ul>
      <p>
        Key principle: <strong>four-eyes (Vier-Augen-Prinzip)</strong>. Nobody approves their own transaction, and the number of required approvals (1 or 2) is
        set in the <a href="/admin/globals/finance-settings">finance settings</a>.
      </p>

      <h2 id="setup">2. Accounts, categories, tax spheres</h2>
      <p>
        <a href="/admin/collections/accounts">Accounts &amp; cash boxes</a> mirror your real bank account(s) and cash box, each with an opening balance.{' '}
        <a href="/admin/collections/finance-categories">Categories</a> classify every transaction and carry a <strong>tax sphere (Sphäre)</strong> — this
        matters for non-profit status (Gemeinnützigkeit):
      </p>
      <ul>
        <li><strong>Ideell</strong> – the charitable core: membership fees, donations, grants, and the costs of the charitable work.</li>
        <li><strong>Vermögensverwaltung</strong> – asset management, e.g. bank interest.</li>
        <li><strong>Zweckbetrieb</strong> – purpose-related operations, e.g. course participation fees.</li>
        <li><strong>Wirtschaftlicher Geschäftsbetrieb</strong> – commercial activity, e.g. food sales at a festival.</li>
      </ul>
      <p>When unsure which sphere applies, ask the tax advisor — the annual report groups everything by sphere.</p>

      <h2 id="workflow">3. Transaction workflow</h2>
      <ol>
        <li><strong>Draft</strong> – anyone with entry rights records a <a href="/admin/collections/transactions">transaction</a>: date, income/expense, amount, account, category, counterparty, description.</li>
        <li><strong>Submitted</strong> – set the status to “Submitted”. A <a href="/admin/collections/receipts">receipt (Beleg)</a> must be attached (configurable).</li>
        <li><strong>Approved</strong> – an approver ticks <em>“✔ Approve this transaction”</em> in the sidebar. With two required approvals, a second person must also approve. Approved transactions get a receipt number (e.g. 2026-0012) and become <strong>immutable</strong>.</li>
      </ol>
      <p>
        <strong>Corrections:</strong> an approved transaction is never edited. Create a reversal (storno) instead: new transaction, pick the original under
        “Reversal of” — values are copied and inverted; once the reversal is approved, the original is marked reversed. Changing key fields of a submitted
        transaction resets its approvals.
      </p>

      <h2 id="contributions">4. Membership contributions</h2>
      <p>
        The <Link href="/intern/contributions">Contributions page</Link> shows a year matrix (members × months): ✓ means paid, <strong>+</strong> records a
        payment with one click (amount defaults to the member’s monthly fee). Below it, the arrears list shows who owes what. Recording a payment
        automatically creates a linked <em>draft</em> income transaction, which then goes through the normal approval workflow — the matrix and the books can
        never drift apart.
      </p>

      <h2 id="donations">5. Donations</h2>
      <p>
        Record donations under <a href="/admin/collections/donations">Donations</a> (or via the <Link href="/intern/donations">Donations page</Link>): donor,
        amount, optional earmark/project, and the donor’s address if they want a donation receipt (Zuwendungsbestätigung). Tick <em>receipt requested</em>;
        once issued, use <em>“Mark issued”</em> on the Donations page. Like contributions, each donation creates a linked draft transaction.
      </p>

      <h2 id="expenses">6. Expenses &amp; projects</h2>
      <p>
        Expenses are ordinary transactions of type <em>Expense</em>. For anything with its own budget — a course, a festival, a grant — create a{' '}
        <a href="/admin/collections/finance-projects">project</a> and link the expenses to it. The <Link href="/intern/expenses">Expenses page</Link> then
        shows budget vs. spent per project (e.g. “Kids&rsquo; course: 500&nbsp;€ budget, 195.90&nbsp;€ spent”) and totals by category.
      </p>

      <h2 id="closing">7. Year-end closing, reports, transparency</h2>
      <ul>
        <li>
          <strong><Link href="/intern">Dashboard</Link></strong> – balances, year-to-date by sphere, pending approvals.
        </li>
        <li>
          <strong>CSV export</strong> (dashboard button) – all transactions of a year for Excel or the tax advisor.
        </li>
        <li>
          <strong>Annual report</strong> – the printable income–expenditure statement (EÜR) by sphere with year-end balances and signature lines for treasurer
          and cash auditor; use it for the general assembly (Mitgliederversammlung) and the audit.
        </li>
        <li>
          <strong>Closing a year:</strong> after the audit, create/lock the year under{' '}
          <a href="/admin/collections/finance-periods">Financial years / Closing</a>. A locked year blocks all changes to its transactions; only a super-admin
          can unlock. Record the audit date and auditors there.
        </li>
        <li>
          <strong>Transparency page:</strong> in the <a href="/admin/globals/finance-settings">finance settings</a> you can publish the income/expense overview
          of a <em>locked</em> year on the public transparency page — it only ever shows approved figures.
        </li>
      </ul>
      <p>
        Keep receipts: statutory retention is 10 years for books and 8 years for receipts (Belege, since 2025). Receipt files live in a protected area only
        finance users can read.
      </p>

      <p className="guide-next">
        Back to the <Link href="/intern/guide">Admin guide</Link> · <Link href="/intern">Finance dashboard</Link>
      </p>
    </article>
  )
}
