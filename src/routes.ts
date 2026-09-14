/**
 * EVERY PATH IN THE APP, and the shape the shell navigates by.
 *
 * The two pillars (§1) are the top level of the address space now, not just a
 * heading in a menu: `#/kana/quiz` and `#/course/grammar` say which "Quiz" and
 * which drill they are, where `#/quiz` and `#/grammar` left that to the reader.
 *
 * ONE MODULE, because the paths have three consumers that must agree — the
 * router, the shell's navigation, and the handful of in-page links that send
 * someone to another screen ("Change selection", "Quiz me"). A string literal
 * in a `<ButtonLink>` is exactly what survives a restructure and quietly 404s.
 *
 * `routes.ts` sits at the top of `src/` beside `version.ts` for the same
 * reason: it belongs to the application rather than to any one folder under it.
 */

export const PATHS = {
  characters: '/kana',
  flashcards: '/kana/flashcards',
  quiz: '/kana/quiz',
  sounds: '/kana/pronunciation',
  writing: '/kana/writing',
  vocabulary: '/course',
  numbers: '/course/numbers',
  grammar: '/course/grammar',
  styleguide: '/styleguide',
} as const

export type NavSection = {
  path: string
  label: string
  /**
   * Whether the link matches only its exact path. True for a pillar's landing
   * section, whose path is a prefix of every other section in that pillar —
   * without it, "Characters" stays marked active while you are on Writing.
   */
  end: boolean
}

export type NavPillar = {
  id: string
  label: string
  /** Where the pillar opens. The same path as its first section. */
  path: string
  sections: NavSection[]
}

/**
 * The two pillars and what each one holds.
 *
 * A pillar's FIRST section is its landing page, rather than a separate overview
 * screen. An overview listing five links, reached by clicking a sidebar entry
 * that could have gone straight to one of them, is a click that buys a menu.
 */
export const PILLARS: readonly NavPillar[] = [
  {
    id: 'kana',
    label: 'Kana',
    path: PATHS.characters,
    sections: [
      { path: PATHS.characters, label: 'Characters', end: true },
      { path: PATHS.flashcards, label: 'Flashcards', end: false },
      { path: PATHS.quiz, label: 'Quiz', end: false },
      { path: PATHS.sounds, label: 'Sounds', end: false },
      { path: PATHS.writing, label: 'Writing', end: false },
    ],
  },
  {
    id: 'course',
    label: 'Course',
    path: PATHS.vocabulary,
    sections: [
      { path: PATHS.vocabulary, label: 'Vocabulary', end: true },
      { path: PATHS.numbers, label: 'Numbers', end: false },
      { path: PATHS.grammar, label: 'Grammar', end: false },
    ],
  },
]

/**
 * Which pillar a path belongs to, or `undefined` for the pages that belong to
 * neither — the styleguide and the 404. Those render no section bar, because a
 * bar of five kana activities above a "page not found" would be furniture
 * claiming you are somewhere you are not.
 *
 * Matched on the path SEGMENT, not with `startsWith`: a future `/kana-notes`
 * starts with `/kana` and is not in it.
 */
export function pillarForPath(pathname: string): NavPillar | undefined {
  const segment = `/${pathname.split('/').filter(Boolean)[0] ?? ''}`
  return PILLARS.find((pillar) => pillar.path.split('/')[1] === segment.slice(1))
}
