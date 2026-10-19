import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

export function RichText({ data, className = 'prose' }: { data: any; className?: string }) {
  if (!data?.root?.children?.length) return null
  return <LexicalRichText data={data} className={className} />
}
