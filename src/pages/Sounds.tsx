import { useState } from 'react'
import type { Character } from '../types/characters'
import { DEFAULT_CHARACTER_SET } from '../characters/registry'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote, SpeakButton } from '../components/SpeakButton'
import { GridLayout } from '../components/GridLayout'
import { SoundCell } from '../components/SoundCell'
import { Glyph, Label } from '../components/ui/primitives'

/**
 * The pronunciation chart: tap any character, hear it.
 *
 * It reads the WHOLE set rather than the deck. This is a reference you dip
 * into, not a drill — gating it behind a selection would make the obvious
 * question ("what does this one sound like?") take three steps.
 *
 * Because the entire point is sound, the no-Japanese-voice case cannot just be
 * silence: the tapped character is echoed below the chart with its reading and
 * an example word, so a tap always tells you something (CLAUDE.md §4.2 — the
 * reveal never depends on audio).
 */
export function Sounds() {
  const set = DEFAULT_CHARACTER_SET
  const { status, speak } = usePronunciation()
  const [lastPlayed, setLastPlayed] = useState<Character | null>(null)

  const play = (character: Character) => {
    setLastPlayed(character)
    speak(character)
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Label>{set.label}</Label>
        <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
          Tap a character to hear it
        </h2>
        <PronunciationNote status={status} />
      </header>

      <GridLayout
        set={set}
        renderRowLabel={(row) => (
          // Not a control here. In the deck selector the row label selects the
          // row; there is nothing equivalent to do on a reference chart, and a
          // button that does nothing is worse than a label.
          <span className="flex items-center justify-center px-0.5 text-center font-sans text-label leading-tight tracking-[0.08em] text-ink-2 uppercase">
            {set.layout === 'matrix' ? row.label.replace('-row', '') : row.label}
          </span>
        )}
        renderCell={(character) => (
          <SoundCell
            character={character}
            active={lastPlayed?.id === character.id}
            onPlay={play}
          />
        )}
      />

      {lastPlayed && (
        <NowPlaying character={lastPlayed} status={status} onSpeak={speak} />
      )}
    </section>
  )
}

/**
 * What was last tapped. `aria-live` so a screen reader hears the reading, which
 * matters most on the devices where the audio itself will not play.
 */
function NowPlaying({
  character,
  status,
  onSpeak,
}: {
  character: Character
  status: ReturnType<typeof usePronunciation>['status']
  onSpeak: (character: Character) => void
}) {
  return (
    <div aria-live="polite" className="flex flex-col gap-3 border-t border-rule pt-5">
      <div className="flex flex-wrap items-center gap-4">
        <Glyph size="md">{character.glyph}</Glyph>
        <span className="font-sans text-3xl font-semibold text-ink-0">
          {character.romaji}
        </span>
        <SpeakButton character={character} status={status} onSpeak={onSpeak} />
      </div>

      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {character.examples.map((example) => (
          <li key={example.kana} className="flex flex-wrap items-baseline gap-x-3">
            <Glyph size="sm">{example.kana}</Glyph>
            <span className="font-sans text-ink-1">{example.romaji}</span>
            <span className="font-sans text-ink-2">{example.english}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
