import { loadCardData, renderCardPdf } from '@/lib/card'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getInternSession()
  if (!session?.canCards) return new Response('No access.', { status: 403 })
  const { id } = await params
  const payload = await getClient()
  const card = await loadCardData(payload, id)
  if (!card) return new Response('Member not found.', { status: 404 })
  const pdf = await renderCardPdf(card.data)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="paywand-card-${card.data.meta || id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
