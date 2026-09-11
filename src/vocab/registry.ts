import type { VocabItem, VocabSet } from '../types/vocab'
import { WEEK1_GREETINGS } from './week1Greetings'
import { WEEK1_INTRODUCTION } from './week1Introduction'
import { WEEK1_NOUNS } from './week1Nouns'

/**
 * THE VOCABULARY REGISTRY (CLAUDE.md §11).
 *
 * The same rule the character sets follow, for the same reason: a new week is
 * a data module and one entry here. Nothing that renders vocabulary may import
 * a week's module or name a week — they iterate this list.
 *
 * Sets are listed in the order they should be studied, and the order is the
 * order of the class notes: what was said in the room first comes first.
 */
export const VOCAB_SETS: readonly VocabSet[] = [
  WEEK1_GREETINGS,
  WEEK1_INTRODUCTION,
  WEEK1_NOUNS,
]

export function vocabSetById(id: string): VocabSet | undefined {
  return VOCAB_SETS.find((set) => set.id === id)
}

/**
 * Every item in a set, in study order, with the group structure flattened.
 *
 * Groups exist to shape the SCREEN — they are headings on a list. Anything that
 * just wants "the words" (a deck, a shuffle, a quiz) uses this.
 */
export function allVocab(set: VocabSet): VocabItem[] {
  return set.groups.flatMap((group) => group.items)
}

/** Every item across every registered set. */
export function everyVocabItem(): VocabItem[] {
  return VOCAB_SETS.flatMap(allVocab)
}

/**
 * Resolve an id back to its item. A deck stores ids, so this is what turns a
 * selection into something renderable.
 */
export function vocabItemById(id: string): VocabItem | undefined {
  return everyVocabItem().find((item) => item.id === id)
}
