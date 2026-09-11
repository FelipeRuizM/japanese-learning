import type { VocabItem } from '../types/vocab'
import type { Speakable } from '../lib/pronunciation'
import type { PronunciationStatus } from '../lib/usePronunciation'
import { speakable } from '../vocab/registry'
import { SpeakButton } from './SpeakButton'
import { Glyph, Label } from './ui/primitives'

/**
 * One vocabulary card: the kana on the front, the meaning on the back.
 *
 * The sibling of `Flashcard`, and deliberately NOT a generalisation of it. The
 * two differ in what the back face has to carry — a character reveals a
 * reading, a word reveals a reading AND a meaning — and in how big the front
 * can be set: ごちそうさまでした at `Glyph size="lg"` overflows a 375px card,
 * while か at anything smaller is pointless. Merging them would mean a
 * component branching on which model it was handed, which is a worse thing to
 * own than two short components that each do one job.
 *
 * EVERYTHING LOAD-BEARING ABOUT `Flashcard` APPLIES HERE UNCHANGED, and the
 * reasons are written out there in full:
 *
 *   - both faces are in the DOM at once, so both are `aria-hidden` and the
 *     button carries a name that gives the answer only once revealed;
 *   - `backface-visibility: hidden` covers sighted users;
 *   - THE `key` IS NOT A LIST KEY. Advancing from a revealed card changes the
 *     item and clears `revealed` in one render, and on a single node the
 *     browser animates `rotateY(180deg) → 0deg` with the NEXT card's back face
 *     turned toward the viewer for half the rotation. Keying on the item mounts
 *     a fresh node with nothing to interpolate from, so there is nothing to
 *     glimpse. A flip of the same card keeps its key and still animates.
 */
export function VocabCard({
  item,
  group,
  revealed,
  onFlip,
  pronunciationStatus,
  onSpeak,
}: {
  item: VocabItem
  /** The group this card came from — shown only after the reveal, see below. */
  group: string
  revealed: boolean
  onFlip: () => void
  pronunciationStatus: PronunciationStatus
  onSpeak: (subject: Speakable) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div style={{ perspective: '1200px' }}>
        <button
          key={item.id}
          type="button"
          onClick={onFlip}
          aria-expanded={revealed}
          aria-label={
            revealed
              ? `${item.kana} is "${item.romaji}" — ${item.english}. Hide the meaning.`
              : `Show the meaning of ${item.kana}`
          }
          className="relative block min-h-64 w-full cursor-pointer transition-transform duration-300"
          style={{
            transformStyle: 'preserve-3d',
            transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-md border border-rule px-4 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Glyph size="md">{item.kana}</Glyph>
          </span>

          <span
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md border border-accent bg-sunken px-4 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <Glyph size="sm">{item.kana}</Glyph>
            <span className="font-sans text-3xl font-semibold text-ink-0">
              {item.romaji}
            </span>
            <span className="font-sans text-xl text-ink-1">{item.english}</span>
          </span>
        </button>
      </div>

      {/*
        Below the card, not on its back face: a button cannot contain another
        button, and the replay control has to be a real one.

        THE GROUP LABEL IS HERE RATHER THAN ON THE FRONT for the same reason the
        reading is. "Meals" narrows いただきます to one of two, and "Leaving &
        returning home" narrows ただいま to one of four — a category shown next
        to a prompt is a hint, and this screen is not supposed to give hints.
        After the reveal it is context, which is what it was always for.
      */}
      {revealed && (
        <div className="flex flex-col gap-4 border-l-2 border-accent pl-4">
          <div className="flex items-center gap-3">
            <SpeakButton
              subject={speakable(item)}
              status={pronunciationStatus}
              onSpeak={onSpeak}
            />
            <Label>Play again</Label>
          </div>

          <div className="flex flex-col gap-1">
            <Label>{group}</Label>
            {item.note !== undefined && (
              <p className="m-0 font-sans text-ink-1">{item.note}</p>
            )}
          </div>

          {item.example !== undefined && (
            <div className="flex flex-col gap-2">
              <Label>In a sentence</Label>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <Glyph size="sm">{item.example.kana}</Glyph>
                <span className="font-sans text-lg text-ink-0">
                  {item.example.romaji}
                </span>
                <span className="font-sans text-ink-2">{item.example.english}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
