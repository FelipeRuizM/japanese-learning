import type { VocabSet } from '../types/vocab'

/**
 * JPST 100, WEEK 1 — transcribed from the week's summary note.
 *
 * ONE SET PER WEEK, AND THE NOTE'S TABLES ARE ITS GROUPS. This replaced three
 * separate sets — greetings, self-introduction, everyday words — that had been
 * assembled from three different class notes, and the reason is the drill the
 * owner actually wants: choose some weeks, then choose topics inside them. That
 * sentence only parses if a week is one thing with topics in it. Three sets per
 * week made "week" a label convention rather than a structure, and a convention
 * cannot be a filter.
 *
 * The summary note is now the source, and it is the ONLY source: every item
 * below is a row in one of its tables, and no item exists that is not. The
 * per-topic notes in the same folder are the explanations; this is the list.
 * That distinction is what makes a card checkable — `source` names one file,
 * and the row is in it.
 *
 * WHAT THE TRANSCRIPTION DOES, EXACTLY:
 *
 *   - `kana`    the Hiragana column, as written.
 *   - `romaji`  the Romaji column, as written — `ohayoo`, `senkou`, and the
 *               capital on `Kankoku`, which is a proper noun in the note.
 *   - `english` the Meaning column, minus the note's decorative quote marks.
 *   - `note`    the Notes column, with Chinese characters rewritten in kana or
 *               dropped. A beginner cannot read the written form, so "Kanji:
 *               医者" is not a note to them; it is noise on a card. A test now
 *               pins that.
 *
 * NO ITEM CARRIES AN `example`. The tables have no example column, and the ones
 * that used to be here were written for the grammar notes rather than taken
 * from the class. Inventing sentences to fill an optional field is how a
 * transcription quietly becomes an authored deck (§11.2).
 */
export const WEEK1: VocabSet = {
  id: 'jpst100-w1',
  label: 'Week 1',
  source: "JPST 100 — Week 1 — ! Things I've learned this week",
  groups: [
    {
      id: 'greetings',
      label: 'Greetings & set phrases',
      items: [
        {
          id: 'jpst100:w1:hajimemashite',
          kana: 'はじめまして',
          romaji: 'hajimemashite',
          english: 'Nice to meet you',
          note: 'only the first time you meet someone',
        },
        {
          id: 'jpst100:w1:konnichiwa',
          kana: 'こんにちは',
          romaji: 'konnichiwa',
          english: 'Hello / good afternoon',
        },
        {
          id: 'jpst100:w1:ohayoo',
          kana: 'おはよう',
          romaji: 'ohayoo',
          english: 'Good morning (casual)',
          note: 'add ございます for politeness',
        },
        {
          id: 'jpst100:w1:konbanwa',
          kana: 'こんばんは',
          romaji: 'konbanwa',
          english: 'Good evening',
        },
        {
          id: 'jpst100:w1:oyasumi-nasai',
          kana: 'おやすみなさい',
          romaji: 'oyasumi nasai',
          english: 'Good night',
        },
        {
          id: 'jpst100:w1:sayoonara',
          kana: 'さようなら',
          romaji: 'sayoonara',
          english: 'Goodbye',
          note: 'fairly formal or final — for a longer parting',
        },
        {
          id: 'jpst100:w1:doozo-yoroshiku',
          kana: 'どうぞよろしく',
          romaji: 'doozo yoroshiku',
          english: 'Pleased to meet you',
          note: 'casual, shorter than よろしくおねがいします — said after a self-introduction',
        },
      ],
    },
    {
      id: 'leaving-and-returning',
      label: 'Leaving & returning home',
      items: [
        {
          id: 'jpst100:w1:itte-kimasu',
          kana: 'いってきます',
          romaji: 'itte kimasu',
          english: "I'm off — I'll go and come back",
          note: 'said by the person leaving',
        },
        {
          id: 'jpst100:w1:itterasshai',
          kana: 'いってらっしゃい',
          romaji: 'itterasshai',
          english: 'Take care — go and come back safely',
          note: 'said by the person seeing them off',
        },
      ],
    },
    {
      id: 'thanks',
      label: 'Thanks, apologies & basic responses',
      items: [
        {
          id: 'jpst100:w1:arigatoo',
          kana: 'ありがとう',
          romaji: 'arigatoo',
          english: 'Thank you (casual)',
          note: 'add ございます for politeness',
        },
        {
          id: 'jpst100:w1:sumimasen',
          kana: 'すみません',
          romaji: 'sumimasen',
          english: 'Excuse me / sorry',
          note: "also used to get someone's attention",
        },
        {
          id: 'jpst100:w1:hai',
          kana: 'はい',
          romaji: 'hai',
          english: 'Yes',
        },
        {
          id: 'jpst100:w1:iie',
          kana: 'いいえ',
          romaji: 'iie',
          english: 'No',
          note: 'also a polite deflection, for instance after being thanked',
        },
        {
          id: 'jpst100:w1:kudasai',
          kana: 'ください',
          romaji: 'kudasai',
          english: 'Please give me',
          note: 'used to request something — [thing] をください',
        },
      ],
    },
    {
      id: 'meals',
      label: 'Meals',
      items: [
        /*
         * These two SHARE A MEANING, and the note glosses them identically on
         * purpose — which is the お/を collision in vocabulary form (§11.2).
         * The quiz may never offer them together; `registry.test.ts` pins the
         * pair, so a third one typed in with a later week fails a test rather
         * than appearing on screen as an unanswerable question.
         */
        {
          id: 'jpst100:w1:itadakimasu',
          kana: 'いただきます',
          romaji: 'itadakimasu',
          english: 'Thank you for the food',
          note: 'said before eating',
        },
        {
          id: 'jpst100:w1:gochisoosama-deshita',
          kana: 'ごちそうさまでした',
          romaji: 'gochisoosama deshita',
          english: 'Thank you for the food',
          note: 'said after eating',
        },
      ],
    },
    {
      id: 'self-introduction',
      label: 'Self-introduction & school',
      items: [
        {
          id: 'jpst100:w1:watashi-wa',
          kana: 'わたしは',
          romaji: 'watashi wa',
          english: 'I am / as for me',
          note: 'は is the topic marker here, and is pronounced "wa"',
        },
        {
          id: 'jpst100:w1:desu',
          kana: 'です',
          romaji: 'desu',
          english: 'am / is / are',
          note: 'the polite copula',
        },
        {
          id: 'jpst100:w1:onamae-wa',
          kana: 'おなまえは',
          romaji: 'onamae wa',
          english: "What's your name",
          note: 'literally "as for [your] name"',
        },
        {
          id: 'jpst100:w1:namae',
          kana: 'なまえ',
          romaji: 'namae',
          english: 'Name',
        },
        {
          id: 'jpst100:w1:gakusei',
          kana: 'がくせい',
          romaji: 'gakusei',
          english: 'Student',
        },
        {
          id: 'jpst100:w1:ryuugakusei',
          kana: 'りゅうがくせい',
          romaji: 'ryuugakusei',
          english: 'Overseas / exchange student',
        },
        {
          id: 'jpst100:w1:daigaku',
          kana: 'だいがく',
          romaji: 'daigaku',
          english: 'University',
        },
        {
          id: 'jpst100:w1:nensei',
          kana: 'ねんせい',
          romaji: 'nensei',
          english: 'Student in year ___',
          note: 'a suffix — いちねんせい is a first-year',
        },
        {
          id: 'jpst100:w1:senkou',
          kana: 'せんこう',
          romaji: 'senkou',
          english: 'Major / study field',
          note: 'pattern: せんこうは＿＿です — "my major is ___"',
        },
        {
          id: 'jpst100:w1:sensei',
          kana: 'せんせい',
          romaji: 'sensei',
          english: 'Teacher',
        },
        {
          id: 'jpst100:w1:sai',
          kana: 'さい',
          romaji: 'sai',
          english: '___ years old',
          note: 'age suffix — irregular at 1 いっさい, 8 はっさい, 10 じゅっさい, and 20 はたち, which drops さい',
        },
      ],
    },
    {
      id: 'time',
      label: 'Time',
      items: [
        { id: 'jpst100:w1:gozen', kana: 'ごぜん', romaji: 'gozen', english: 'AM' },
        { id: 'jpst100:w1:gogo', kana: 'ごご', romaji: 'gogo', english: 'PM' },
      ],
    },
    {
      id: 'phone',
      label: 'Phone',
      items: [
        { id: 'jpst100:w1:denwa', kana: 'でんわ', romaji: 'denwa', english: 'Phone' },
        {
          id: 'jpst100:w1:bangou',
          kana: 'ばんごう',
          romaji: 'bangou',
          english: 'Number',
        },
      ],
    },
    {
      id: 'family',
      label: 'Family & people',
      items: [
        {
          id: 'jpst100:w1:okaasan',
          kana: 'おかあさん',
          romaji: 'okaasan',
          english: 'Mom',
        },
        {
          id: 'jpst100:w1:otousan',
          kana: 'おとうさん',
          romaji: 'otousan',
          english: 'Dad',
        },
        {
          id: 'jpst100:w1:tomodachi',
          kana: 'ともだち',
          romaji: 'tomodachi',
          english: 'Friend',
        },
      ],
    },
    {
      id: 'nationality',
      label: 'Nationality',
      items: [
        {
          id: 'jpst100:w1:kankoku',
          kana: 'かんこく',
          // Capitalised in the note, because it is a proper noun there. The
          // rule is "as the class writes it" (§11.2), not "as Hepburn would".
          romaji: 'Kankoku',
          english: 'South Korea',
        },
        {
          id: 'jpst100:w1:chuugokujin',
          kana: 'ちゅうごくじん',
          romaji: 'chuugokujin',
          english: 'Chinese person',
        },
        {
          id: 'jpst100:w1:jin',
          kana: 'じん',
          romaji: 'jin',
          english: 'Person from ___',
          note: 'a suffix on a country name — ちゅうごくじん',
        },
        {
          id: 'jpst100:w1:nihongo',
          kana: 'にほんご',
          romaji: 'nihongo',
          english: 'The Japanese language',
        },
      ],
    },
    {
      id: 'work',
      label: 'Work',
      items: [
        {
          id: 'jpst100:w1:isha',
          kana: 'いしゃ',
          romaji: 'isha',
          english: 'Medical doctor',
        },
        {
          id: 'jpst100:w1:shigoto',
          kana: 'しごと',
          romaji: 'shigoto',
          english: 'Work / job',
        },
      ],
    },
    {
      id: 'other',
      label: 'Other vocabulary',
      items: [
        {
          id: 'jpst100:w1:akai',
          kana: 'あかい',
          romaji: 'akai',
          english: 'Red',
          note: 'an i-adjective — as in あかいのをください',
        },
        { id: 'jpst100:w1:hon', kana: 'ほん', romaji: 'hon', english: 'Book' },
        { id: 'jpst100:w1:kuruma', kana: 'くるま', romaji: 'kuruma', english: 'Car' },
        { id: 'jpst100:w1:inu', kana: 'いぬ', romaji: 'inu', english: 'Dog' },
      ],
    },
  ],
}
