import type {
  Character,
  CharacterRow,
  CharacterSet,
  ExampleWord,
  Vowel,
} from '../types/characters'

/**
 * The 71 katakana — the 46 gojūon, the 20 dakuten and the 5 handakuten.
 *
 * It mirrors the other kana chart exactly: the same sixteen rows, the same row
 * ids and labels, the same gaps, the same three homophone pairs. That is not
 * duplication for its own sake — the two charts ARE the same chart in two
 * scripts, and a learner reading them side by side should find things in the
 * same places. CLAUDE.md §1 predicted this set would be "a data module plus one
 * registry entry", and this file is the data module half of that.
 *
 * Example words are loanwords, because that is what this script is for: a
 * beginner meets it on a menu and a shop sign long before anywhere else. They
 * use the prolonged sound mark ー, which is how this script writes a long vowel
 * where the other doubles it.
 *
 * Three characters have no ordinary loanword and are documented as exceptions
 * in CLAUDE.md §3.4: ヲ, ヂ and ヅ.
 */

const SCRIPT = 'katakana' as const

const COLUMNS: readonly Vowel[] = ['a', 'i', 'u', 'e', 'o']

/** Terser than an object literal 71 times over. */
function w(kana: string, romaji: string, english: string): ExampleWord {
  return { kana, romaji, english }
}

type Entry = {
  /**
   * The id suffix — the WRITTEN form, so ヲ is `wo` though it reads "o", and
   * ヂ / ヅ are `di` / `du` though they read "ji" / "zu" (§3.3).
   */
  key: string
  glyph: string
  romaji: string
  examples: ExampleWord[]
} | null

/**
 * Build a matrix row. The vowel comes from the COLUMN the cell sits in, which
 * is true for all seventy characters that have one. ン is the exception and is
 * built by hand below — it does not go through here.
 */
function row(id: string, label: string, entries: readonly Entry[]): CharacterRow {
  return {
    id,
    label,
    cells: entries.map((entry, index) => {
      if (entry === null) return null

      const vowel = COLUMNS[index]
      if (vowel === undefined) {
        throw new Error(`Row "${id}" has more cells than there are columns.`)
      }

      const character: Character = {
        id: `${SCRIPT}:${entry.key}`,
        script: SCRIPT,
        glyph: entry.glyph,
        romaji: entry.romaji,
        rowId: id,
        vowel,
        examples: entry.examples,
      }
      return character
    }),
  }
}

const ROWS: CharacterRow[] = [
  row('a', 'Vowels', [
    {
      key: 'a',
      glyph: 'ア',
      romaji: 'a',
      examples: [w('アメリカ', 'amerika', 'America'), w('アイス', 'aisu', 'ice cream')],
    },
    {
      key: 'i',
      glyph: 'イ',
      romaji: 'i',
      examples: [w('イタリア', 'itaria', 'Italy')],
    },
    {
      key: 'u',
      glyph: 'ウ',
      romaji: 'u',
      examples: [w('ウール', 'uuru', 'wool')],
    },
    {
      key: 'e',
      glyph: 'エ',
      romaji: 'e',
      examples: [w('エアコン', 'eakon', 'air conditioner')],
    },
    {
      key: 'o',
      glyph: 'オ',
      romaji: 'o',
      examples: [w('オレンジ', 'orenji', 'orange')],
    },
  ]),

  row('k', 'K-row', [
    {
      key: 'ka',
      glyph: 'カ',
      romaji: 'ka',
      examples: [w('カメラ', 'kamera', 'a camera')],
    },
    {
      key: 'ki',
      glyph: 'キ',
      romaji: 'ki',
      examples: [w('キロ', 'kiro', 'a kilogram')],
    },
    {
      key: 'ku',
      glyph: 'ク',
      romaji: 'ku',
      examples: [w('クラス', 'kurasu', 'a class')],
    },
    {
      key: 'ke',
      glyph: 'ケ',
      romaji: 'ke',
      examples: [w('ケーキ', 'keeki', 'cake')],
    },
    {
      key: 'ko',
      glyph: 'コ',
      romaji: 'ko',
      examples: [w('コーヒー', 'koohii', 'coffee')],
    },
  ]),

  row('s', 'S-row', [
    {
      key: 'sa',
      glyph: 'サ',
      romaji: 'sa',
      examples: [w('サラダ', 'sarada', 'salad')],
    },
    {
      // Hepburn: shi, not si.
      key: 'shi',
      glyph: 'シ',
      romaji: 'shi',
      examples: [w('シャツ', 'shatsu', 'a shirt')],
    },
    {
      key: 'su',
      glyph: 'ス',
      romaji: 'su',
      examples: [w('スープ', 'suupu', 'soup')],
    },
    {
      key: 'se',
      glyph: 'セ',
      romaji: 'se',
      examples: [w('セーター', 'seetaa', 'a sweater')],
    },
    {
      key: 'so',
      glyph: 'ソ',
      romaji: 'so',
      examples: [w('ソファ', 'sofa', 'a sofa')],
    },
  ]),

  row('t', 'T-row', [
    {
      key: 'ta',
      glyph: 'タ',
      romaji: 'ta',
      examples: [w('タクシー', 'takushii', 'a taxi')],
    },
    {
      // Hepburn: chi, not ti.
      key: 'chi',
      glyph: 'チ',
      romaji: 'chi',
      examples: [w('チーズ', 'chiizu', 'cheese')],
    },
    {
      // Hepburn: tsu, not tu.
      key: 'tsu',
      glyph: 'ツ',
      romaji: 'tsu',
      examples: [w('ツアー', 'tsuaa', 'a tour')],
    },
    {
      key: 'te',
      glyph: 'テ',
      romaji: 'te',
      examples: [w('テレビ', 'terebi', 'television')],
    },
    {
      key: 'to',
      glyph: 'ト',
      romaji: 'to',
      examples: [w('トマト', 'tomato', 'a tomato')],
    },
  ]),

  row('n', 'N-row', [
    {
      key: 'na',
      glyph: 'ナ',
      romaji: 'na',
      examples: [w('ナイフ', 'naifu', 'a knife')],
    },
    {
      key: 'ni',
      glyph: 'ニ',
      romaji: 'ni',
      examples: [w('ニュース', 'nyuusu', 'the news')],
    },
    {
      key: 'nu',
      glyph: 'ヌ',
      romaji: 'nu',
      examples: [w('ヌードル', 'nuudoru', 'noodles')],
    },
    {
      key: 'ne',
      glyph: 'ネ',
      romaji: 'ne',
      examples: [w('ネクタイ', 'nekutai', 'a necktie')],
    },
    {
      key: 'no',
      glyph: 'ノ',
      romaji: 'no',
      examples: [w('ノート', 'nooto', 'a notebook')],
    },
  ]),

  row('h', 'H-row', [
    {
      key: 'ha',
      glyph: 'ハ',
      romaji: 'ha',
      examples: [w('ハム', 'hamu', 'ham')],
    },
    {
      key: 'hi',
      glyph: 'ヒ',
      romaji: 'hi',
      examples: [w('ヒーター', 'hiitaa', 'a heater')],
    },
    {
      // Hepburn: fu, not hu.
      key: 'fu',
      glyph: 'フ',
      romaji: 'fu',
      examples: [w('フランス', 'furansu', 'France')],
    },
    {
      key: 'he',
      glyph: 'ヘ',
      romaji: 'he',
      examples: [w('ヘルメット', 'herumetto', 'a helmet')],
    },
    {
      key: 'ho',
      glyph: 'ホ',
      romaji: 'ho',
      examples: [w('ホテル', 'hoteru', 'a hotel')],
    },
  ]),

  row('m', 'M-row', [
    {
      key: 'ma',
      glyph: 'マ',
      romaji: 'ma',
      examples: [w('マスク', 'masuku', 'a mask')],
    },
    {
      key: 'mi',
      glyph: 'ミ',
      romaji: 'mi',
      examples: [w('ミルク', 'miruku', 'milk')],
    },
    {
      key: 'mu',
      glyph: 'ム',
      romaji: 'mu',
      // ム is rare word-initially in loanwords, so the example carries it in
      // the middle — the rule is that the word contains the character, not
      // that it starts with it.
      examples: [w('ゲーム', 'geemu', 'a game')],
    },
    {
      key: 'me',
      glyph: 'メ',
      romaji: 'me',
      examples: [w('メール', 'meeru', 'email')],
    },
    {
      key: 'mo',
      glyph: 'モ',
      romaji: 'mo',
      examples: [w('モデル', 'moderu', 'a model')],
    },
  ]),

  // "yi" and "ye" are gaps, exactly as in the other kana chart.
  row('y', 'Y-row', [
    {
      key: 'ya',
      glyph: 'ヤ',
      romaji: 'ya',
      examples: [w('タイヤ', 'taiya', 'a tyre')],
    },
    null,
    {
      key: 'yu',
      glyph: 'ユ',
      romaji: 'yu',
      examples: [w('ユーモア', 'yuumoa', 'humour')],
    },
    null,
    {
      key: 'yo',
      glyph: 'ヨ',
      romaji: 'yo',
      examples: [w('ヨガ', 'yoga', 'yoga')],
    },
  ]),

  row('r', 'R-row', [
    {
      key: 'ra',
      glyph: 'ラ',
      romaji: 'ra',
      examples: [w('ライオン', 'raion', 'a lion')],
    },
    {
      key: 'ri',
      glyph: 'リ',
      romaji: 'ri',
      examples: [w('リボン', 'ribon', 'a ribbon')],
    },
    {
      key: 'ru',
      glyph: 'ル',
      romaji: 'ru',
      examples: [w('ルール', 'ruuru', 'a rule')],
    },
    {
      key: 're',
      glyph: 'レ',
      romaji: 're',
      examples: [w('レモン', 'remon', 'a lemon')],
    },
    {
      key: 'ro',
      glyph: 'ロ',
      romaji: 'ro',
      examples: [w('ロボット', 'robotto', 'a robot')],
    },
  ]),

  // "wi", "wu" and "we" are gaps. ヲ sits in the o column: it is pronounced
  // "o", which is why its romaji is `o` and its id is `wo` (§3.3).
  row('w', 'W-row', [
    {
      key: 'wa',
      glyph: 'ワ',
      romaji: 'wa',
      examples: [w('ワイン', 'wain', 'wine')],
    },
    null,
    null,
    null,
    {
      key: 'wo',
      glyph: 'ヲ',
      romaji: 'o',
      // ヲ is the object particle, so like its twin in the other script it
      // never appears inside a word — and modern writing spells the particle
      // in the other script, which leaves this one with no ordinary word at
      // all. The phrase is the all-katakana style of old telegrams and
      // signage, which is exactly where a learner meets it. CLAUDE.md §3.4.
      examples: [w('ホンヲヨム', 'hon o yomu', 'to read a book')],
    },
  ]),

  /**
   * ン closes the basic gojūon. Built by hand rather than through `row()`
   * because it is the one character with NO vowel; it sits in the first column
   * only because a gojūon chart has nowhere else to put it.
   */
  {
    id: 'nn',
    // NOT "N": the ナ-row already has that label, and two rows sharing one
    // makes the row's select/clear control ambiguous. A test pins uniqueness.
    label: 'Final N',
    cells: [
      {
        id: `${SCRIPT}:nn`,
        script: SCRIPT,
        glyph: 'ン',
        romaji: 'n',
        rowId: 'nn',
        vowel: null,
        // ン never appears word-initially (CLAUDE.md §3.4).
        examples: [w('ラーメン', 'raamen', 'ramen')],
      },
      null,
      null,
      null,
      null,
    ],
  },

  /* ── 濁音 dakuten — the two small strokes ──────────────────────────────
     Voiced counterparts of the k, s, t and h rows. Precomposed single code
     points, so nothing here composes marks at render time. */

  row('g', 'G-row', [
    {
      key: 'ga',
      glyph: 'ガ',
      romaji: 'ga',
      examples: [w('ガラス', 'garasu', 'glass, the material')],
    },
    {
      key: 'gi',
      glyph: 'ギ',
      romaji: 'gi',
      examples: [w('ギター', 'gitaa', 'a guitar')],
    },
    {
      key: 'gu',
      glyph: 'グ',
      romaji: 'gu',
      examples: [w('グループ', 'guruupu', 'a group')],
    },
    {
      key: 'ge',
      glyph: 'ゲ',
      romaji: 'ge',
      examples: [w('ゲーム', 'geemu', 'a game')],
    },
    {
      key: 'go',
      glyph: 'ゴ',
      romaji: 'go',
      examples: [w('ゴム', 'gomu', 'rubber')],
    },
  ]),

  row('z', 'Z-row', [
    {
      key: 'za',
      glyph: 'ザ',
      romaji: 'za',
      examples: [w('ピザ', 'piza', 'pizza')],
    },
    {
      // Hepburn: ji. It collides with ヂ, which is why the id is the written
      // form rather than the sound.
      key: 'ji',
      glyph: 'ジ',
      romaji: 'ji',
      examples: [w('ジュース', 'juusu', 'juice')],
    },
    {
      key: 'zu',
      glyph: 'ズ',
      romaji: 'zu',
      examples: [w('ズボン', 'zubon', 'trousers')],
    },
    {
      key: 'ze',
      glyph: 'ゼ',
      romaji: 'ze',
      examples: [w('ゼロ', 'zero', 'zero')],
    },
    {
      key: 'zo',
      glyph: 'ゾ',
      romaji: 'zo',
      examples: [w('ゾウ', 'zou', 'an elephant')],
    },
  ]),

  row('d', 'D-row', [
    {
      key: 'da',
      glyph: 'ダ',
      romaji: 'da',
      examples: [w('ダンス', 'dansu', 'dance')],
    },
    {
      key: 'di',
      glyph: 'ヂ',
      romaji: 'ji',
      // Modern loanwords use ジ, so ヂ survives only in older spellings. This
      // is the pre-war way of writing "radio", still seen on old shopfronts,
      // which is honest about how rare the character is. CLAUDE.md §3.4.
      examples: [w('ラヂオ', 'rajio', 'radio, an old spelling')],
    },
    {
      key: 'du',
      glyph: 'ヅ',
      romaji: 'zu',
      // Likewise ヅ: no loanword needs it. It turns up on sushi menus, where
      // 漬け is written in kana. CLAUDE.md §3.4.
      examples: [w('ヅケ', 'zuke', 'marinated tuna')],
    },
    {
      key: 'de',
      glyph: 'デ',
      romaji: 'de',
      examples: [w('デパート', 'depaato', 'a department store')],
    },
    {
      key: 'do',
      glyph: 'ド',
      romaji: 'do',
      examples: [w('ドア', 'doa', 'a door')],
    },
  ]),

  row('b', 'B-row', [
    {
      key: 'ba',
      glyph: 'バ',
      romaji: 'ba',
      examples: [w('バス', 'basu', 'a bus')],
    },
    {
      key: 'bi',
      glyph: 'ビ',
      romaji: 'bi',
      examples: [w('ビール', 'biiru', 'beer')],
    },
    {
      key: 'bu',
      glyph: 'ブ',
      romaji: 'bu',
      examples: [w('ブラシ', 'burashi', 'a brush')],
    },
    {
      key: 'be',
      glyph: 'ベ',
      romaji: 'be',
      examples: [w('ベッド', 'beddo', 'a bed')],
    },
    {
      key: 'bo',
      glyph: 'ボ',
      romaji: 'bo',
      examples: [w('ボタン', 'botan', 'a button')],
    },
  ]),

  /* ── 半濁音 handakuten — the small circle. Only the h-row takes it. ── */

  row('p', 'P-row', [
    {
      key: 'pa',
      glyph: 'パ',
      romaji: 'pa',
      examples: [w('パン', 'pan', 'bread')],
    },
    {
      key: 'pi',
      glyph: 'ピ',
      romaji: 'pi',
      examples: [w('ピアノ', 'piano', 'a piano')],
    },
    {
      key: 'pu',
      glyph: 'プ',
      romaji: 'pu',
      examples: [w('プール', 'puuru', 'a swimming pool')],
    },
    {
      key: 'pe',
      glyph: 'ペ',
      romaji: 'pe',
      examples: [w('ペン', 'pen', 'a pen')],
    },
    {
      key: 'po',
      glyph: 'ポ',
      romaji: 'po',
      examples: [w('ポスト', 'posuto', 'a postbox')],
    },
  ]),
]

export const KATAKANA: CharacterSet = {
  id: SCRIPT,
  label: 'Katakana',
  columns: COLUMNS,
  layout: 'matrix',
  rows: ROWS,
}
