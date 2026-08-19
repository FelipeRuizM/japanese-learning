import type { Character } from '../types/characters'
import type { PronunciationStatus } from '../lib/usePronunciation'
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
  onSpeak: (character: Character) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div style={{ perspective: '1200px' }}>
        <button
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
              character={character}
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
