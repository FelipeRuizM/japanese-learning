import { useCallback, useMemo, useState } from 'react'
import type { Character } from '../types/characters'
import {
  characterById,
  characterSetById,
  everyCharacter,
  speakable,
} from '../characters/registry'
import type { Speakable } from '../lib/pronunciation'
import { useDeck } from '../data/useDeck'
import { systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote, SpeakButton } from '../components/SpeakButton'
import { Link } from 'react-router-dom'
import { Button, Glyph, Label } from '../components/ui/primitives'
import { PATHS } from '../routes'

/**
 * Writing practice — dictation, essentially.
 *
 * Hear a character, read its romaji, then write the kana **on paper**. The app
 * deliberately does not capture the answer: recognising a shape and producing
 * one are different skills, and producing it is the one a keyboard cannot
 * exercise. So the only thing this screen owes you is an honest reveal to check
 * against.
 *
 * **The glyph must not be on screen before the reveal.** That is the entire
 * exercise — showing it, even faintly, turns writing practice into copying.
 */
export function Writing() {
  const deck = useDeck()
  const { status, speak } = usePronunciation()

  /**
   * The deck when there is one, the whole set otherwise.
   *
   * Flashcards and the quiz require a selection because they walk it start to
   * finish. This one is a tap-and-go drill, and demanding a trip to the grid
   * before the first sound would be friction for no gain — but a selection, if
   * you have made one, is clearly what you want to practise. The pool is named
   * on screen so the behaviour is stated rather than guessed at.
   */
  const wholeSet = useMemo(() => everyCharacter(), [])
  const pool = useMemo(() => {
    const selected = [...deck.selected]
      .map((id) => characterById(id))
      .filter((c) => c !== undefined)
    return selected.length > 0 ? selected : wholeSet
  }, [deck.selected, wholeSet])

  const [current, setCurrent] = useState<Character | null>(null)
  const [revealed, setRevealed] = useState(false)

  const next = useCallback(() => {
    // Avoid repeating the character already on screen — drawing the same one
    // twice in a row reads as a broken button.
    const candidates =
      pool.length > 1 && current ? pool.filter((c) => c.id !== current.id) : pool
    const picked = candidates[Math.floor(systemRng() * candidates.length)]
    if (!picked) return

    setCurrent(picked)
    setRevealed(false)
    speak(speakable(picked))
  }, [pool, current, speak])

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Label>Writing practice</Label>
        <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
          Hear it, then write it
        </h2>
        <p className="m-0 max-w-prose text-ink-1">
          Play a sound, write the character by hand, then reveal it to check yourself.
        </p>
        <PoolNote count={pool.length} usingDeck={deck.count > 0} />
        <PronunciationNote status={status} />
      </header>

      {current === null ? (
        <Button variant="primary" onClick={next} className="self-start">
          Play a random sound
        </Button>
      ) : (
        <Prompt
          character={current}
          revealed={revealed}
          status={status}
          onReplay={speak}
          onReveal={() => {
            setRevealed(true)
          }}
          onNext={next}
        />
      )}
    </section>
  )
}

/**
 * The name of the chart a character belongs to. It falls back to the plain
 * prompt rather than throwing: an unregistered script is a data problem, and it
 * should not take the exercise down with it.
 */
function setLabelFor(character: Character): string {
  return characterSetById(character.script)?.label ?? 'the chart'
}

function PoolNote({ count, usingDeck }: { count: number; usingDeck: boolean }) {
  return (
    <p className="m-0 font-sans text-sm text-ink-2">
      {usingDeck ? (
        <>Drawing from the {count} characters you selected.</>
      ) : (
        <>
          Drawing from all {count} characters —{' '}
          <Link
            to={PATHS.characters}
            className="text-accent underline underline-offset-4"
          >
            pick some
          </Link>{' '}
          to narrow it down.
        </>
      )}
    </p>
  )
}

function Prompt({
  character,
  revealed,
  status,
  onReplay,
  onReveal,
  onNext,
}: {
  character: Character
  revealed: boolean
  status: ReturnType<typeof usePronunciation>['status']
  onReplay: (subject: Speakable) => void
  onReveal: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-md border border-rule py-10">
        {/* The prompt, and the whole prompt, is the live region: the SCRIPT
            changes from one sound to the next just as the reading does, and a
            reading announced without it would be half a question. */}
        <div aria-live="polite" className="flex flex-col items-center gap-4">
          {/* WHICH SCRIPT, not just which sound. With one chart registered "a"
              was unambiguous; with two, あ and ア are the same sound and a
              learner told only "a" cannot know which shape to draw. The name
              comes from the character's own set, so a third script needs
              nothing here. */}
          <Label>Write this in {setLabelFor(character)}</Label>
          {/* The romaji is the prompt. The glyph is the answer, and it is not
              rendered at all until the reveal — not hidden with CSS, which
              would leave it in the DOM for a screen reader to read out. */}
          <p className="m-0 font-sans text-6xl font-semibold text-ink-0">
            {character.romaji}
          </p>
        </div>
        {/* The default accessible name of this control names the glyph, which
            would put the answer in the DOM. Here it says what it does. */}
        <SpeakButton
          subject={speakable(character)}
          status={status}
          onSpeak={onReplay}
          label="Play the sound again"
        />
      </div>

      {revealed ? (
        <div className="flex flex-col gap-4 border-l-2 border-accent pl-4">
          <Label>You should have written</Label>
          <div className="flex flex-wrap items-center gap-6">
            <Glyph size="lg">{character.glyph}</Glyph>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {character.examples.map((example) => (
                <li
                  key={example.kana}
                  className="flex flex-wrap items-baseline gap-x-3"
                >
                  <Glyph size="sm">{example.kana}</Glyph>
                  <span className="font-sans text-ink-1">{example.romaji}</span>
                  <span className="font-sans text-ink-2">{example.english}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <Button onClick={onReveal} className="self-start">
          Show the character
        </Button>
      )}

      <Button variant="primary" onClick={onNext} className="self-start">
        Next sound
      </Button>
    </div>
  )
}
