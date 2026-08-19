import type { CharacterSet } from '../types/characters'

/**
 * A tiny set that uses `layout: 'flow'`, rendered on /styleguide.
 *
 * WHY IT EXISTS. `CharacterGrid` has two branches so that kanji — which has no
 * vowel columns — will not force a rewrite (CLAUDE.md §3.2). A branch nothing
 * renders is a claim, not a capability: it would rot silently and be discovered
 * broken on the day it was needed. This fixture makes the flow path real today.
 *
 * It is NOT in `CHARACTER_SETS` and is not offered to anyone as study material.
 * The characters are the numerals one, two and three, chosen because they are
 * genuinely the first kanji a beginner meets, so the fixture is at least honest
 * about what it shows.
 *
 * It lives in `src/characters/` because it is character data, and because that
 * is one of the two places allowed to name a script.
 *
 * NOTE: these glyphs render in the OS fallback face, not in the shipped webfont
 * — the subset is kana-only by design (scripts/subset-jp-font.mjs). On the
 * styleguide that is a feature: it shows exactly what a missing glyph looks
 * like, which is what a real kanji set would need the subset extended for.
 */
export const FLOW_FIXTURE: CharacterSet = {
  id: 'kanji',
  label: 'Numerals (layout fixture)',
  // No matrix: this is the whole point of the flow branch.
  columns: [],
  layout: 'flow',
  rows: [
    {
      id: 'numbers',
      label: 'Numbers',
      cells: [
        {
          id: 'kanji:ichi',
          script: 'kanji',
          glyph: '一',
          romaji: 'ichi',
          rowId: 'numbers',
          vowel: null,
          examples: [{ kana: 'いち', romaji: 'ichi', english: 'one' }],
        },
        {
          id: 'kanji:ni',
          script: 'kanji',
          glyph: '二',
          romaji: 'ni',
          rowId: 'numbers',
          vowel: null,
          examples: [{ kana: 'に', romaji: 'ni', english: 'two' }],
        },
        {
          id: 'kanji:san',
          script: 'kanji',
          glyph: '三',
          romaji: 'san',
          rowId: 'numbers',
          vowel: null,
          examples: [{ kana: 'さん', romaji: 'san', english: 'three' }],
        },
      ],
    },
  ],
}
