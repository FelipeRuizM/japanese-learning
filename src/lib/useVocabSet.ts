import { useState } from 'react'
import type { VocabSet } from '../types/vocab'
import { VOCAB_SETS, vocabSetById } from '../vocab/registry'

export type VocabSetChoice = {
  set: VocabSet | null
  choose: (id: string) => void
}

/**
 * Which vocabulary set the viewer is working through.
 *
 * PER PAGE, for the same reason `useCharacterSet` is (CLAUDE.md §5): the app
 * has one context and the deck has it. Which set you last opened is not worth
 * a second one.
 *
 * Returns `null` when the registry is empty rather than inventing a set. That
 * cannot happen today — a test asserts at least one is registered — but the
 * alternative is a non-null assertion, and a page that renders an empty state
 * is cheaper than one that throws.
 */
export function useVocabSet(): VocabSetChoice {
  const first = VOCAB_SETS[0]
  const [id, choose] = useState<string>(first?.id ?? '')
  return { set: vocabSetById(id) ?? first ?? null, choose }
}
