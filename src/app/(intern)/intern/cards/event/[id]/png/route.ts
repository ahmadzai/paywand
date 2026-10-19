import sharp from 'sharp'
import { loadEventCardData, renderCardPngs } from '@/lib/card'
import { getInternSession } from '@/lib/intern'
import { getClient } from '@/lib/payload'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getInternSession()
  if (!session?.canCards) return new Response('No access.', { status: 403 })
  const { id } = await params
  const inline = new URL(req.url).searchParams.get('inline') === '1'
  const payload = await getClient()
  const card = await loadEventCardData(payload, id)
  if (!card) return new Response('Card not found.', { status: 404 })
  const { front, back } = await renderCardPngs(card.data)
  const fm = await sharp(front).metadata()
  const gap = 40
  // portrait cards sit side by side; landscape cards stack vertically
  const landscape = fm.width! > fm.height!
  const combined = await sharp({
    create: {
      width: landscape ? fm.width! : fm.width! * 2 + gap,
      height: landscape ? fm.height! * 2 + gap : fm.height!,
      channels: 4,
      background: { r: 246, g: 247, b: 251, alpha: 1 },
    },
  })
    .composite([
      { input: front, top: 0, left: 0 },
      { input: back, top: landscape ? fm.height! + gap : 0, left: landscape ? 0 : fm.width! + gap },
    ])
    .png()
    .toBuffer()
  return new Response(new Uint8Array(combined), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="paywand-event-card-${id}.png"`,
      'Cache-Control': 'no-store',
    },
  })
}
