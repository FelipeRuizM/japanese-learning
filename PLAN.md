# PLAN.md — japanese-learning

Companion to `CLAUDE.md` (the spec). Each phase is independently shippable, ends with a
green typecheck + lint + test + build, an `APP_VERSION` bump, a working GitHub Pages
deploy, and one conventional commit. **Stop after every phase and wait for "continue."**

---

## Status — 2026-08-19

Phase 0 is done: `CLAUDE.md` and `PLAN.md` exist and the repo is initialised. No
application code yet. **Phase 1 can start.**

Four decisions were taken with the owner before any code, and are folded into
`CLAUDE.md`:

| | Decision | Where |
|---|---|---|
| **Audio** | Web Speech API, behind a provider interface, with a file provider written but unwired. No open 46-kana audio set exists — three candidate sources checked and ruled out. | §4 |
| **Quiz** | Four-option multiple choice in both directions. Typing kana needs an IME, so typed answers cannot be symmetric. | §6 |
| **Deck** | Starts empty. The empty state is a primary screen because a refresh always returns to it. | §5 |
| **Design** | Its own paper-and-ink palette, same token discipline as the sibling app. | §7 |

---

## Phase 0 — The two documents ✅

- [x] `CLAUDE.md` — the durable spec
- [x] `PLAN.md` — this file
- [x] `git init`, `.gitignore`
- [x] `docs: spec and phased build plan`

## Phase 1 — Scaffold, tokens, styleguide, deploy pipeline

Ships an empty-but-live site, so a broken deploy is never diagnosed at the same time as
broken application logic.

- [ ] Vite + React + TypeScript **strict** scaffold, with `noUncheckedIndexedAccess`,
      `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`,
      `noUnusedParameters`
- [ ] oxlint + prettier; vitest + Testing Library + jsdom, with a setup file
- [ ] `base: '/japanese-learning/'` in `vite.config.ts`
- [ ] Tailwind v4 via `@tailwindcss/vite`, reading `src/styles/tokens.css` through
      `@theme inline` so utilities are generated from the token layer by construction
- [ ] `tokens.css` with the **measured** values from `CLAUDE.md` §7 — every contrast
      figure is in a comment; do not substitute colours by eye
- [ ] **Noto Sans JP + IBM Plex Sans self-hosted** via `@fontsource`; measure the JP
      transfer and record it. Verify a kana renders in Noto, not in the OS fallback
- [ ] `HashRouter` shell: header with `APP_VERSION`, nav, route table, route-level error
      boundary, 404
- [ ] `/styleguide` rendering every token plus the first primitives (Button, Chip,
      Label, hairline Rule, glyph scale)
- [ ] `src/version.ts` — `APP_VERSION = '1.0'`
- [ ] GitHub Actions: typecheck + lint + test + build, deploy to Pages on push to `main`
- [ ] Deployed URL loads and `/styleguide` renders **with no asset 404s**
- [ ] `feat: scaffold, design tokens, styleguide, and pages deploy`

## Phase 2 — Character model, hiragana data, and the registry  ·  *the hinge phase*

The abstraction is decided here. Everything after it consumes a `CharacterSet` and
nothing else.

- [ ] `src/types/characters.ts` per `CLAUDE.md` §3.1
- [ ] `src/characters/hiragana.ts` — the 46 gojūon in eleven rows, gaps as `null`,
      Hepburn romaji, `を` romanised `o`
- [ ] **One to two example words per character**, kana-only, each containing its own
      character; the `を` phrase and the `ん` word per §3.4
- [ ] `src/characters/registry.ts` — `CHARACTER_SETS`, `characterSetById`,
      `allCharacters(set)`
- [ ] Tests: 46 present · ids, glyphs and romaji unique · every character has ≥1 example
      · every example contains its character · every example is kana-only · row shapes
      match `columns.length`
- [ ] **The leak test** — scan `src/` and assert no module outside `src/characters/`
      contains a script name. This is the test that fails first when the abstraction
      starts leaking
- [ ] `feat: character set model and hiragana data`

## Phase 3 — Selection grid and deck state

- [ ] `DeckProvider` + `useDeck` — `Set<string>` of ids, `toggle`, `selectRow`,
      `selectAll`, `clear`. **In memory only**; no storage of any kind
- [ ] `CharacterGrid` branching on `set.layout` — `matrix` today, `flow` written and
      exercised by a fixture set in the styleguide so the kanji path is not theoretical
- [ ] `GridCell` — `aria-pressed` toggle button, ≥44px target, real focus ring, selected
      state inverts to paper-on-indigo
- [ ] Gaps render as empty space, never as a disabled cell
- [ ] Row labels double as per-row select/clear; global select all / clear
- [ ] Persistent deck count with links through to Flashcards and Quiz
- [ ] Deck reducer tests; grid interaction tests
- [ ] 375px-first, then desktop
- [ ] `feat: character grid and deck selection`

## Phase 4 — Pronunciation

- [ ] `src/lib/pronunciation.ts` — the `PronunciationProvider` interface,
      `speechProvider`, and `fileProvider` **written and tested but unwired**
- [ ] The `voiceschanged` race handled; voice resolution by what `getVoices()` returns,
      never by browser sniffing
- [ ] `usePronunciation()` → `{ speak, status }`; the `unavailable` state renders an
      honest "No Japanese voice on this device" beside a disabled control
- [ ] **Speaks the glyph, never the romaji**
- [ ] Tests against a stubbed `speechSynthesis`: empty first call, voice found, no
      Japanese voice at all
- [ ] Added to `/styleguide`
- [ ] `feat: pronunciation providers`

## Phase 5 — Flashcards

- [ ] Deck shuffled once per visit; next / previous; position indicator
- [ ] Front is the glyph alone, very large. Click flips
- [ ] Back reveals romaji + example words with romaji and English, and a replay control
- [ ] The flip plays audio — and **the reveal never depends on it**
- [ ] Designed empty-deck state linking back to the grid
- [ ] `prefers-reduced-motion` collapses the flip to an instant swap
- [ ] `feat: flashcards`

## Phase 6 — Quiz

- [ ] `src/lib/quiz.ts` — pure, `rng` injected, no React
- [ ] Direction 50/50 per question; four options; distractor tiers row → vowel → deck →
      full set
- [ ] The answer never duplicated; **お/を never options in the same question**
- [ ] Tests: both directions occur over a seeded run · tier ordering · no duplicate
      option · the お/を rule · a **two-character deck still yields four distinct
      options**
- [ ] `QuizCard` — immediate feedback carrying a **word and an SVG mark, not colour
      alone**; example word revealed on answer; audio plays
- [ ] In-memory round score, discarded on unmount
- [ ] Designed empty-deck state
- [ ] `feat: two-direction quiz`

## Phase 7 — Quality pass

- [ ] Full Vitest suite green against every item in `CLAUDE.md` §8
- [ ] Keyboard navigation end to end; real focus states; semantic headings
- [ ] axe clean on every route; Lighthouse mobile performance and accessibility ≥ 90
- [ ] Empty-state audit — no bare "No data" anywhere
- [ ] Console clean on a fresh run
- [ ] `chore: quality pass — tests, a11y, and lighthouse`

---

## Notes on sequencing

- **Phase 1 ships a live site before any data code exists.** A blank Pages deploy caused
  by a wrong `base` is the single most likely failure in this project, and it should not
  be discovered on top of a data bug.
- **Phase 2 is the hinge.** The character-set abstraction is the whole reason katakana
  and kanji will not need a rewrite, and the leak test is what keeps it honest. Nothing
  broadens until it is in place.
- **The grid precedes flashcards and quiz** because both consume a deck, and a deck
  cannot be filled without the grid.
- **Pronunciation is its own phase, before the two surfaces that use it**, so the
  no-voice path is designed rather than patched in once flashcards already assume sound.
- **The quiz is last of the feature phases.** It is the only one with real logic, it is
  the widest consumer of the model, and it is where an abstraction that did not hold
  would surface.
