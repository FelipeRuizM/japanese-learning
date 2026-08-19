import type { ReactNode } from 'react'
import { Button, Chip, Glyph, Label, Rule } from '../components/ui/primitives'

/**
 * Every token and every component in isolation, so the system can be reviewed
 * without navigating the app. A component that isn't here isn't done
 * (CLAUDE.md §7). Kept current as components are added.
 */

/** The measured contrast figures from tokens.css, shown beside the swatch. */
const INK = [
  { token: 'ink-0', contrast: '16.70:1', use: 'glyphs, headlines' },
  { token: 'ink-1', contrast: '11.50:1', use: 'prose' },
  { token: 'ink-2', contrast: '5.60:1', use: 'labels, metadata' },
  { token: 'ink-3', contrast: '2.89:1', use: 'gaps, disabled — NOT text' },
] as const

const SURFACES = [
  { token: 'ground', note: 'the page' },
  { token: 'sunken', note: 'row bands, card backs' },
  { token: 'rule', note: 'hairlines — 1.36:1, NOT text' },
] as const

const MEANING = [
  { token: 'accent', contrast: '7.97:1', use: 'selection, interaction' },
  { token: 'accent-soft', contrast: '—', use: 'hover wash — NEVER text' },
  { token: 'positive', contrast: '11.19:1', use: 'quiz: correct' },
  { token: 'negative', contrast: '4.58:1', use: 'quiz: wrong — never filled' },
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>{title}</Label>
        <Rule />
      </div>
      {children}
    </section>
  )
}

function Swatch({ token, meta, use }: { token: string; meta: string; use: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 shrink-0 rounded-sm border border-rule"
        style={{ background: `var(--color-${token})` }}
      />
      <div className="flex min-w-0 flex-col">
        <code className="font-sans text-sm text-ink-0">--color-{token}</code>
        <span className="font-sans text-label tracking-[0.08em] text-ink-2">
          {meta} · {use}
        </span>
      </div>
    </div>
  )
}

export function Styleguide() {
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <Label>Styleguide</Label>
        <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
          Every token and component, in isolation
        </h2>
        <p className="m-0 max-w-prose text-ink-1">
          Contrast figures are measured against the paper ground, not chosen by eye.
        </p>
      </header>

      <Section title="Surfaces">
        <div className="flex flex-col gap-3">
          {SURFACES.map((s) => (
            <Swatch key={s.token} token={s.token} meta="surface" use={s.note} />
          ))}
        </div>
      </Section>

      <Section title="Ink ramp">
        <div className="flex flex-col gap-3">
          {INK.map((s) => (
            <Swatch key={s.token} token={s.token} meta={s.contrast} use={s.use} />
          ))}
        </div>
      </Section>

      <Section title="Accent and semantics">
        <div className="flex flex-col gap-3">
          {MEANING.map((s) => (
            <Swatch key={s.token} token={s.token} meta={s.contrast} use={s.use} />
          ))}
        </div>
        <p className="m-0 max-w-prose text-sm text-ink-2">
          The positive/negative pair is separated by lightness, not hue: the first draft
          collapsed to ΔE 9.1 under protanopia. This pair measures ΔE 19.7 protan and
          46.7 deutan. Even so, feedback never relies on colour alone — it always
          carries a word and a mark.
        </p>
        <div className="flex flex-col gap-2">
          <p className="m-0 flex items-center gap-2 border-l-2 border-positive pl-3 text-positive">
            <CheckMark /> Correct
          </p>
          <p className="m-0 flex items-center gap-2 border-l-2 border-negative pl-3 text-negative">
            <CrossMark /> Not quite
          </p>
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-3">
          <p className="m-0 text-ink-1">
            IBM Plex Sans carries prose, romaji and every piece of chrome.
          </p>
          <p className="m-0">
            <Label>Label — small, dim, letter-spaced</Label>
          </p>
          <p className="m-0 font-sans text-ink-2">
            Romaji is Latin, never the JP face: <em>ka · shi · tsu · fu</em>
          </p>
        </div>
      </Section>

      <Section title="Glyph scale">
        <div className="flex flex-wrap items-end gap-8">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Glyph size={size}>あ</Glyph>
              <Label>{size}</Label>
            </div>
          ))}
        </div>
        <p className="m-0 max-w-prose text-sm text-ink-2">
          Set in the hand-subsetted Noto Sans JP (43.5 KB, kana blocks only). If these
          render in a different face than the browser&rsquo;s Japanese default, the
          webfont failed to load.
        </p>
      </Section>

      <Section title="Controls">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button>Quiet</Button>
          <Button disabled>Disabled</Button>
          <Chip>15 selected</Chip>
        </div>
        <p className="m-0 max-w-prose text-sm text-ink-2">
          Every control clears a 44px hit target. Tab to one to see the focus ring.
        </p>
      </Section>
    </div>
  )
}

/* Icons are inline SVG. Emoji as iconography is banned (CLAUDE.md §7). Both are
   aria-hidden: the adjacent word already carries the meaning. */
function CheckMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 8.5l3.5 3.5L13 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
