import type { VocabSet } from '../types/vocab'

/**
 * JPST 100, Week 1 — the self-introduction formula and its building blocks.
 *
 * Two kinds of item sit here and the split is deliberate. The opening and
 * closing phrases are fixed utterances, learned whole. Everything under
 * "Talking about yourself" is a NOUN that slots into [Topic] は [Noun] です —
 * so each one carries the example sentence that shows it in the slot, which is
 * the thing actually being practised.
 *
 * A suffix that never stands alone is written with 〜 (〜じん, 〜さい). The
 * example is what makes it concrete; on its own it is a shape, not a word.
 */
export const WEEK1_INTRODUCTION: VocabSet = {
  id: 'jpst100-w1-introduction',
  label: 'Week 1 · Self introduction',
  source: 'JPST 100 — Week 1 — Self Introduction',
  groups: [
    {
      id: 'meeting',
      label: 'Meeting someone',
      items: [
        {
          id: 'jpst100:w1:hajimemashite',
          kana: 'はじめまして',
          romaji: 'hajimemashite',
          english: 'Nice to meet you',
          note: 'only the first time you meet someone',
        },
        {
          id: 'jpst100:w1:yoroshiku-onegaishimasu',
          kana: 'よろしくおねがいします',
          romaji: 'yoroshiku onegaishimasu',
          english: 'Please treat me well',
          note: 'the standard closing to any self-introduction',
        },
        {
          id: 'jpst100:w1:doozo-yoroshiku',
          kana: 'どうぞよろしく',
          romaji: 'doozo yoroshiku',
          english: 'Pleased to meet you',
          note: 'shorter, a little less formal',
        },
      ],
    },
    {
      id: 'about-yourself',
      label: 'Talking about yourself',
      items: [
        {
          id: 'jpst100:w1:watashi',
          kana: 'わたし',
          romaji: 'watashi',
          english: 'I — me',
          example: {
            kana: 'わたしはがくせいです',
            romaji: 'watashi wa gakusei desu',
            english: 'I am a student',
          },
        },
        {
          id: 'jpst100:w1:gakusei',
          kana: 'がくせい',
          romaji: 'gakusei',
          english: 'student',
          example: {
            kana: 'がくせいです',
            romaji: 'gakusei desu',
            english: "I'm a student",
          },
        },
        {
          id: 'jpst100:w1:sensei',
          kana: 'せんせい',
          romaji: 'sensei',
          english: 'teacher',
          example: {
            kana: 'にほんごのせんせいです',
            romaji: 'nihongo no sensei desu',
            english: 'a Japanese teacher',
          },
        },
        {
          id: 'jpst100:w1:senkou',
          kana: 'せんこう',
          romaji: 'senkou',
          english: 'major — field of study',
          example: {
            kana: 'せんこうはにほんごです',
            romaji: 'senkou wa nihongo desu',
            english: 'My major is Japanese',
          },
        },
        {
          id: 'jpst100:w1:nihongo',
          kana: 'にほんご',
          romaji: 'nihongo',
          english: 'the Japanese language',
        },
        {
          id: 'jpst100:w1:jin',
          kana: '〜じん',
          romaji: '-jin',
          english: 'person from ___',
          example: {
            kana: 'ブラジルじんです',
            romaji: 'burajiru-jin desu',
            english: "I'm Brazilian",
          },
        },
        {
          id: 'jpst100:w1:burajiru',
          kana: 'ブラジル',
          romaji: 'burajiru',
          english: 'Brazil',
        },
        {
          id: 'jpst100:w1:kanada',
          kana: 'カナダ',
          romaji: 'kanada',
          english: 'Canada',
          example: {
            kana: 'カナダのがくせいです',
            romaji: 'kanada no gakusei desu',
            english: 'a Canadian student',
          },
        },
        {
          id: 'jpst100:w1:nensei',
          kana: '〜ねんせい',
          romaji: '-nensei',
          english: '___-year student',
          example: {
            kana: 'なんねんせいですか',
            romaji: 'nan-nensei desu ka',
            english: 'What year are you in?',
          },
        },
        {
          id: 'jpst100:w1:sai',
          kana: '〜さい',
          romaji: '-sai',
          english: '___ years old',
          example: {
            kana: 'なんさいですか',
            romaji: 'nan-sai desu ka',
            english: 'How old are you?',
          },
        },
        {
          id: 'jpst100:w1:oikutsu',
          kana: 'おいくつですか',
          romaji: 'oikutsu desu ka',
          english: 'How old are you?',
          note: 'the polite version of なんさいですか',
        },
      ],
    },
    {
      id: 'year-in-school',
      label: 'Year in school',
      items: [
        {
          id: 'jpst100:w1:ichinensei',
          kana: 'いちねんせい',
          romaji: 'ichinensei',
          english: 'first-year student',
        },
        {
          id: 'jpst100:w1:ninensei',
          kana: 'にねんせい',
          romaji: 'ninensei',
          english: 'second-year student',
        },
        {
          id: 'jpst100:w1:sannensei',
          kana: 'さんねんせい',
          romaji: 'sannensei',
          english: 'third-year student',
        },
        {
          id: 'jpst100:w1:yonensei',
          kana: 'よねんせい',
          romaji: 'yonensei',
          english: 'fourth-year student',
          note: 'よ, not よん, before ねんせい',
        },
        {
          id: 'jpst100:w1:gonensei',
          kana: 'ごねんせい',
          romaji: 'gonensei',
          english: 'fifth-year student',
        },
      ],
    },
  ],
}
