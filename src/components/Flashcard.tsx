import type { Character } from '../types/characters'
import type { Speakable } from '../lib/pronunciation'
import type { PronunciationStatus } from '../lib/usePronunciation'
import { speakable } from '../characters/registry'
import { SpeakButton } from './SpeakButton'
import { Glyph, Label } from './ui/primitives'

/**
 * One card: the glyph on the front, the reading on the back.
 *
 * THE FLIP IS FUNCTIONAL MOTION, not decoration (CLAUDE.md §7) — it is what
 * shows that the two faces are two sides of one thing rather than two separate
 * screens. The global `prefers-reduced-motion` rule in index.css collapses the
 * transition to an instant swap, so nothing here needs to check for it.
 *
 * Both faces live in the DOM at once, because a flip needs something to flip
 * to. That means the answer is present before it is revealed, so:
 *
 *   - sighted users are covered by `backface-visibility: hidden`, and
 *   - both faces are `aria-hidden`, with the button carrying an explicit label
 *     that names the reading only once it has been revealed. Otherwise a screen
 *     reader would read the answer straight off the back face and there would
 *     be nothing left to practise.
 *
 * THE `key` ON THE CARD IS LOAD-BEARING, AND IT IS NOT A LIST KEY.
 *
 * Advancing from a REVEALED card changes two things in one render: the
 * character, and `revealed` back to false. Without the key those land on the
 * same DOM node, so the browser dutifully animates `rotateY(180deg) → 0deg` —
 * and for the 300ms that rotation is past the halfway point, the face turned
 * toward the viewer is the BACK of the card now holding the NEXT character.
 * The next answer was legible in the wobble, which is the one thing this screen
 * must never show.
 *
 * Keying on the character mounts a NEW element instead, already at 0deg. A
 * transition needs a previous value on the same node to interpolate from, and a
 * freshly mounted node has none — so there is nothing to animate and nothing to
 * glimpse. Flipping the SAME card keeps the same key, so a real flip still
 * animates.
 *
 * It lives here rather than at the call site because it is an invariant of the
 * flip, not a detail of who renders it: a caller cannot be relied on to
 * remember a key that looks decorative and is not.
 */
export function Flashcard({
  character,
  revealed,
  onFlip,
  pronunciationStatus,
  onSpeak,
}: {
  character: Character
  revealed: boolean
  onFlip: () => void
  pronunciationStatus: PronunciationStatus
  onSpeak: (subject: Speakable) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div style={{ perspective: '1200px' }}>
        <button
          key={character.id}
          type="button"
          onClick={onFlip}
          aria-expanded={revealed}
          aria-label={
            revealed
              ? `${character.glyph} is "${character.romaji}". Hide the reading.`
              : `Show the reading for ${character.glyph}`
          }
          className="relative block min-h-64 w-full cursor-pointer transition-transform duration-300"
          style={{
            transformStyle: 'preserve-3d',
            transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-md border border-rule"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Glyph size="lg">{character.glyph}</Glyph>
          </span>

          <span
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md border border-accent bg-sunken"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <Glyph size="md">{character.glyph}</Glyph>
            <span className="font-sans text-4xl font-semibold text-ink-0">
              {character.romaji}
            </span>
          </span>
        </button>
      </div>

      {/*
        The example words and the replay control sit BELOW the card rather than
        on its back face: a button cannot contain another button, and the replay
        control has to be a real one.
      */}
      {revealed && (
        <div className="flex flex-col gap-4 border-l-2 border-accent pl-4">
          <div className="flex items-center gap-3">
            <SpeakButton
              subject={speakable(character)}
              status={pronunciationStatus}
              onSpeak={onSpeak}
            />
            <Label>Play again</Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Used in</Label>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {character.examples.map((example) => (
                <li
                  key={example.kana}
                  className="flex flex-wrap items-baseline gap-x-3"
                >
                  <Glyph size="sm">{example.kana}</Glyph>
                  <span className="font-sans text-lg text-ink-0">{example.romaji}</span>
                  <span className="font-sans text-ink-2">{example.english}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
