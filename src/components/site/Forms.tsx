'use client'

import Link from 'next/link'
import React, { useActionState, useState } from 'react'
import type { FormState } from '@/app/(frontend)/actions'

type Field = {
  name: string
  label: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'number' | 'select'
  required?: boolean
  options?: { value: string; label: string }[]
  dir?: 'ltr' | 'auto'
  /** Span the full form width (textareas always do). */
  wide?: boolean
  autoComplete?: string
}

type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  fields: Field[]
  hidden?: Record<string, string>
  submitLabel: string
  sendingLabel: string
  successText: string
  errorText: string
  consentText: string
  privacyHref: string
  privacyLabel: string
  requiredLabel: string
  /** Validation message for invalid phone numbers (tel fields). */
  phoneInvalidText?: string
  /** Validation message for invalid postal codes (autoComplete="postal-code" fields). */
  postalInvalidText?: string
}

export function SiteForm(p: Props) {
  const [state, formAction, pending] = useActionState(p.action, null)
  const [started] = useState(() => Date.now())

  /** Phone/WhatsApp: optional leading +, separators allowed, 7–15 digits (E.164). */
  const validateTel = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const digits = el.value.replace(/\D/g, '')
    const wellFormed = /^\+?[\d ()/.\-]*$/.test(el.value)
    const invalid = el.value.trim() !== '' && (!wellFormed || digits.length < 7 || digits.length > 15)
    el.setCustomValidity(invalid ? p.phoneInvalidText || 'Please enter a valid phone number, e.g. +49 170 1234567.' : '')
  }

  /** German postal code: exactly 5 digits (leading zero allowed, e.g. 01067). */
  const validatePostal = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const v = el.value.trim()
    const invalid = v !== '' && (!/^\d{5}$/.test(v) || v === '00000')
    el.setCustomValidity(invalid ? p.postalInvalidText || 'Please enter a valid postal code (5 digits, e.g. 12049).' : '')
  }

  if (state?.ok) {
    return (
      <div className="form-success" role="status">
        <p>{p.successText}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="site-form" noValidate={false}>
      {state?.error ? (
        <p className="form-error" role="alert">
          {p.errorText}
        </p>
      ) : null}
      {Object.entries(p.hidden || {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="_t" value={String(started)} />
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {p.fields.map((f) => (
        <label key={f.name} className={`field ${f.type === 'textarea' || f.wide ? 'field-wide' : ''}`}>
          <span className="field-label">
            {f.label}
            {f.required ? <span className="req" aria-label={p.requiredLabel}> *</span> : null}
          </span>
          {f.type === 'textarea' ? (
            <textarea name={f.name} required={f.required} rows={5} dir="auto" />
          ) : f.type === 'select' ? (
            <select name={f.name} required={f.required}>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={f.name}
              type={f.type || 'text'}
              required={f.required}
              autoComplete={f.autoComplete || (f.type === 'tel' ? 'tel' : undefined)}
              inputMode={f.type === 'tel' ? 'tel' : f.autoComplete === 'postal-code' ? 'numeric' : undefined}
              maxLength={f.autoComplete === 'postal-code' ? 5 : undefined}
              onInput={f.type === 'tel' ? validateTel : f.autoComplete === 'postal-code' ? validatePostal : undefined}
              dir={f.dir || (f.type === 'email' || f.type === 'tel' ? 'ltr' : 'auto')}
              min={f.type === 'number' ? 1 : undefined}
              max={f.type === 'number' ? 20 : undefined}
              defaultValue={f.type === 'number' ? 1 : undefined}
            />
          )}
        </label>
      ))}
      <label className="consent field-wide">
        <input type="checkbox" name="consent" required />
        <span>
          {p.consentText} (<Link href={p.privacyHref}>{p.privacyLabel}</Link>)
        </span>
      </label>
      <div className="field-wide">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? p.sendingLabel : p.submitLabel}
        </button>
      </div>
    </form>
  )
}
