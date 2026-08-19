/**
 * The character-set model (CLAUDE.md §3.1).
 *
 * This is the abstraction that lets katakana and kanji arrive as data plus one
 * registry entry rather than as a rewrite. The grid, the flashcards and the
 * quiz consume these types and nothing else — none of them may import a script
 * data module or name a script.
 *
 * This file is the ONE place outside `src/characters/` allowed to name a
 * script, because `ScriptId` is a type-level fact and has nowhere else to live.
 * The leak test enforces exactly that boundary.
 */

export type ScriptId = 'hiragana' | 'katakana' | 'kanji'

export type Vowel = 'a' | 'i' | 'u' | 'e' | 'o'

export type ExampleWord = {
  /** Kana only, never kanji — a beginner cannot read 猫 (CLAUDE.md §3.4). */
  kana: string
  romaji: string
  english: string
}

export type Character = {
  /**
   * Script-qualified so two sets can never collide: `hiragana:ka`.
   *
   * The suffix is the WRITTEN form, not the pronunciation — を is `hiragana:wo`
   * even though its romaji is `o`. That is what keeps ids unique across the one
   * pair whose romaji collides (§3.3).
   */
  id: string
  script: ScriptId
  glyph: string
  /** Hepburn. `shi`, `chi`, `tsu`, `fu` — and `o` for を. */
  romaji: string
  rowId: string
  /**
   * `null` for ん, which belongs to no vowel column.
   *
   * Layout uses a cell's POSITION; the quiz uses this. Never assume every
   * character has a vowel.
   */
  vowel: Vowel | null
  /** At least one — enforced by a test. */
  examples: ExampleWord[]
  /**
   * A static audio file, relative to the base path. Absent means fall through
   * to speech synthesis (CLAUDE.md §4.2). Populating this later is a data
   * change, not a rewrite.
   */
  audio?: string
}

export type CharacterRow = {
  id: string
  label: string
  /**
   * `null` is a REAL gap, not padding — the や-row has no "yi" or "ye", the
   * わ-row has no "wi", "wu" or "we". Gaps render as empty space, never as a
   * disabled character and never collapsed away: the shape of the chart is
   * part of what is being learned.
   */
  cells: (Character | null)[]
}

export type CharacterSet = {
  id: ScriptId
  label: string
  /** Column headers. Empty for a set with no matrix. */
  columns: readonly Vowel[]
  /**
   * How the grid lays this set out. THIS is what stops kanji forcing a rewrite:
   * a grid that hardcoded a five-column matrix would have to be rebuilt, so the
   * branch exists from day one. Two branches, and no more (CLAUDE.md §3.2).
   */
  layout: 'matrix' | 'flow'
  rows: CharacterRow[]
}
