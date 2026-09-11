/**
 * The grammar cloze model (CLAUDE.md §11.7).
 *
 * Grammar is neither a character set nor a vocabulary set, and it is not
 * generative the way numbers are: a pattern is a sentence somebody wrote down,
 * with one piece taken out. So this is authored data, like the vocabulary, and
 * not a generator, like the numbers.
 */

/** Which of Week 1's two grammar points a sentence exercises. */
export type ClozeTopic = 'desu' | 'no'

/**
 * What kind of thing has been taken out.
 *
 * This is what decides the OPTIONS. A blank that wants a particle must offer
 * particles; one that wants a copula must offer copula forms. Mixing them would
 * make three of the four options obviously wrong and the question free.
 */
export type ClozeKind = 'particle' | 'copula'

/** The marker inside `kana` that the answer replaces. */
export const BLANK = '___'

export type ClozeItem = {
  id: string
  topic: ClozeTopic
  kind: ClozeKind
  /**
   * The sentence in kana, with exactly one `BLANK`.
   *
   * THE BLANK IS ALWAYS THE PARTICLE OR THE COPULA, never the noun. A cloze
   * over the noun would be a vocabulary question wearing a grammar question's
   * clothes, and the vocabulary quiz already asks it better.
   */
  kana: string
  answer: string
  /** The whole sentence in romaji, answer included. */
  romaji: string
  /**
   * The meaning — part of the PROMPT, not the reveal.
   *
   * Without it the question is often unanswerable: わたし___がくせいです takes
   * は for "I am a student" and の for "it is my student", and both are real
   * sentences. The English is what picks one.
   */
  english: string
  /** One line on why this answer, shown on the reveal. */
  note: string
}
