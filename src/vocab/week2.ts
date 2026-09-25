import type { VocabSet } from '../types/vocab'

/**
 * JPST 100, WEEK 2 — transcribed from the family note.
 *
 * THERE IS NO SUMMARY NOTE FOR THIS WEEK. The folder holds two topic notes and
 * no `! Things I've learned this week`, so the rule in §11.2 — the summary note
 * is the only source — has nothing to point at. The family note's table is the
 * source instead, and `source` names it so a card can still be checked. The
 * other note in the folder, Useful Expressions, is excluded at the owner's
 * request.
 *
 * THE NOTE'S ONE TABLE HAS TWO COLUMNS OF WORDS, AND EACH COLUMN IS A GROUP.
 * "My family" and "someone else's family" are the whole lesson, so they are
 * the two topics a learner would want to drill apart — and splitting them is
 * what lets the scope picker offer "just the honorifics".
 *
 * THE MEANING CARRIES WHOSE FAMILY IT IS. The note's Relation column says
 * "Father" for both ちち and おとうさん; glossed that way, the quiz would have to
 * keep the pair apart as a collision (§11.2), and that pair is precisely the
 * confusion worth asking about. "Father (my own)" beside "Father (someone
 * else's)" is the column header folded into the meaning, not an invention.
 *
 * ROMAJI IS SUPPLIED, because the table has no romaji column. It is written in
 * the class's style — long vowels spelled out (`otousan`, `oniisan`), as the
 * note's own conversation table writes `Gokazoku` and `Oniisan`.
 */
export const WEEK2: VocabSet = {
  id: 'jpst100-w2',
  label: 'Week 2',
  source: 'JPST 100 — Week 2 — Family (かぞく) - AI',
  groups: [
    {
      id: 'my-family',
      label: 'My family (humble)',
      items: [
        {
          id: 'jpst100:w2:chichi',
          kana: 'ちち',
          romaji: 'chichi',
          english: 'Father (my own)',
          note: 'talking about him to others — almost never said to him',
        },
        {
          id: 'jpst100:w2:haha',
          kana: 'はは',
          romaji: 'haha',
          english: 'Mother (my own)',
          note: 'talking about her to others — almost never said to her',
        },
        {
          id: 'jpst100:w2:ani',
          kana: 'あに',
          romaji: 'ani',
          english: 'Older brother (my own)',
        },
        {
          id: 'jpst100:w2:ane',
          kana: 'あね',
          romaji: 'ane',
          english: 'Older sister (my own)',
        },
        {
          id: 'jpst100:w2:otouto',
          kana: 'おとうと',
          romaji: 'otouto',
          english: 'Younger brother (my own)',
        },
        {
          id: 'jpst100:w2:imouto',
          kana: 'いもうと',
          romaji: 'imouto',
          english: 'Younger sister (my own)',
        },
        {
          id: 'jpst100:w2:otto',
          kana: 'おっと',
          romaji: 'otto',
          english: 'Husband (my own)',
        },
        {
          id: 'jpst100:w2:tsuma',
          kana: 'つま',
          romaji: 'tsuma',
          english: 'Wife (my own)',
        },
        {
          id: 'jpst100:w2:kodomo',
          kana: 'こども',
          romaji: 'kodomo',
          english: 'Child (my own)',
        },
        {
          id: 'jpst100:w2:kazoku',
          kana: 'かぞく',
          romaji: 'kazoku',
          english: 'Family (my own)',
        },
      ],
    },
    {
      id: 'others-family',
      label: "Someone else's family (honorific)",
      items: [
        {
          id: 'jpst100:w2:otousan',
          kana: 'おとうさん',
          romaji: 'otousan',
          english: "Father (someone else's)",
          note: 'also what you call your own father to his face',
        },
        {
          id: 'jpst100:w2:okaasan',
          kana: 'おかあさん',
          romaji: 'okaasan',
          english: "Mother (someone else's)",
          note: 'also what you call your own mother to her face',
        },
        {
          id: 'jpst100:w2:oniisan',
          kana: 'おにいさん',
          romaji: 'oniisan',
          english: "Older brother (someone else's)",
        },
        {
          id: 'jpst100:w2:oneesan',
          kana: 'おねえさん',
          romaji: 'oneesan',
          english: "Older sister (someone else's)",
        },
        {
          id: 'jpst100:w2:otoutosan',
          kana: 'おとうとさん',
          romaji: 'otoutosan',
          english: "Younger brother (someone else's)",
          note: 'younger siblings just add さん',
        },
        {
          id: 'jpst100:w2:imoutosan',
          kana: 'いもうとさん',
          romaji: 'imoutosan',
          english: "Younger sister (someone else's)",
          note: 'younger siblings just add さん',
        },
        {
          id: 'jpst100:w2:goshujin',
          kana: 'ごしゅじん',
          romaji: 'goshujin',
          english: "Husband (someone else's)",
          note: 'ご, not お',
        },
        {
          id: 'jpst100:w2:okusan',
          kana: 'おくさん',
          romaji: 'okusan',
          english: "Wife (someone else's)",
        },
        {
          id: 'jpst100:w2:okosan',
          kana: 'おこさん',
          romaji: 'okosan',
          english: "Child (someone else's)",
        },
        {
          id: 'jpst100:w2:gokazoku',
          kana: 'ごかぞく',
          romaji: 'gokazoku',
          english: "Family (someone else's)",
          note: 'ご, not お — as in ごかぞくはなんにんですか',
        },
      ],
    },
  ],
}
