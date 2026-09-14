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
 * Kana, plus the two marks that legitimately appear in a vocabulary entry: the
 * wave dash 〜 that stands in for the missing half of a suffix, and the
 * prolonged sound mark ー inside a loanword. Week 1 uses neither — it writes
 * its suffixes bare, as the class note does — but a later week will.
 */
const KANA_ONLY = /^[ぁ-ゟ゠-ヿ〜]+$/u

/**
 * As written in class: plain Latin letters, spaces between words, hyphens for
 * suffixes. No macrons — the class doubles its long vowels (`ohayoo`), and a
 * macron here would mean someone "corrected" it into Hepburn (§11.2).
 *
 * A capital is allowed because the note capitalises a proper noun (`Kankoku`),
 * and the rule is to follow the note. It is a narrow widening: the guard exists
 * to catch macrons and Chinese characters, and it still catches both.
 */
const CLASS_ROMAJI = /^[A-Za-z\- ]+$/

/**
 * Any Chinese character, anywhere a learner reads.
 *
 * The rule that there is no field for the written form (§11.2) is easy to obey
 * in `kana` and easy to forget in `note`, because a note is free text and the
 * class note's own Notes column carries "Kanji: 医者". Transcribed as-is, that
 * puts on a card the exact thing this app has no business showing a beginner.
 */
const IDEOGRAPH = /[\u3400-\u4dbf\u4e00-\u9fff]/u

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

    it('puts no Chinese characters in a note or a meaning either', () => {
      for (const item of items) {
        expect(item.english, `${item.id} meaning`).not.toMatch(IDEOGRAPH)
        if (item.note === undefined) continue
        expect(item.note, `${item.id} note`).not.toMatch(IDEOGRAPH)
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
   * TWO ITEMS REALLY DO SHARE A MEANING, and it is not a typo: the class note
   * glosses both いただきます and ごちそうさまでした as "Thank you for the
   * food". They are distinguished by WHEN they are said, which is what each
   * one's note carries — not by what they mean.
   *
   * This is the vocabulary version of the お/を collision (§6). A question
   * reading "which one means Thank you for the food?" has two correct answers,
   * so the pair may never be options in the same question — and the quiz must
   * not discover that on screen. Pinning the list here means a NEW collision,
   * from a week typed in later, fails this test instead.
   */
  const KNOWN_SHARED_MEANINGS = ['Thank you for the food']

  it('is exactly the list the quiz will have to exclude', () => {
    const english = everyVocabItem().map((item: VocabItem) => item.english)
    const shared = [...new Set(english.filter((e, i) => english.indexOf(e) !== i))]

    expect(shared.sort()).toEqual([...KNOWN_SHARED_MEANINGS].sort())
  })
})
