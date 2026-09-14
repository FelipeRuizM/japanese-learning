/**
 * The vocabulary model (CLAUDE.md §11).
 *
 * This is deliberately NOT the character model. A character is a glyph with a
 * position in a chart — a row, a vowel column, a set of example words that
 * contain it. A vocabulary item is a word or a phrase with a meaning, and it
 * has no chart to sit in. Forcing one through `Character` would mean `glyph`
 * holding a whole sentence, the meaning smuggled into `examples[0].english`,
 * and three data-integrity tests loosened to let it through.
 *
 * So: a parallel model, under the same rule the character sets follow — a data
 * module plus one registry entry is the whole cost of a new week.
 *
 * Note there is no field for a written form in Chinese characters. Week 1 is
 * taught in kana and the app teaches kana, so every item is kana. Adding that
 * field later is a real decision, not a detail: the leak test forbids naming a
 * script outside the character data layer, and a field named for one would have
 * to widen that guard deliberately rather than as a side effect.
 */

export type VocabExample = {
  /** Kana only, for the same reason character examples are (§3.4). */
  kana: string
  romaji: string
  english: string
}

export type VocabItem = {
  /**
   * Course-qualified so two weeks can never collide: `jpst100:w1:ohayoo`.
   *
   * The suffix is the ROMAJI, because unlike a character a vocabulary item has
   * no shorter written handle. Uniqueness is asserted across every registered
   * set at once, not just within one.
   */
  id: string
  kana: string
  /** As written in class — long vowels doubled: `ohayoo`, not `ohayō`. */
  romaji: string
  english: string
  /**
   * Register, usage, or who says it — "polite", "said by the person leaving".
   * Shown as secondary text, never as the prompt and never as an answer.
   */
  note?: string
  /**
   * One short sentence using the item, where the item is a building block
   * rather than a complete utterance. A set phrase like いただきます is already
   * a sentence and carries none.
   */
  example?: VocabExample
}

export type VocabGroup = {
  id: string
  label: string
  items: VocabItem[]
}

export type VocabSet = {
  /** Unique across the registry. One set per WEEK: `jpst100-w1`. */
  id: string
  label: string
  /**
   * The class note this came from, so a card that looks wrong can be checked
   * against the source rather than argued about. These sets are transcriptions
   * of course material, not invented vocabulary.
   */
  source: string
  groups: VocabGroup[]
}

/**
 * An item together with the group it came from.
 *
 * Groups exist to shape the screen, but two other things need them: a card
 * naming its category on the reveal, and the quiz drawing its first-choice
 * distractors from the same group. Neither wants to walk `groups` itself, and
 * an item does not carry a back-reference — that would denormalise data the
 * group already owns, and leave two places to get it wrong.
 *
 * `groupId` is SET-QUALIFIED (`jpst100-w1/meals`) for the same reason a
 * character id is script-qualified: two weeks may both have a group called
 * "things", and the quiz must not treat them as the same one.
 */
export type VocabEntry = {
  item: VocabItem
  groupId: string
  groupLabel: string
}
