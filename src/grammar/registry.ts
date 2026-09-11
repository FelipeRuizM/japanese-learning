import type { ClozeItem } from '../types/grammar'
import { WEEK1_CLOZE } from './week1'

/**
 * THE GRAMMAR REGISTRY (CLAUDE.md §11.7).
 *
 * The same rule the other two data layers follow: a new week is a data module
 * and one entry here. Flatter than the vocabulary registry on purpose — grammar
 * patterns have no groups to shape a screen with, and the `topic` field already
 * says which point a sentence exercises.
 */
export const CLOZE_ITEMS: readonly ClozeItem[] = [...WEEK1_CLOZE]

export function clozeItemById(id: string): ClozeItem | undefined {
  return CLOZE_ITEMS.find((item) => item.id === id)
}
