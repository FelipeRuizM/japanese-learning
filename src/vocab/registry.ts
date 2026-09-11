import type { Speakable } from '../lib/pronunciation'
import type { VocabEntry, VocabItem, VocabSet } from '../types/vocab'
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

/**
 * Every item in a set, each tagged with the group it came from.
 *
 * `allVocab` is the right call when only the words matter; this one is for the
 * two places that also need the group — the card's reveal and the quiz's
 * first distractor tier.
 */
export function vocabEntries(set: VocabSet): VocabEntry[] {
  return set.groups.flatMap((group) =>
    group.items.map((item) => ({
      item,
      groupId: `${set.id}/${group.id}`,
      groupLabel: group.label,
    })),
  )
}

/** Every tagged entry across every registered set. */
export function everyVocabEntry(): VocabEntry[] {
  return VOCAB_SETS.flatMap(vocabEntries)
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

/**
 * How a vocabulary item participates in pronunciation (CLAUDE.md §4.2).
 *
 * The KANA, never the romaji — and never the English, which a Japanese voice
 * would mangle just as badly. No item carries a recording yet, so there is no
 * `audio` to pass on; the field exists on `Speakable` for the day one does.
 */
export function speakable(item: VocabItem): Speakable {
  return { ja: item.kana }
}
