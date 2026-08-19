import type { ReactNode } from 'react'
import type { Character } from '../types/characters'
import { CharacterGrid } from '../components/CharacterGrid'
import { PronunciationNote, SpeakButton } from '../components/SpeakButton'
import { usePronunciation } from '../lib/usePronunciation'
import { GridCell, GridGap } from '../components/GridCell'
import { FLOW_FIXTURE } from '../characters/flowFixture'
import {
  Button,
  ButtonLink,
  Chip,
  Glyph,
  Label,
  Rule,
} from '../components/ui/primitives'

/**
 * Every token and every component in isolation, so the system can be reviewed
 * without navigating the app. A component that isn't here isn't done
 * (CLAUDE.md §7). Kept current as components are added.
 */

/** The measured contrast figures from tokens.css, shown beside the swatch. */
const INK = [
  { token: 'ink-0', contrast: '16.71:1', use: 'glyphs, headlines' },
  { token: 'ink-1', contrast: '11.23:1', use: 'prose' },
  { token: 'ink-2', contrast: '5.69:1', use: 'labels, metadata' },
  { token: 'ink-3', contrast: '2.53:1', use: 'gaps, disabled — NOT text' },
] as const

const SURFACES = [
  { token: 'ground', note: 'the page' },
  { token: 'sunken', note: 'row bands, card backs' },
  { token: 'rule', note: 'hairlines — 1.27:1, NOT text' },
] as const

const MEANING = [
  { token: 'accent', contrast: '7.93:1', use: 'selection, interaction' },
  { token: 'accent-soft', contrast: '—', use: 'hover wash — NEVER text' },
  { token: 'positive', contrast: '12.90:1', use: 'quiz: correct' },
  { token: 'negative', contrast: '5.80:1', use: 'quiz: wrong — never filled' },
] as const

/** Stand-ins for the grid-cell section — the styleguide names no script. */
const SAMPLE = {
  id: 'sample:ka',
  script: FLOW_FIXTURE.id,
  glyph: 'か',
  romaji: 'ka',
  rowId: 'sample',
  vowel: 'a',
  examples: [{ kana: 'かさ', romaji: 'kasa', english: 'umbrella' }],
} as const satisfies Character

const SAMPLE_N = {
  id: 'sample:nn',
  script: FLOW_FIXTURE.id,
  glyph: 'ん',
  romaji: 'n',
  rowId: 'sample',
  vowel: null,
  examples: [{ kana: 'みかん', romaji: 'mikan', english: 'mandarin orange' }],
} as const satisfies Character

/** The real control, resolving against whatever voices this device has. */
function LivePronunciation() {
  const { status, speak } = usePronunciation()
  return (
    <div className="flex items-center gap-3">
      <SpeakButton character={SAMPLE} status={status} onSpeak={speak} />
      <Label>status: {status}</Label>
    </div>
  )
}

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
          Contrast figures are measured against the near-black ground, not chosen by
          eye.
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
          The positive/negative pair is separated by lightness, not hue. The obvious
          dark pair collapses to ΔE 1.9 under protanopia; this one measures ΔE 38.0
          protan and 43.6 deutan. Even so, feedback never relies on colour alone — it
          always carries a word and a mark.
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

      <Section title="Pronunciation">
        <LivePronunciation />
        <p className="m-0 max-w-prose text-sm text-ink-2">
          Above is the real control, wired to this device. Below are the three states
          forced, so the one you cannot reproduce locally is still reviewable.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {(['ready', 'checking', 'unavailable'] as const).map((status) => (
            <div key={status} className="flex flex-col items-center gap-2">
              <SpeakButton
                character={SAMPLE}
                status={status}
                onSpeak={() => undefined}
              />
              <Label>{status}</Label>
            </div>
          ))}
        </div>
        <PronunciationNote status="unavailable" />
        <p className="m-0 max-w-prose text-sm text-ink-2">
          The control is disabled and explains itself rather than being hidden — an
          absent button reads as &ldquo;this app has no audio&rdquo;, which is not what
          happened. The note is rendered once per screen, not beside all forty-six
          characters.
        </p>
      </Section>

      <Section title="Grid cell">
        <div className="grid max-w-xs grid-cols-4 gap-1.5">
          <GridCell character={SAMPLE} selected={false} onToggle={() => undefined} />
          <GridCell character={SAMPLE} selected onToggle={() => undefined} />
          <GridGap />
          <GridCell character={SAMPLE_N} selected={false} onToggle={() => undefined} />
        </div>
        <p className="m-0 max-w-prose text-sm text-ink-2">
          Unselected, selected, a gap, and ん. The gap is empty space rather than a
          disabled button — there is no character there to disable, and collapsing it
          would change the shape of the chart.
        </p>
      </Section>

      <Section title="Grid: the flow layout">
        <CharacterGrid set={FLOW_FIXTURE} />
        <p className="m-0 max-w-prose text-sm text-ink-2">
          The second of <code>CharacterGrid</code>&rsquo;s two layout branches, kept
          alive by a fixture so it is a capability rather than a claim. A set with no
          vowel columns lays its characters out in groups instead of a matrix — and a
          grid that hardcoded five columns is exactly what would need rewriting. These
          glyphs fall back to the OS face: the shipped webfont is kana-only, so this is
          also what a missing glyph looks like.
        </p>
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
          <ButtonLink to="/">Link as button</ButtonLink>
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
