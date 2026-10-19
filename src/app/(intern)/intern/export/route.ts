import type { NextRequest } from 'next/server'
import { loadTransactions, yearRange } from '@/lib/finance'
import { getInternSession, STATUS_LABELS } from '@/lib/intern'
import { getClient } from '@/lib/payload'

const TYPE_LABELS: Record<string, string> = { income: 'Income', expense: 'Expense' }

/** International CSV: comma separator, decimal point, ISO dates; BOM so Excel detects UTF-8. */
const cell = (v: unknown): string => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const amount = (n: number) => n.toFixed(2)
const day = (iso: string) => {
  // ISO date (YYYY-MM-DD) in Europe/Berlin
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

export async function GET(request: NextRequest) {
  const session = await getInternSession()
  if (!session || !session.viewAll) {
    return new Response('No access. Please log in via the admin panel.', { status: 403 })
  }
  const payload = await getClient()
  const yearParam = Number(request.nextUrl.searchParams.get('year'))
  const year = Number.isInteger(yearParam) && yearParam > 2000 && yearParam < 2100 ? yearParam : new Date().getFullYear()

  const txs = await loadTransactions(payload, yearRange(year))
  const header = ['Receipt no.', 'Date', 'Type', 'Amount (EUR)', 'Account', 'Category', 'Sphere', 'Project', 'Counterparty', 'Description', 'Status', 'Entered by']
  const rows = txs.map((t) =>
    [
      t.receiptNumber || '',
      day(t.date),
      TYPE_LABELS[t.type] || t.type,
      amount(Number(t.amount || 0)),
      t.account?.name || '',
      t.category?.name || '',
      t.sphere || t.category?.sphere || '',
      t.project?.name || '',
      t.counterparty || '',
      t.description || '',
      STATUS_LABELS[t.status] || t.status,
      t.createdBy?.name || t.createdBy?.email || '',
    ]
      .map(cell)
      .join(','),
  )
  const csv = '﻿' + [header.join(','), ...rows].join('\r\n') + '\r\n'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="paywand-transactions-${year}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
