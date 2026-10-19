import '@fontsource-variable/literata'
import '@fontsource-variable/instrument-sans'
import '../(frontend)/site.css'

import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { getInternSession } from '@/lib/intern'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Internal finance | Paywand e.V.', template: '%s | Paywand internal' },
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
}

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const session = await getInternSession()
  return (
    <html lang="en" dir="ltr">
      <body className="intern-body">
        <header className="intern-header">
          <div className="wrap intern-header-row">
            <Link href="/intern" className="intern-brand">
              Paywand <span>Internal finance</span>
            </Link>
            {session ? (
              <nav className="intern-nav" aria-label="Internal area">
                {session.isFinance ? (
                  <>
                    <Link href="/intern">Overview</Link>
                    <Link href="/intern/contributions">Contributions</Link>
                    <Link href="/intern/donations">Donations</Link>
                    <Link href="/intern/expenses">Expenses</Link>
                  </>
                ) : null}
                {session.canCards ? <Link href="/intern/cards">Cards</Link> : null}
                <Link href={session.isFinance ? '/intern/guide/finance' : '/intern/guide'}>Guide</Link>
                <a href="/admin">Admin</a>
                <span className="intern-user">{session.user.name || session.user.email}</span>
                <a href="/admin/logout">Log out</a>
              </nav>
            ) : null}
          </div>
        </header>
        <main id="main" className="intern-main wrap">
          {children}
        </main>
      </body>
    </html>
  )
}
