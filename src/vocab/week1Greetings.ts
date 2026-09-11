import type { VocabSet } from '../types/vocab'

/**
 * JPST 100, Week 1 — the classroom greetings and set phrases.
 *
 * Transcribed from the class note. Every one of these is a complete utterance,
 * which is why none carries an example sentence: いただきます IS the sentence.
 *
 * Romaji is written the way the class writes it — long vowels doubled
 * (`ohayoo`, `sayoonara`, `gochisoosama`) rather than macronned. Matching the
 * course matters more here than matching Hepburn's macrons, because these are
 * the strings the learner is being marked on.
 */
export const WEEK1_GREETINGS: VocabSet = {
  id: 'jpst100-w1-greetings',
  label: 'Week 1 · Greetings',
  source: 'JPST 100 — Week 1 — Greetings & Set Phrases',
  groups: [
    {
      id: 'daily',
      label: 'Daily greetings',
      items: [
        {
          id: 'jpst100:w1:ohayoo',
          kana: 'おはよう',
          romaji: 'ohayoo',
          english: 'Good morning',
          note: 'casual',
        },
        {
          id: 'jpst100:w1:ohayoo-gozaimasu',
          kana: 'おはようございます',
          romaji: 'ohayoo gozaimasu',
          english: 'Good morning',
          note: 'polite',
        },
        {
          id: 'jpst100:w1:konnichiwa',
          kana: 'こんにちは',
          romaji: 'konnichiwa',
          english: 'Hello — good afternoon',
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
          note: 'fairly final — seeing someone off for a while',
        },
      ],
    },
    {
      id: 'coming-and-going',
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
        {
          id: 'jpst100:w1:tadaima',
          kana: 'ただいま',
          romaji: 'tadaima',
          english: "I'm home",
          note: 'said by the person arriving',
        },
        {
          id: 'jpst100:w1:okaeri-nasai',
          kana: 'おかえりなさい',
          romaji: 'okaeri nasai',
          english: 'Welcome home',
          note: 'said by the person greeting them',
        },
      ],
    },
    {
      id: 'meals',
      label: 'Meals',
      items: [
        {
          id: 'jpst100:w1:itadakimasu',
          kana: 'いただきます',
          romaji: 'itadakimasu',
          english: 'I gratefully receive this meal',
          note: 'said before eating',
        },
        {
          id: 'jpst100:w1:gochisoosama-deshita',
          kana: 'ごちそうさまでした',
          romaji: 'gochisoosama deshita',
          english: 'Thank you for the meal',
          note: 'said after eating',
        },
      ],
    },
    {
      id: 'thanks',
      label: 'Thanks, apologies & basics',
      items: [
        {
          id: 'jpst100:w1:arigatoo',
          kana: 'ありがとう',
          romaji: 'arigatoo',
          english: 'Thank you',
          note: 'casual',
        },
        {
          id: 'jpst100:w1:arigatoo-gozaimasu',
          kana: 'ありがとうございます',
          romaji: 'arigatoo gozaimasu',
          english: 'Thank you',
          note: 'polite',
        },
        {
          id: 'jpst100:w1:sumimasen',
          kana: 'すみません',
          romaji: 'sumimasen',
          english: 'Excuse me — sorry',
          note: "also how you get someone's attention",
        },
        {
          id: 'jpst100:w1:iie',
          kana: 'いいえ',
          romaji: 'iie',
          english: 'No — not at all',
          note: 'also a polite deflection after being thanked',
        },
      ],
    },
  ],
}
