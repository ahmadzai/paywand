import type { Payload } from 'payload'

// English with the German tax-law terms, since the spheres are defined by German law
export const SPHERE_LABELS: Record<string, string> = {
  ideell: 'Charitable core (ideeller Bereich)',
  vermoegen: 'Asset management (Vermögensverwaltung)',
  zweckbetrieb: 'Purpose-related operations (Zweckbetrieb)',
  wgb: 'Commercial operations (wirtschaftlicher Geschäftsbetrieb)',
}

const r2 = (n: number) => Math.round(n * 100) / 100
const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

export async function loadTransactions(payload: Payload, opts: { from?: string; to?: string; statuses?: string[] } = {}) {
  const and: any[] = []
  if (opts.from) and.push({ date: { greater_than_equal: opts.from } })
  if (opts.to) and.push({ date: { less_than_equal: opts.to } })
  if (opts.statuses) and.push({ status: { in: opts.statuses } })
  const res = await payload.find({
    collection: 'transactions',
    where: and.length ? { and } : undefined,
    limit: 100000,
    depth: 1,
    sort: 'date',
    overrideAccess: true,
  })
  return res.docs as any[]
}

/**
 * Booked = approved and not part of a storno pair. A reversed original and its storno
 * cancel each other out, so both are left out of totals (keeps gross income/expenses honest).
 */
export const isBooked = (t: any) => t.status === 'approved' && !t.reversalOf

export const signed = (t: any) => (t.type === 'income' ? 1 : -1) * Number(t.amount || 0)

export function yearRange(year: number) {
  return { from: `${year}-01-01T00:00:00.000Z`, to: `${year}-12-31T23:59:59.999Z` }
}

export function summarize(txs: any[]) {
  const counted = txs.filter(isBooked)
  const income = r2(counted.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0))
  const expenses = r2(counted.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0))

  const bySphere: Record<string, { income: number; expenses: number }> = {}
  const byCategory: Record<string, { name: string; publicLabel?: string; type: string; sphere: string; total: number }> = {}
  const byProject: Record<string, { name: string; budget?: number; income: number; expenses: number }> = {}

  for (const t of counted) {
    const sp = t.sphere || t.category?.sphere || 'ideell'
    bySphere[sp] ??= { income: 0, expenses: 0 }
    if (t.type === 'income') bySphere[sp].income += Number(t.amount)
    else bySphere[sp].expenses += Number(t.amount)

    const cid = String(idOf(t.category))
    byCategory[cid] ??= { name: t.category?.name ?? '–', publicLabel: t.category?.publicLabel, type: t.type, sphere: sp, total: 0 }
    byCategory[cid].total += Number(t.amount) * (t.type === byCategory[cid].type ? 1 : -1)

    if (t.project) {
      const pid = String(idOf(t.project))
      byProject[pid] ??= { name: t.project?.name ?? '–', budget: t.project?.budget, income: 0, expenses: 0 }
      if (t.type === 'income') byProject[pid].income += Number(t.amount)
      else byProject[pid].expenses += Number(t.amount)
    }
  }
  for (const v of Object.values(bySphere)) {
    v.income = r2(v.income)
    v.expenses = r2(v.expenses)
  }
  for (const v of Object.values(byCategory)) v.total = r2(v.total)
  for (const v of Object.values(byProject)) {
    v.income = r2(v.income)
    v.expenses = r2(v.expenses)
  }
  return { income, expenses, result: r2(income - expenses), bySphere, byCategory, byProject }
}

export async function accountBalances(payload: Payload, upTo?: string) {
  const accounts = (await payload.find({ collection: 'accounts', limit: 100, depth: 0, overrideAccess: true })).docs as any[]
  const txs = await loadTransactions(payload, { to: upTo })
  return accounts.map((a) => {
    const mine = txs.filter((t) => String(idOf(t.account)) === String(a.id) && new Date(t.date) >= new Date(a.openingDate))
    const booked = mine.filter(isBooked).reduce((s, t) => s + signed(t), 0)
    const pending = mine.filter((t) => t.status === 'submitted').reduce((s, t) => s + signed(t), 0)
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      opening: Number(a.openingBalance || 0),
      balance: r2(Number(a.openingBalance || 0) + booked),
      pending: r2(pending),
    }
  })
}
