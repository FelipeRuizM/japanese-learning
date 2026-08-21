import { useState } from 'react'
import type { CharacterSet, ScriptId } from '../types/characters'
import { characterSetById, DEFAULT_CHARACTER_SET } from '../characters/registry'

export type CharacterSetChoice = {
  set: CharacterSet
  choose: (id: ScriptId) => void
}

/**
 * Which chart the viewer is looking at.
 *
 * PER PAGE, deliberately. The deck is the thing worth carrying between screens
 * and it does — it lives in the one context the app has (CLAUDE.md §2, §5).
 * Which chart you last had open is not state worth a second context or a
 * storage key, and the deck already crosses scripts, so nothing is lost by
 * landing back on the first chart: what you selected is still selected.
 *
 * The resolve-with-fallback lives here rather than in each page, so an id that
 * no longer resolves — a set removed from the registry — degrades to the
 * default instead of blanking the page.
 */
export function useCharacterSet(): CharacterSetChoice {
  const [id, choose] = useState<ScriptId>(DEFAULT_CHARACTER_SET.id)
  return { set: characterSetById(id) ?? DEFAULT_CHARACTER_SET, choose }
}
