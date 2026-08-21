import type { Character, CharacterSet } from '../types/characters'
import { HIRAGANA } from './hiragana'
import { KATAKANA } from './katakana'

/**
 * THE CHARACTER-SET REGISTRY (CLAUDE.md §1).
 *
 * The grid, the flashcards and the quiz iterate this list and consume a
 * `CharacterSet`. They must never import a script data module and must never
 * name a script — a test enforces that boundary.
 *
 * Katakana arrived exactly as promised — a data module and one entry here, with
 * no change to a component, a type or the grid. Adding kanji means the same
 * plus the `layout: 'flow'` branch the grid already has.
 *
 * Do NOT over-abstract past this. A registry plus concrete data. No plugin
 * framework, no generic schema engine.
 */
export const CHARACTER_SETS: readonly CharacterSet[] = [HIRAGANA, KATAKANA]

/**
 * The set a viewer sees when they haven't chosen one.
 *
 * It is the FIRST registered set rather than a named one, so the pages that
 * open on it stay script-agnostic. There is a picker now, and its state is
 * per-page: the deck is the thing worth carrying between screens, and it does.
 */
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
