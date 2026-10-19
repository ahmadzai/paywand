import '@fontsource-variable/literata'
import '@fontsource-variable/instrument-sans'
import '../(frontend)/site.css'

import type { Metadata } from 'next'
import React from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Membership verification | Paywand e.V.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="verify-body">
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
