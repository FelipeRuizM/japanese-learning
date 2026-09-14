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
 * A toggle that stays on — the selection treatment, in one place.
 *
 * `GridCell`, `SetPicker` and the vocabulary scope picker all say "this one is
 * on" the same way: ground on accent, the same inversion a selected grid cell
 * uses (CLAUDE.md §7). It lived only in `SetPicker` until a second multi-select
 * picker wanted it, which is the point at which copying the class string would
 * have meant three places to keep in step.
 *
 * `pressed` ACCEPTS 'mixed', which is a real `aria-pressed` value and exactly
 * what a "select the whole week" control needs when half the week is on.
 * Collapsing that into `false` would make the button lie, and collapsing it
 * into `true` would make "clear the week" the action of a control that looks
 * already-clear. It gets its own treatment: the accent as an outline and a
 * wash, rather than a fill.
 */
export function Toggle({
  pressed,
  onClick,
  children,
  label,
  size = 'md',
}: {
  pressed: boolean | 'mixed'
  onClick: () => void
  children: ReactNode
  /**
   * Overrides the accessible name. Must CONTAIN the visible text — a name that
   * merely replaces it breaks voice control, which is the defect §8 records
   * from the grid cell.
   */
  label?: string | undefined
  /** `sm` for a long list of them. The 44px hit target is unchanged (§5). */
  size?: 'sm' | 'md'
}) {
  /**
   * THE SOLID FILL IS RESERVED FOR `md`, AND THAT IS NOT A SIZE DECISION.
   *
   * Eleven topic toggles, all on by default, rendered as eleven solid indigo
   * blocks — and the glyph they sat above was dimmer than every one of them.
   * "The glyph is the largest and brightest thing on screen, always. Chrome
   * recedes" (§7) is not a preference, and a wall of filled chrome breaks it no
   * matter how correct each individual chip is.
   *
   * So `md` fills and `sm` washes: the accent as text on `accent-soft`, 6.20:1,
   * clear of AA. The second effect is the one the markup was already trying to
   * express and failing — a week toggle beside its topics now READS as the
   * level above them, where two rows of identical fills read as one list.
   *
   * Only jsdom-blind review let this ship in the first place: every test passed,
   * every state was correct, and the page was still wrong. Look at it.
   */
  const fill = {
    true: 'border-accent bg-accent text-ground',
    mixed: 'border-accent bg-accent-soft text-ink-0',
    false: 'border-rule bg-transparent text-ink-1 hover:bg-accent-soft',
  } as const

  const wash = {
    true: 'border-accent bg-accent-soft text-accent',
    mixed: 'border-accent bg-accent-soft text-ink-0',
    false: 'border-rule bg-transparent text-ink-2 hover:bg-accent-soft',
  } as const

  return (
    <button
      type="button"
      aria-pressed={pressed}
      {...(label === undefined ? {} : { 'aria-label': label })}
      onClick={onClick}
      className={[
        'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md',
        'border font-sans font-medium transition-colors',
        size === 'sm' ? 'px-3 text-sm' : 'px-4 text-base',
        (size === 'sm' ? wash : fill)[`${pressed}`],
      ].join(' ')}
    >
      {children}
    </button>
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
