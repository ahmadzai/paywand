'use client'

export function PrintButton() {
  return (
    <button type="button" className="btn btn-primary btn-small no-print" onClick={() => window.print()}>
      Print / save as PDF
    </button>
  )
}
