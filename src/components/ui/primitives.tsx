import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

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

/**
 * A page heading that carries the LABEL's visual weight.
 *
 * Flashcards and the quiz put the glyph front and centre, and chrome recedes
 * (CLAUDE.md §7) — but a route still needs a heading, and those two had only
 * the site-wide `h1`. Rather than bolting a large title onto a deliberately
 * spare page, the position indicator that was already there becomes the
 * heading: "Card 3 of 5" tells a screen-reader user navigating by heading
 * where they actually are, which "Flashcards" (already in the nav) does not.
 *
 * Visually identical to `Label`. The change is entirely in the document
 * outline.
 */
export function HeadingLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="m-0 font-sans text-label font-medium tracking-[0.08em] text-ink-2 uppercase">
      {children}
    </h2>
  )
}

/** The only horizontal separator. Separation is whitespace and hairlines. */
export function Rule() {
  return <hr className="my-0 h-px w-full border-0 bg-rule" />
}

type Variant = 'primary' | 'quiet'

/**
 * The one place button styling is defined. `Button` and `ButtonLink` share it
 * so a link that looks like a button cannot drift from a real one.
 *
 * Not exported: a caller reaching for the class string is a caller about to
 * build a fourth kind of button.
 */
function buttonClasses(variant: Variant, extra: string): string {
  const base =
    'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md ' +
    'px-4 font-sans text-base font-medium no-underline transition-colors ' +
    'disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent ' +
    'disabled:text-ink-3'

  const variants: Record<Variant, string> = {
    primary:
      'border border-accent bg-accent text-ground hover:border-ink-0 hover:bg-ink-0',
    quiet: 'border border-rule bg-transparent text-ink-1 hover:bg-accent-soft',
  }

  return `${base} ${variants[variant]} ${extra}`
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /**
   * `primary` fills with the accent — it is the one filled treatment in the
   * app. `quiet` is the default: text and a hairline, so a row of controls
   * doesn't shout over the glyphs it sits beside.
   */
  variant?: Variant
}

export function Button({ variant = 'quiet', className = '', ...rest }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...rest} />
}

/**
 * A navigation control that looks like a button.
 *
 * It renders a real `<Link>`, so it is a link to a screen reader, is
 * middle-clickable, and shows its target on hover. Styling a `<button>` and
 * calling `navigate()` would look identical and be none of those things.
 */
export function ButtonLink({
  to,
  variant = 'quiet',
  className = '',
  children,
}: {
  to: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  )
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
