import { loadEventCardData, renderCardPdf } from '@/lib/card'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getInternSession()
  if (!session?.canCards) return new Response('No access.', { status: 403 })
  const { id } = await params
  const payload = await getClient()
  const card = await loadEventCardData(payload, id)
  if (!card) return new Response('Card not found.', { status: 404 })
  const pdf = await renderCardPdf(card.data)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="paywand-event-card-${id}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
