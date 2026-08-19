import type { Character, CharacterSet } from '../types/characters'
import { HIRAGANA } from './hiragana'

/**
 * THE CHARACTER-SET REGISTRY (CLAUDE.md §1).
 *
 * The grid, the flashcards and the quiz iterate this list and consume a
 * `CharacterSet`. They must never import a script data module and must never
 * name a script — a test enforces that boundary.
 *
 * Adding katakana later means adding a data module and one entry here. Adding
 * kanji means that plus the `layout: 'flow'` branch the grid already has.
 *
 * Do NOT over-abstract past this. A registry plus concrete data. No plugin
 * framework, no generic schema engine.
 */
export const CHARACTER_SETS: readonly CharacterSet[] = [HIRAGANA]

/** The set a viewer sees when they haven't chosen one. */
export const DEFAULT_CHARACTER_SET: CharacterSet = HIRAGANA

export function characterSetById(id: string): CharacterSet | undefined {
  return CHARACTER_SETS.find((set) => set.id === id)
}

/**
 * Every character in a set, in reading order, with the gaps dropped.
 *
 * Gaps are dropped HERE and only here — the grid needs them to lay the chart
 * out, so it walks `rows` itself. Anything that just wants "the characters"
 * (the deck, the quiz, the flashcards) uses this.
 */
export function allCharacters(set: CharacterSet): Character[] {
  return set.rows.flatMap((row) => row.cells.filter((cell) => cell !== null))
}

/** Every character across every registered set. */
export function everyCharacter(): Character[] {
  return CHARACTER_SETS.flatMap(allCharacters)
}

/**
 * Resolve an id back to its character. The deck stores ids, so this is what
 * turns a selection into something renderable.
 */
export function characterById(id: string): Character | undefined {
  return everyCharacter().find((character) => character.id === id)
}
