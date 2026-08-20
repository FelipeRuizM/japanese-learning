import type {
  Character,
  CharacterRow,
  CharacterSet,
  ExampleWord,
  Vowel,
} from '../types/characters'

/**
 * The 46 gojūon, plus the 20 dakuten and 5 handakuten rows — 71 characters.
 *
 * The voiced rows were added after v1.8 on request. CLAUDE.md §3.3 predicted
 * they would be "additional rows needing no type change", and that held: this
 * file is the only one that changed to bring them in. Yōon (きゃ) remains out
 * of scope and would arrive the same way.
 *
 * Example words are kana-only, short, common and concrete — context for a
 * sound, not vocabulary study. Every one contains its own character, which is
 * asserted by a test rather than trusted.
 */

const SCRIPT = 'hiragana' as const

const COLUMNS: readonly Vowel[] = ['a', 'i', 'u', 'e', 'o']

/** Terser than an object literal 51 times over. */
function w(kana: string, romaji: string, english: string): ExampleWord {
  return { kana, romaji, english }
}

type Entry = {
  /**
   * The id suffix — the WRITTEN form. Usually identical to the romaji; を is
   * `wo` because its romaji is `o` and ids must stay unique (§3.3).
   */
  key: string
  glyph: string
  romaji: string
  examples: ExampleWord[]
} | null

/**
 * Build a matrix row. The vowel comes from the COLUMN the cell sits in, which
 * is true for all forty-five characters that have one. ん is the exception and
 * is built by hand below — it does not go through here.
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
      glyph: 'あ',
      romaji: 'a',
      examples: [w('あめ', 'ame', 'rain'), w('あさ', 'asa', 'morning')],
    },
    {
      key: 'i',
      glyph: 'い',
      romaji: 'i',
      examples: [w('いぬ', 'inu', 'dog'), w('いえ', 'ie', 'house')],
    },
    {
      key: 'u',
      glyph: 'う',
      romaji: 'u',
      examples: [w('うみ', 'umi', 'sea'), w('うた', 'uta', 'song')],
    },
    {
      key: 'e',
      glyph: 'え',
      romaji: 'e',
      examples: [w('えき', 'eki', 'station'), w('えほん', 'ehon', 'picture book')],
    },
    {
      key: 'o',
      glyph: 'お',
      romaji: 'o',
      examples: [w('おちゃ', 'ocha', 'green tea'), w('おと', 'oto', 'sound')],
    },
  ]),

  row('k', 'K-row', [
    { key: 'ka', glyph: 'か', romaji: 'ka', examples: [w('かさ', 'kasa', 'umbrella')] },
    {
      key: 'ki',
      glyph: 'き',
      romaji: 'ki',
      examples: [w('きのこ', 'kinoko', 'mushroom')],
    },
    { key: 'ku', glyph: 'く', romaji: 'ku', examples: [w('くつ', 'kutsu', 'shoes')] },
    {
      key: 'ke',
      glyph: 'け',
      romaji: 'ke',
      examples: [w('けさ', 'kesa', 'this morning')],
    },
    {
      key: 'ko',
      glyph: 'こ',
      romaji: 'ko',
      examples: [w('こども', 'kodomo', 'child')],
    },
  ]),

  row('s', 'S-row', [
    { key: 'sa', glyph: 'さ', romaji: 'sa', examples: [w('さかな', 'sakana', 'fish')] },
    {
      key: 'shi',
      glyph: 'し',
      romaji: 'shi',
      examples: [w('しま', 'shima', 'island')],
    },
    { key: 'su', glyph: 'す', romaji: 'su', examples: [w('すし', 'sushi', 'sushi')] },
    { key: 'se', glyph: 'せ', romaji: 'se', examples: [w('せかい', 'sekai', 'world')] },
    { key: 'so', glyph: 'そ', romaji: 'so', examples: [w('そら', 'sora', 'sky')] },
  ]),

  row('t', 'T-row', [
    { key: 'ta', glyph: 'た', romaji: 'ta', examples: [w('たまご', 'tamago', 'egg')] },
    { key: 'chi', glyph: 'ち', romaji: 'chi', examples: [w('ちず', 'chizu', 'map')] },
    { key: 'tsu', glyph: 'つ', romaji: 'tsu', examples: [w('つき', 'tsuki', 'moon')] },
    {
      key: 'te',
      glyph: 'て',
      romaji: 'te',
      examples: [w('てがみ', 'tegami', 'letter')],
    },
    { key: 'to', glyph: 'と', romaji: 'to', examples: [w('とり', 'tori', 'bird')] },
  ]),

  row('n', 'N-row', [
    { key: 'na', glyph: 'な', romaji: 'na', examples: [w('なつ', 'natsu', 'summer')] },
    { key: 'ni', glyph: 'に', romaji: 'ni', examples: [w('にく', 'niku', 'meat')] },
    { key: 'nu', glyph: 'ぬ', romaji: 'nu', examples: [w('ぬの', 'nuno', 'cloth')] },
    { key: 'ne', glyph: 'ね', romaji: 'ne', examples: [w('ねこ', 'neko', 'cat')] },
    { key: 'no', glyph: 'の', romaji: 'no', examples: [w('のり', 'nori', 'seaweed')] },
  ]),

  row('h', 'H-row', [
    { key: 'ha', glyph: 'は', romaji: 'ha', examples: [w('はな', 'hana', 'flower')] },
    { key: 'hi', glyph: 'ひ', romaji: 'hi', examples: [w('ひと', 'hito', 'person')] },
    { key: 'fu', glyph: 'ふ', romaji: 'fu', examples: [w('ふゆ', 'fuyu', 'winter')] },
    { key: 'he', glyph: 'へ', romaji: 'he', examples: [w('へや', 'heya', 'room')] },
    { key: 'ho', glyph: 'ほ', romaji: 'ho', examples: [w('ほし', 'hoshi', 'star')] },
  ]),

  row('m', 'M-row', [
    { key: 'ma', glyph: 'ま', romaji: 'ma', examples: [w('まど', 'mado', 'window')] },
    { key: 'mi', glyph: 'み', romaji: 'mi', examples: [w('みみ', 'mimi', 'ear')] },
    { key: 'mu', glyph: 'む', romaji: 'mu', examples: [w('むし', 'mushi', 'insect')] },
    {
      key: 'me',
      glyph: 'め',
      romaji: 'me',
      examples: [w('めがね', 'megane', 'glasses')],
    },
    { key: 'mo', glyph: 'も', romaji: 'mo', examples: [w('もり', 'mori', 'forest')] },
  ]),

  // No "yi" and no "ye" — genuine gaps, rendered as empty space.
  row('y', 'Y-row', [
    { key: 'ya', glyph: 'や', romaji: 'ya', examples: [w('やま', 'yama', 'mountain')] },
    null,
    { key: 'yu', glyph: 'ゆ', romaji: 'yu', examples: [w('ゆき', 'yuki', 'snow')] },
    null,
    { key: 'yo', glyph: 'よ', romaji: 'yo', examples: [w('よる', 'yoru', 'night')] },
  ]),

  row('r', 'R-row', [
    {
      key: 'ra',
      glyph: 'ら',
      romaji: 'ra',
      examples: [w('さくら', 'sakura', 'cherry blossom')],
    },
    { key: 'ri', glyph: 'り', romaji: 'ri', examples: [w('りんご', 'ringo', 'apple')] },
    { key: 'ru', glyph: 'る', romaji: 'ru', examples: [w('くるま', 'kuruma', 'car')] },
    { key: 're', glyph: 'れ', romaji: 're', examples: [w('これ', 'kore', 'this one')] },
    { key: 'ro', glyph: 'ろ', romaji: 'ro', examples: [w('ろく', 'roku', 'six')] },
  ]),

  // "wi", "wu" and "we" are gaps. を sits in the o column: it is pronounced
  // "o", which is why its romaji is `o` and its id is `wo` (§3.3).
  row('w', 'W-row', [
    {
      key: 'wa',
      glyph: 'わ',
      romaji: 'wa',
      examples: [w('わたし', 'watashi', 'I, me')],
    },
    null,
    null,
    null,
    {
      key: 'wo',
      glyph: 'を',
      romaji: 'o',
      // を is a grammatical particle and never appears inside a word, so its
      // example has to be a phrase. Documented in CLAUDE.md §3.4 so nobody
      // "fixes" it into a single word later.
      examples: [w('ほんをよむ', 'hon o yomu', 'to read a book')],
    },
  ]),

  /**
   * ん closes the basic gojūon. It gets its own row and is built by hand rather
   * than through `row()`,
   * because it is the one character with NO vowel. It sits in the first column
   * only because a gojūon chart has nowhere else to put it — that is a layout
   * position, not a claim that it belongs to the 'a' column.
   */
  {
    id: 'nn',
    // NOT "N": the な-row is already labelled that, and two rows sharing a
    // label makes the chart ambiguous and the row's select/clear control
    // indistinguishable to a screen reader. A test pins labels as unique.
    label: 'Final N',
    cells: [
      {
        id: `${SCRIPT}:nn`,
        script: SCRIPT,
        glyph: 'ん',
        romaji: 'n',
        rowId: 'nn',
        vowel: null,
        // ん never appears word-initially (CLAUDE.md §3.4).
        examples: [w('みかん', 'mikan', 'mandarin orange')],
      },
      null,
      null,
      null,
      null,
    ],
  },

  /* ── 濁音 dakuten — the two small strokes ──────────────────────────────
     Voiced counterparts of the k, s, t and h rows. They are written with the
     same base glyph plus ゛, and they are precomposed single code points, so
     nothing here needs to compose marks at render time. */

  row('g', 'G-row', [
    {
      key: 'ga',
      glyph: 'が',
      romaji: 'ga',
      examples: [w('かがみ', 'kagami', 'mirror')],
    },
    { key: 'gi', glyph: 'ぎ', romaji: 'gi', examples: [w('かぎ', 'kagi', 'key')] },
    {
      key: 'gu',
      glyph: 'ぐ',
      romaji: 'gu',
      examples: [w('かぐ', 'kagu', 'furniture')],
    },
    {
      key: 'ge',
      glyph: 'げ',
      romaji: 'ge',
      examples: [w('げんき', 'genki', 'well, energetic')],
    },
    {
      key: 'go',
      glyph: 'ご',
      romaji: 'go',
      examples: [w('ごはん', 'gohan', 'cooked rice, a meal')],
    },
  ]),

  row('z', 'Z-row', [
    {
      key: 'za',
      glyph: 'ざ',
      romaji: 'za',
      examples: [w('ざっし', 'zasshi', 'magazine')],
    },
    { key: 'ji', glyph: 'じ', romaji: 'ji', examples: [w('じかん', 'jikan', 'time')] },
    { key: 'zu', glyph: 'ず', romaji: 'zu', examples: [w('みず', 'mizu', 'water')] },
    { key: 'ze', glyph: 'ぜ', romaji: 'ze', examples: [w('かぜ', 'kaze', 'wind')] },
    { key: 'zo', glyph: 'ぞ', romaji: 'zo', examples: [w('ぞう', 'zou', 'elephant')] },
  ]),

  /*
    The D-row carries the two rarest characters in the language, and both are
    homophones of Z-row characters: ぢ is pronounced "ji" like じ, and づ is
    "zu" like ず. Modern Japanese uses the Z-row spellings almost everywhere,
    so these two survive mainly in compounds — which is exactly what their
    example words show.

    Their ids are the WRITTEN forms, `di` and `du`, because ids must stay
    unique while romaji does not (§3.3). The quiz already excludes same-romaji
    characters from appearing together, keyed on romaji rather than on the
    お/を pair specifically, so it handles these two without any change.
  */
  row('d', 'D-row', [
    { key: 'da', glyph: 'だ', romaji: 'da', examples: [w('からだ', 'karada', 'body')] },
    {
      key: 'di',
      glyph: 'ぢ',
      romaji: 'ji',
      examples: [w('はなぢ', 'hanaji', 'a nosebleed')],
    },
    {
      key: 'du',
      glyph: 'づ',
      romaji: 'zu',
      examples: [w('つづく', 'tsuzuku', 'to be continued')],
    },
    {
      key: 'de',
      glyph: 'で',
      romaji: 'de',
      examples: [w('でんわ', 'denwa', 'telephone')],
    },
    {
      key: 'do',
      glyph: 'ど',
      romaji: 'do',
      examples: [w('どうぶつ', 'doubutsu', 'animal')],
    },
  ]),

  row('b', 'B-row', [
    {
      key: 'ba',
      glyph: 'ば',
      romaji: 'ba',
      examples: [w('そば', 'soba', 'buckwheat noodles')],
    },
    { key: 'bi', glyph: 'び', romaji: 'bi', examples: [w('へび', 'hebi', 'snake')] },
    { key: 'bu', glyph: 'ぶ', romaji: 'bu', examples: [w('ぶた', 'buta', 'pig')] },
    {
      key: 'be',
      glyph: 'べ',
      romaji: 'be',
      examples: [w('べんとう', 'bentou', 'a packed lunch')],
    },
    { key: 'bo', glyph: 'ぼ', romaji: 'bo', examples: [w('ぼうし', 'boushi', 'hat')] },
  ]),

  /* ── 半濁音 handakuten — the small circle ──────────────────────────────
     Only the h-row takes it. Not the two strokes, but taught alongside them
     and derived from the same base row, so a chart carrying ば without ぱ
     reads as unfinished. */

  row('p', 'P-row', [
    {
      key: 'pa',
      glyph: 'ぱ',
      romaji: 'pa',
      examples: [w('いっぱい', 'ippai', 'full, a lot')],
    },
    {
      key: 'pi',
      glyph: 'ぴ',
      romaji: 'pi',
      examples: [w('ぴかぴか', 'pikapika', 'sparkling')],
    },
    {
      key: 'pu',
      glyph: 'ぷ',
      romaji: 'pu',
      examples: [w('てんぷら', 'tenpura', 'tempura')],
    },
    {
      key: 'pe',
      glyph: 'ぺ',
      romaji: 'pe',
      examples: [w('ぺこぺこ', 'pekopeko', 'hungry')],
    },
    {
      key: 'po',
      glyph: 'ぽ',
      romaji: 'po',
      examples: [w('さんぽ', 'sanpo', 'a walk')],
    },
  ]),
]

export const HIRAGANA: CharacterSet = {
  id: SCRIPT,
  label: 'Hiragana',
  columns: COLUMNS,
  layout: 'matrix',
  rows: ROWS,
}
