import { useState, type ReactNode } from 'react'
import type { Character, ScriptId } from '../types/characters'
import type { VocabEntry } from '../types/vocab'
import { CharacterGrid } from '../components/CharacterGrid'
import { PronunciationNote, SpeakButton } from '../components/SpeakButton'
import { QuizCard } from '../components/QuizCard'
import { Flashcard } from '../components/Flashcard'
import { VocabCard } from '../components/VocabCard'
import { VocabQuizCard } from '../components/VocabQuizCard'
import { NumberCard } from '../components/NumberCard'
import { ClozeCard } from '../components/ClozeCard'
import { EmptyDeck } from '../components/EmptyDeck'
import { buildQuestion } from '../lib/quiz'
import {
  allCharacters,
  CHARACTER_SETS,
  DEFAULT_CHARACTER_SET,
  speakable,
} from '../characters/registry'
import { usePronunciation } from '../lib/usePronunciation'
import { GridCell, GridGap } from '../components/GridCell'
import { SoundCell } from '../components/SoundCell'
import { SetPicker } from '../components/SetPicker'
import { FLOW_FIXTURE } from '../characters/flowFixture'
import { VOCAB_SETS, everyVocabEntry, vocabEntries } from '../vocab/registry'
import { buildVocabQuestion } from '../lib/vocabQuiz'
import { buildNumberQuestion, promptFor } from '../lib/numbers'
import { buildClozeQuestion } from '../lib/cloze'
import { CLOZE_ITEMS } from '../grammar/registry'
import { systemRng } from '../lib/shuffle'
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

/**
 * A live vocabulary card. Reviewable next to `FlashcardDemo` on purpose: the
 * two are siblings, and the reason they are not one component is easiest to see
 * side by side — a longer phrase needs a smaller front, and the back carries a
 * meaning as well as a reading.
 */
function VocabCardDemo() {
  const set = VOCAB_SETS[0]
  const { status, speak } = usePronunciation()
  const [revealed, setRevealed] = useState(false)
  const item = set ? vocabEntries(set)[0]?.item : undefined
  if (!item) return null

  return (
    <div className="flex flex-col gap-3">
      <VocabCard
        item={item}
        group="Daily greetings"
        revealed={revealed}
        onFlip={() => {
          setRevealed((r) => !r)
        }}
        pronunciationStatus={status}
        onSpeak={speak}
      />
      <p className="m-0 max-w-prose text-sm text-ink-2">
        The group label sits with the reveal, not beside the prompt — a category next to
        a question narrows the answer, and this card is not meant to hint. Same
        remount-on-advance rule as the character flashcard.
      </p>
    </div>
  )
}

/**
 * A vocabulary question, answered, so the marked options and the reveal are
 * reviewable. The English options are the reason this is not `QuizCard`: four
 * of them are four sentences, which is a different layout problem from four
 * glyphs.
 */
function VocabQuizCardDemo() {
  const [chosen, setChosen] = useState<VocabEntry | null>(null)
  // Built ONCE. Generating it during render would re-roll the question on the
  // click that answers it, and the option marked correct would not be the one
  // that was correct a moment earlier.
  const [question] = useState(() => {
    const set = VOCAB_SETS[0]
    const entries = set ? vocabEntries(set) : []
    const answer = entries[0]
    return answer
      ? buildVocabQuestion(answer, entries, everyVocabEntry(), systemRng)
      : null
  })
  if (!question) return null

  return (
    <VocabQuizCard
      question={question}
      chosen={chosen}
      onChoose={setChosen}
      onNext={() => {
        setChosen(null)
      }}
      isLast={false}
    />
  )
}

/**
 * A numbers question. The prompt is the only one in the app that is not
 * Japanese — a numeral, with kana in the options — so it is worth seeing beside
 * the other two.
 */
function NumberCardDemo() {
  const [chosen, setChosen] = useState<string | null>(null)
  // Built once: generating during render would re-roll the question on the
  // click that answers it (see VocabQuizCardDemo).
  const [question] = useState(() =>
    buildNumberQuestion(promptFor('age', 20), systemRng),
  )

  return (
    <div className="flex flex-col gap-3">
      <NumberCard
        question={question}
        chosen={chosen}
        onChoose={setChosen}
        onNext={() => {
          setChosen(null)
        }}
        isLast={false}
      />
      <p className="m-0 max-w-prose text-sm text-ink-2">
        Pinned to 20 years old, because はたち is the one age that drops さい entirely —
        and にじゅうさい, the form a learner writes before they know that, is one of the
        distractors.
      </p>
    </div>
  )
}

/**
 * A cloze question. Worth seeing unanswered and answered: the gap is a dashed
 * rule before, and the correct form in accent ink after.
 */
function ClozeCardDemo() {
  const [chosen, setChosen] = useState<string | null>(null)
  // Built once, like the other two — see VocabQuizCardDemo.
  const [question] = useState(() => {
    const item = CLOZE_ITEMS.find((c) => c.kind === 'copula') ?? CLOZE_ITEMS[0]
    return item ? buildClozeQuestion(item, systemRng) : null
  })
  if (!question) return null

  return (
    <div className="flex flex-col gap-3">
      <ClozeCard
        question={question}
        chosen={chosen}
        onChoose={setChosen}
        onNext={() => {
          setChosen(null)
        }}
        isLast={false}
      />
      <p className="m-0 max-w-prose text-sm text-ink-2">
        The meaning sits with the QUESTION, not the reveal: without it,
        わたし＿がくせいです takes は for &ldquo;I am a student&rdquo; and の for
        &ldquo;it is my student&rdquo;, and both are real sentences.
      </p>
    </div>
  )
}

/** A live flashcard, so the flip and both faces are reviewable in isolation. */
function FlashcardDemo() {
  const all = allCharacters(DEFAULT_CHARACTER_SET)
  const character = all.find((c) => c.romaji === 'ka') ?? all[0]
  const { status, speak } = usePronunciation()
  const [revealed, setRevealed] = useState(false)
  if (!character) return null

  return (
    <div className="flex flex-col gap-3">
      <Flashcard
        character={character}
        revealed={revealed}
        onFlip={() => {
          setRevealed((r) => !r)
        }}
        pronunciationStatus={status}
        onSpeak={speak}
      />
      <p className="m-0 max-w-prose text-sm text-ink-2">
        Both faces are in the DOM so the card has something to flip to, so both are
        aria-hidden and the button carries the name — otherwise a screen reader would
        read the answer off the back face before it was revealed. Under
        prefers-reduced-motion the flip collapses to an instant swap.
      </p>
    </div>
  )
}

/**
 * A quiz card in both states, built from a FIXED question rather than a random
 * one so the styleguide does not change shape on every visit.
 */
function QuizDemo() {
  const all = allCharacters(DEFAULT_CHARACTER_SET)
  const answer = all.find((c) => c.romaji === 'ni') ?? all[0]
  // A constant rng: deterministic layout, and it still exercises the real
  // question builder rather than a hand-written fake.
  const question = answer ? buildQuestion(answer, all, all, () => 0.42) : null
  const [chosen, setChosen] = useState<Character | null>(null)
  if (!question) return null

  return (
    <div className="flex flex-col gap-4">
      <QuizCard
        question={question}
        chosen={chosen}
        onChoose={setChosen}
        onNext={() => {
          setChosen(null)
        }}
        isLast={false}
      />
      <p className="m-0 max-w-prose text-sm text-ink-2">
        Answer it to see the feedback state. Right and wrong are separated by lightness,
        and each carries a word and a mark — colour is never the only channel. Semantic
        colour is an outline and text, never a fill.
      </p>
    </div>
  )
}

/** The real control, resolving against whatever voices this device has. */
function LivePronunciation() {
  const { status, speak } = usePronunciation()
  return (
    <div className="flex items-center gap-3">
      <SpeakButton subject={speakable(SAMPLE)} status={status} onSpeak={speak} />
      <Label>status: {status}</Label>
    </div>
  )
}

/** Live, because a picker that cannot be pressed shows nothing worth seeing. */
function PickerDemo() {
  const [id, setId] = useState<ScriptId>(DEFAULT_CHARACTER_SET.id)
  return (
    <SetPicker sets={CHARACTER_SETS} activeId={id} onChange={setId} label="Chart" />
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
                subject={speakable(SAMPLE)}
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

      <Section title="Flashcard">
        <FlashcardDemo />
      </Section>

      <Section title="Vocabulary card">
        <VocabCardDemo />
      </Section>

      <Section title="Vocabulary quiz card">
        <VocabQuizCardDemo />
      </Section>

      <Section title="Numbers card">
        <NumberCardDemo />
      </Section>

      <Section title="Cloze card">
        <ClozeCardDemo />
      </Section>

      <Section title="Quiz card">
        <QuizDemo />
      </Section>

      <Section title="Empty deck">
        <EmptyDeck activity="study" />
        <p className="m-0 max-w-prose text-sm text-ink-2">
          A primary screen, not an edge case: nothing persists between sessions by
          design, so every refresh lands here.
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

      <Section title="Sound cell">
        <div className="grid max-w-xs grid-cols-4 gap-1.5">
          <SoundCell character={SAMPLE} active={false} onPlay={() => undefined} />
          <SoundCell character={SAMPLE} active onPlay={() => undefined} />
        </div>
        <p className="m-0 max-w-prose text-sm text-ink-2">
          At rest and last-played. It is an action, not a toggle, so it carries no
          <code> aria-pressed</code> — and it is never disabled, because a tap still
          reveals the reading on a device with no Japanese voice.
        </p>
      </Section>

      <Section title="Set picker">
        <PickerDemo />
        <p className="m-0 max-w-prose text-sm text-ink-2">
          Which chart is on screen. It takes the registry and reports an id, so it never
          names a script and never knows how many there are &mdash; with a single set
          registered it renders nothing at all, because a picker offering one choice is
          furniture. The pressed state is the same ground-on-accent inversion a selected
          cell uses: the picker and the chart under it are saying the same thing.
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
