import type { VocabSet } from '../types/vocab'

/**
 * JPST 100, WEEK 3 — transcribed from the week's conversations note.
 *
 * THERE IS NO SUMMARY NOTE FOR THIS WEEK either, so the conversations note is
 * the source: its こそあど table, the vocabulary it defines in its bullets and
 * lists, and the words its tables teach. Whole dialogue lines are left out —
 * they are sentences built from these words, not words.
 *
 * THE NUMBERS NOTE IS DELIBERATELY NOT HERE. 100–100,000 is a rule with sound
 * changes, and §11.3 is explicit that a rule is a generator, not a deck. The
 * native counters (ひとつ … とお) ARE here: they are ten irregular words with no
 * rule to generate them from, which is exactly what a card is for.
 *
 * ROMAJI follows the note where it gives one (`menyuu`, `irasshaimase`,
 * `kashikomarimashita`, lowercased) and its style where it does not — long
 * vowels spelled out, as in `arigatou`.
 *
 * Three pairs could have collided and are glossed apart ON THE NOTE'S OWN
 * TERMS rather than pinned as shared meanings: トイレ / おてあらい (the note
 * calls one politer), ここ / こちら and どこ / どちら (the note calls the second
 * of each the polite version).
 */
export const WEEK3: VocabSet = {
  id: 'jpst100-w3',
  label: 'Week 3',
  source: 'JPST 100 — Week 3 — ! Week 3 Conversations - AI',
  groups: [
    {
      id: 'ko-so-a-do',
      label: 'こそあど — this, that, over there, which',
      items: [
        {
          id: 'jpst100:w3:kore',
          kana: 'これ',
          romaji: 'kore',
          english: 'This one (near me)',
          note: 'stands alone — これはほんです',
        },
        {
          id: 'jpst100:w3:sore',
          kana: 'それ',
          romaji: 'sore',
          english: 'That one (near you)',
        },
        {
          id: 'jpst100:w3:are',
          kana: 'あれ',
          romaji: 'are',
          english: 'That one over there',
        },
        {
          id: 'jpst100:w3:dore',
          kana: 'どれ',
          romaji: 'dore',
          english: 'Which one',
        },
        {
          id: 'jpst100:w3:kono',
          kana: 'この',
          romaji: 'kono',
          english: 'This ___ (near me)',
          note: 'must be followed by a noun — このほん',
        },
        {
          id: 'jpst100:w3:sono',
          kana: 'その',
          romaji: 'sono',
          english: 'That ___ (near you)',
          note: 'must be followed by a noun',
        },
        {
          id: 'jpst100:w3:ano',
          kana: 'あの',
          romaji: 'ano',
          english: 'That ___ over there',
          note: 'must be followed by a noun',
        },
        {
          id: 'jpst100:w3:dono',
          kana: 'どの',
          romaji: 'dono',
          english: 'Which ___',
          note: 'must be followed by a noun — どのかさですか',
        },
        {
          id: 'jpst100:w3:koko',
          kana: 'ここ',
          romaji: 'koko',
          english: 'Here',
        },
        {
          id: 'jpst100:w3:soko',
          kana: 'そこ',
          romaji: 'soko',
          english: 'There (near you)',
        },
        {
          id: 'jpst100:w3:asoko',
          kana: 'あそこ',
          romaji: 'asoko',
          english: 'Over there',
        },
        {
          id: 'jpst100:w3:doko',
          kana: 'どこ',
          romaji: 'doko',
          english: 'Where',
        },
        {
          id: 'jpst100:w3:kochira',
          kana: 'こちら',
          romaji: 'kochira',
          english: 'This way / here (polite)',
        },
        {
          id: 'jpst100:w3:sochira',
          kana: 'そちら',
          romaji: 'sochira',
          english: 'That way / there (polite)',
        },
        {
          id: 'jpst100:w3:achira',
          kana: 'あちら',
          romaji: 'achira',
          english: 'That way over there (polite)',
          note: 'what shop and station staff will say to you',
        },
        {
          id: 'jpst100:w3:dochira',
          kana: 'どちら',
          romaji: 'dochira',
          english: 'Where / which (polite)',
          note: 'as in おくにはどちらですか',
        },
      ],
    },
    {
      id: 'asking',
      label: 'Asking questions',
      items: [
        {
          id: 'jpst100:w3:ikura',
          kana: 'いくら',
          romaji: 'ikura',
          english: 'How much',
          note: 'price only — not "how many"',
        },
        {
          id: 'jpst100:w3:nan',
          kana: 'なん',
          romaji: 'nan',
          english: 'What',
          note: 'the form before です — なんですか, never なにですか',
        },
        {
          id: 'jpst100:w3:dare-no',
          kana: 'だれの',
          romaji: 'dare no',
          english: 'Whose',
          note: 'だれのかさですか, or alone — このかさはだれのですか',
        },
        {
          id: 'jpst100:w3:nihongo-de',
          kana: 'にほんごで',
          romaji: 'nihongo de',
          english: 'In Japanese',
          note: 'にほんごでなんですか — what is it in Japanese?',
        },
        {
          id: 'jpst100:w3:eigo-de',
          kana: 'えいごで',
          romaji: 'eigo de',
          english: 'In English',
        },
        {
          id: 'jpst100:w3:mou-ichido-onegaishimasu',
          kana: 'もういちどおねがいします',
          romaji: 'mou ichido onegaishimasu',
          english: 'Once more, please',
          note: "the rescue phrase when you still don't understand",
        },
      ],
    },
    {
      id: 'shopping',
      label: 'Shopping',
      items: [
        {
          id: 'jpst100:w3:irasshaimase',
          kana: 'いらっしゃいませ',
          romaji: 'irasshaimase',
          english: 'Welcome',
          note: 'said to you by staff — you never say it, and do not reply',
        },
        {
          id: 'jpst100:w3:en',
          kana: 'えん',
          romaji: 'en',
          english: 'Yen',
          note: 'straight after the number, no particle',
        },
        {
          id: 'jpst100:w3:takai',
          kana: 'たかい',
          romaji: 'takai',
          english: 'Expensive',
          note: "たかいですね — that's expensive",
        },
        {
          id: 'jpst100:w3:yasui',
          kana: 'やすい',
          romaji: 'yasui',
          english: 'Cheap',
          note: "やすいですね — that's cheap",
        },
        {
          id: 'jpst100:w3:jaa',
          kana: 'じゃあ',
          romaji: 'jaa',
          english: 'Well then / in that case',
          note: 'marks your decision — じゃあ、これをください',
        },
      ],
    },
    {
      id: 'counting-things',
      label: 'Counting things',
      items: [
        {
          id: 'jpst100:w3:hitotsu',
          kana: 'ひとつ',
          romaji: 'hitotsu',
          english: 'One (thing)',
        },
        {
          id: 'jpst100:w3:futatsu',
          kana: 'ふたつ',
          romaji: 'futatsu',
          english: 'Two (things)',
        },
        {
          id: 'jpst100:w3:mittsu',
          kana: 'みっつ',
          romaji: 'mittsu',
          english: 'Three (things)',
        },
        {
          id: 'jpst100:w3:yottsu',
          kana: 'よっつ',
          romaji: 'yottsu',
          english: 'Four (things)',
        },
        {
          id: 'jpst100:w3:itsutsu',
          kana: 'いつつ',
          romaji: 'itsutsu',
          english: 'Five (things)',
        },
        {
          id: 'jpst100:w3:muttsu',
          kana: 'むっつ',
          romaji: 'muttsu',
          english: 'Six (things)',
        },
        {
          id: 'jpst100:w3:nanatsu',
          kana: 'ななつ',
          romaji: 'nanatsu',
          english: 'Seven (things)',
        },
        {
          id: 'jpst100:w3:yattsu',
          kana: 'やっつ',
          romaji: 'yattsu',
          english: 'Eight (things)',
        },
        {
          id: 'jpst100:w3:kokonotsu',
          kana: 'ここのつ',
          romaji: 'kokonotsu',
          english: 'Nine (things)',
        },
        {
          id: 'jpst100:w3:too',
          kana: 'とお',
          romaji: 'too',
          english: 'Ten (things)',
          note: 'no つ on this one',
        },
      ],
    },
    {
      id: 'places',
      label: 'Places',
      items: [
        {
          id: 'jpst100:w3:toire',
          kana: 'トイレ',
          romaji: 'toire',
          english: 'Restroom (casual)',
          note: 'fine among friends and in casual settings',
        },
        {
          id: 'jpst100:w3:otearai',
          kana: 'おてあらい',
          romaji: 'otearai',
          english: 'Restroom (polite)',
        },
        {
          id: 'jpst100:w3:toshokan',
          kana: 'としょかん',
          romaji: 'toshokan',
          english: 'Library',
        },
        { id: 'jpst100:w3:eki', kana: 'えき', romaji: 'eki', english: 'Station' },
        {
          id: 'jpst100:w3:ginkou',
          kana: 'ぎんこう',
          romaji: 'ginkou',
          english: 'Bank',
        },
        {
          id: 'jpst100:w3:yuubinkyoku',
          kana: 'ゆうびんきょく',
          romaji: 'yuubinkyoku',
          english: 'Post office',
        },
        {
          id: 'jpst100:w3:konbini',
          kana: 'コンビニ',
          romaji: 'konbini',
          english: 'Convenience store',
        },
        {
          id: 'jpst100:w3:kyoushitsu',
          kana: 'きょうしつ',
          romaji: 'kyoushitsu',
          english: 'Classroom',
        },
        {
          id: 'jpst100:w3:nikai',
          kana: 'にかい',
          romaji: 'nikai',
          english: 'Second floor',
          note: 'にかいです — it is on the second floor',
        },
      ],
    },
    {
      id: 'ordering-food',
      label: 'Ordering food',
      items: [
        {
          id: 'jpst100:w3:menyuu',
          kana: 'メニュー',
          romaji: 'menyuu',
          english: 'Menu',
        },
        {
          id: 'jpst100:w3:teishoku',
          kana: 'ていしょく',
          romaji: 'teishoku',
          english: 'Set meal',
        },
        { id: 'jpst100:w3:omizu', kana: 'おみず', romaji: 'omizu', english: 'Water' },
        { id: 'jpst100:w3:ocha', kana: 'おちゃ', romaji: 'ocha', english: 'Tea' },
        {
          id: 'jpst100:w3:onegaishimasu',
          kana: 'おねがいします',
          romaji: 'onegaishimasu',
          english: 'Please (do this for me)',
          note: 'softer than ください, and works for services too — never wrong in a restaurant',
        },
        {
          id: 'jpst100:w3:kashikomarimashita',
          kana: 'かしこまりました',
          romaji: 'kashikomarimashita',
          english: 'Certainly',
          note: 'said by staff',
        },
      ],
    },
  ],
}
