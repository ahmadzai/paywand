import React from 'react'
import { getPermissions } from '../../access/permissions'

const linkStyle: React.CSSProperties = { display: 'block', textDecoration: 'none', padding: '3px 0' }

/**
 * Extra links at the bottom of the admin sidebar. Server component: Payload passes
 * `payload` and `user`, so the finance links only render for users with finance access.
 */
export const FinanceNavLink = async ({ payload, user }: { payload?: any; user?: any }) => {
  let isFinance = false
  if (payload && user) {
    try {
      const perms = await getPermissions({ user, payload, context: {} } as any)
      isFinance = perms.financeView || perms.financeEntry || perms.financeApprove || perms.financeAdmin
    } catch {
      isFinance = false
    }
  }
  return (
    <div style={{ padding: '12px 0', borderTop: '1px solid var(--theme-elevation-100)', marginTop: 12, fontSize: 13 }}>
      <a href="/intern/guide" style={{ ...linkStyle, fontWeight: 600 }}>
        📖 Admin guide
      </a>
      {isFinance ? (
        <>
          <a href="/intern" style={{ ...linkStyle, fontWeight: 600 }}>
            📊 Finance dashboard &amp; reports
          </a>
          <a href="/intern/guide/finance" style={{ ...linkStyle, fontWeight: 600 }}>
            💶 Finance guide
          </a>
        </>
      ) : null}
      <a href="/en" style={{ ...linkStyle, opacity: 0.75 }}>
        View website
      </a>
    </div>
  )
}
