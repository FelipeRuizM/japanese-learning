import { describe, expect, it } from 'vitest'

import type { VocabItem, VocabSet } from '../types/vocab'
import {
  VOCAB_SETS,
  allVocab,
  everyVocabItem,
  vocabItemById,
  vocabSetById,
} from './registry'

/**
 * The vocabulary data-integrity set (CLAUDE.md §11).
 *
 * These are transcriptions of course notes, typed by hand, and a typo in one is
 * silent — a card simply teaches the wrong thing. So the shape is asserted
 * rather than trusted, exactly as the character sets are.
 */

/**
 * Kana, plus the two marks that legitimately appear in a vocabulary entry:
 * the wave dash 〜 that stands in for the missing half of a suffix (〜じん),
 * and the prolonged sound mark ー inside a loanword.
 */
const KANA_ONLY = /^[ぁ-ゟ゠-ヿ〜]+$/u

/** As written in class: lowercase, spaces between words, hyphens for suffixes. */
const CLASS_ROMAJI = /^[a-z\- ]+$/

describe('the vocabulary registry', () => {
  it('registers at least one set, each distinctly identified and labelled', () => {
    expect(VOCAB_SETS.length).toBeGreaterThan(0)

    const ids = VOCAB_SETS.map((set) => set.id)
    const labels = VOCAB_SETS.map((set) => set.label)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('cites a source note for every set', () => {
    // A card that looks wrong has to be checkable against the class note it
    // came from. An uncited set is an invented one.
    for (const set of VOCAB_SETS) {
      expect(set.source.trim(), `${set.id} has no source`).not.toBe('')
    }
  })

  it('gives every item an id that is unique across every set at once', () => {
    const ids = everyVocabItem().map((item) => item.id)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)

    expect(
      duplicates,
      'a decks stores ids, so a collision silently merges two cards',
    ).toEqual([])
  })

  it('resolves a set and an item back from an id', () => {
    const first = VOCAB_SETS[0]
    expect(first).toBeDefined()
    if (first === undefined) return

    expect(vocabSetById(first.id)).toBe(first)
    expect(vocabSetById('no-such-set')).toBeUndefined()

    const item = allVocab(first)[0]
    expect(item).toBeDefined()
    if (item === undefined) return

    expect(vocabItemById(item.id)).toBe(item)
    expect(vocabItemById('no:such:item')).toBeUndefined()
  })
})

describe.each(VOCAB_SETS.map((set): [string, VocabSet] => [set.label, set]))(
  'vocabulary set: %s',
  (_label, set) => {
    const items = allVocab(set)

    it('has groups, and no group is empty', () => {
      expect(set.groups.length).toBeGreaterThan(0)
      for (const group of set.groups) {
        expect(group.items.length, `${group.id} is empty`).toBeGreaterThan(0)
        expect(group.label.trim()).not.toBe('')
      }
    })

    it('gives every group a distinct id within the set', () => {
      const ids = set.groups.map((group) => group.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('writes every entry in kana, with no Chinese characters', () => {
      // The app teaches kana and Week 1 is taught in kana. A 学 on a card is a
      // card a beginner cannot read (§3.4, and §11 for why there is no field
      // for the written form).
      for (const item of items) {
        expect(item.kana, `${item.id}: "${item.kana}"`).toMatch(KANA_ONLY)
      }
    })

    it('writes every example sentence in kana too', () => {
      for (const item of items) {
        if (item.example === undefined) continue
        expect(item.example.kana, `${item.id} example`).toMatch(KANA_ONLY)
      }
    })

    it('spells romaji the way the class spells it', () => {
      for (const item of items) {
        expect(item.romaji, `${item.id}: "${item.romaji}"`).toMatch(CLASS_ROMAJI)
        if (item.example === undefined) continue
        expect(item.example.romaji, `${item.id} example`).toMatch(CLASS_ROMAJI)
      }
    })

    it('gives every item a meaning, and every example a full set of parts', () => {
      for (const item of items) {
        expect(item.english.trim(), `${item.id} has no meaning`).not.toBe('')
        expect(item.kana.trim()).not.toBe('')

        if (item.note !== undefined) {
          expect(item.note.trim(), `${item.id} has an empty note`).not.toBe('')
        }
        if (item.example !== undefined) {
          expect(item.example.english.trim(), `${item.id} example`).not.toBe('')
        }
      }
    })

    it('never writes the same kana twice', () => {
      const kana = items.map((item) => item.kana)
      const duplicates = kana.filter((k, index) => kana.indexOf(k) !== index)
      expect(duplicates).toEqual([])
    })
  },
)

describe('meanings that more than one item shares', () => {
  /**
   * TWO ITEMS REALLY DO SHARE A MEANING, and both pairs are a casual/polite
   * distinction rather than a typo: おはよう / おはようございます, and
   * ありがとう / ありがとうございます.
   *
   * This is the vocabulary version of the お/を collision (§6). A quiz asking
   * "which one means Good morning?" has two correct answers, so the pair may
   * never be options in the same question — and a quiz built later must not
   * discover that on screen. Pinning the list here means a NEW collision, from
   * a week typed in later, fails this test instead.
   */
  const KNOWN_SHARED_MEANINGS = ['Good morning', 'Thank you']

  it('is exactly the list the quiz will have to exclude', () => {
    const english = everyVocabItem().map((item: VocabItem) => item.english)
    const shared = [...new Set(english.filter((e, i) => english.indexOf(e) !== i))]

    expect(shared.sort()).toEqual([...KNOWN_SHARED_MEANINGS].sort())
  })
})
