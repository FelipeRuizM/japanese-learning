import type { Character } from '../types/characters'
import { Glyph } from './ui/primitives'

/**
 * A character in the pronunciation chart. Tapping it plays the sound.
 *
 * Not a `GridCell`: that one is a toggle carrying `aria-pressed`, and this one
 * performs an action. Announcing "pressed" for something that plays a sound and
 * returns to rest would be a lie about what the control is.
 *
 * `active` marks the most recent tap, so a tap is visibly acknowledged even
 * when no sound comes out — which is the whole no-Japanese-voice case.
 *
 * It is never disabled, deliberately. Without a voice a tap still echoes the
 * character, its reading and an example word below the chart, so the control
 * always does something (CLAUDE.md §4.2 — the reveal never depends on audio).
 */
export function SoundCell({
  character,
  active,
  onPlay,
}: {
  character: Character
  active: boolean
  onPlay: (character: Character) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(character)}
      // Opens with the visible text, so the accessible name matches what a
      // voice-control user can read (the Phase 7 lesson).
      aria-label={`${character.glyph} ${character.romaji}, play`}
      className={[
        'flex w-full min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5',
        'rounded-md border px-1 py-2 transition-colors',
        active
          ? 'border-accent bg-accent text-ground'
          : 'border-rule bg-transparent text-ink-0 hover:bg-accent-soft',
      ].join(' ')}
    >
      <Glyph size="sm">{character.glyph}</Glyph>
      {/* A real space, so the accessible name is "か ka" and not "かka". */}{' '}
      <span
        className={[
          'font-sans text-label tracking-[0.08em]',
          active ? 'text-ground' : 'text-ink-2',
        ].join(' ')}
      >
        {character.romaji}
      </span>
    </button>
  )
}
