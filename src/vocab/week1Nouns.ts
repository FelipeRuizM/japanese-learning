import type { VocabSet } from '../types/vocab'

/**
 * JPST 100, Week 1 — the everyday words the の note is built out of.
 *
 * These are not a vocabulary list the class handed out; they are the nouns its
 * grammar examples use (わたしの本, 先生の車, 友達の犬の名前, 赤いのをください).
 * They are collected here because the の drill needs words to connect, and
 * because a learner who cannot read 犬 cannot practise the particle either.
 *
 * Every example is an の phrase, straight from the note.
 */
export const WEEK1_NOUNS: VocabSet = {
  id: 'jpst100-w1-nouns',
  label: 'Week 1 · Everyday words',
  source: 'JPST 100 — Week 1 — Grammar: No',
  groups: [
    {
      id: 'things',
      label: 'Things',
      items: [
        {
          id: 'jpst100:w1:hon',
          kana: 'ほん',
          romaji: 'hon',
          english: 'book',
          example: {
            kana: 'わたしのほん',
            romaji: 'watashi no hon',
            english: 'my book',
          },
        },
        {
          id: 'jpst100:w1:kuruma',
          kana: 'くるま',
          romaji: 'kuruma',
          english: 'car',
          example: {
            kana: 'せんせいのくるま',
            romaji: 'sensei no kuruma',
            english: "the teacher's car",
          },
        },
        {
          id: 'jpst100:w1:namae',
          kana: 'なまえ',
          romaji: 'namae',
          english: 'name',
          example: {
            kana: 'ともだちのいぬのなまえ',
            romaji: 'tomodachi no inu no namae',
            english: "my friend's dog's name",
          },
        },
      ],
    },
    {
      id: 'people-and-animals',
      label: 'People & animals',
      items: [
        {
          id: 'jpst100:w1:tomodachi',
          kana: 'ともだち',
          romaji: 'tomodachi',
          english: 'friend',
        },
        {
          id: 'jpst100:w1:inu',
          kana: 'いぬ',
          romaji: 'inu',
          english: 'dog',
          example: {
            kana: 'ともだちのいぬ',
            romaji: 'tomodachi no inu',
            english: "my friend's dog",
          },
        },
      ],
    },
    {
      id: 'asking-for-things',
      label: 'Asking for things',
      items: [
        {
          id: 'jpst100:w1:akai',
          kana: 'あかい',
          romaji: 'akai',
          english: 'red',
        },
        {
          id: 'jpst100:w1:kudasai',
          kana: 'ください',
          romaji: 'kudasai',
          english: 'please give me ___',
          example: {
            kana: 'あかいのをください',
            romaji: 'akai no o kudasai',
            english: 'please give me the red one',
          },
        },
      ],
    },
  ],
}
