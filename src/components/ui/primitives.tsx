import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * The shared primitives. Every one of them appears in /styleguide — a component
 * that isn't in the styleguide isn't done (CLAUDE.md §7).
 *
 * This file DEFINES components; it does not re-export them from elsewhere, so
 * it is not the barrel file CLAUDE.md §9 bans.
 */

/** Small, dim, letter-spaced. Metadata and section headings, never prose. */
export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="font-sans text-label tracking-[0.08em] text-ink-2 uppercase">
      {children}
    </span>
  )
}

/** The only horizontal separator. Separation is whitespace and hairlines. */
export function Rule() {
  return <hr className="my-0 h-px w-full border-0 bg-rule" />
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * `primary` fills with the accent — it is the one filled treatment in the
   * app. `quiet` is the default: text and a hairline, so a row of controls
   * doesn't shout over the glyphs it sits beside.
   */
  variant?: 'primary' | 'quiet'
}

export function Button({ variant = 'quiet', className = '', ...rest }: ButtonProps) {
  const base =
    'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md ' +
    'px-4 font-sans text-base font-medium transition-colors ' +
    'disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent ' +
    'disabled:text-ink-3'

  const variants = {
    primary:
      'border border-accent bg-accent text-ground hover:bg-ink-0 hover:border-ink-0',
    quiet: 'border border-rule bg-transparent text-ink-1 hover:bg-accent-soft',
  } as const

  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />
}

/**
 * A non-interactive count or status. Interactive things are Buttons — a chip
 * that can be clicked is a button that looks like a chip, and gets built as
 * one.
 */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-rule px-2 py-1 font-sans text-label tracking-[0.08em] text-ink-2 uppercase">
      {children}
    </span>
  )
}

/**
 * A kana glyph. The ONE place the JP face is applied — romaji and chrome are
 * Latin (CLAUDE.md §7).
 *
 * `lang="ja"` is not decoration: it tells the browser and a screen reader which
 * language this text is, which is what makes a Japanese voice read it as
 * Japanese rather than spelling it out.
 */
export function Glyph({
  children,
  size = 'md',
  className = '',
}: {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'text-glyph-sm',
    md: 'text-glyph-md',
    lg: 'text-glyph-lg',
  } as const

  return (
    <span
      lang="ja"
      className={`font-jp leading-none ${sizes[size]} ${className}`}
      // The JP face has no italic and no synthetic bold worth having; keeping
      // the weight explicit stops a heading context from faux-bolding a kana.
      style={{ fontWeight: 400 }}
    >
      {children}
    </span>
  )
}
