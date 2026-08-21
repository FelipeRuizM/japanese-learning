# PLAN.md — japanese-learning

Companion to `CLAUDE.md` (the spec). Each phase is independently shippable, ends with a
green typecheck + lint + test + build, an `APP_VERSION` bump, a working GitHub Pages
deploy, and one conventional commit. **Stop after every phase and wait for "continue."**

---

## Status — 2026-08-21

**Complete at v2.0.** All seven phases are done and all five original features are
built, plus two added on request — the **pronunciation chart** and **writing practice** —
the **dakuten/handakuten rows**, and **katakana**. The app teaches **142 characters
across two scripts**.

Phase 5 was skipped at the owner's request and built after Phase 6, out of order — the
quiz did not depend on it.

> **Nothing has been deployed.** The repository has no GitHub remote, so the Actions
> workflow has never run. Create a repo named `japanese-learning`, push `main`, and set
> Pages to build from _GitHub Actions_. If the repo takes a different name, `base` in
> `vite.config.ts` changes with it.

Between phases 1 and 2 the owner asked for **dark mode only**, reversing the light
"paper and ink" direction v1.0 shipped with. The palette was re-derived and re-measured
against the new ground rather than flipped by eye; `CLAUDE.md` §7 records both the
reversal and the colourblind sweep behind it. Shipped as **v1.1**.

**Katakana landed in v2.0 as a data module plus one registry entry, exactly as this
line predicted.** Kanji is what remains, and it is the one that needs the `flow` layout
branch.

## Post-1.7 — the pronunciation chart ✅

Owner-requested, not from the original plan.

- [x] `#/pronunciation` and a **Sounds** nav entry
- [x] `GridLayout` extracted — the chart shape, with render props for the cell and the
      row label. Both grids share it, so the matrix/flow branches cannot drift apart
- [x] `SoundCell` — an action, **not** a toggle, so no `aria-pressed`
- [x] Reads the **whole set**, not the deck: a reference, not a drill
- [x] **Never disabled, and a tap always answers.** On a device with no Japanese voice
      the screen's entire purpose would otherwise be silence, so the tapped character is
      echoed below the chart with its reading and an example word, under `aria-live`
- [x] Added to `/styleguide`; the audit script covers the new route and its tapped state
- [x] Tests: whole set present · speaks the glyph and not the romaji · echoes the
      reading and example · **still answers with no Japanese voice** · marks the last
      tap · carries no `aria-pressed`
- [x] **Verified in a browser** with a Japanese voice injected: tapping か then ね speaks
      "か","ね", each preceded by a cancel so no backlog builds, no overflow, no errors
- [x] Re-audited: **0 axe violations across ten route/state combinations**, Lighthouse
      mobile 98 / 100 / 100 / 100
- [x] `feat: a pronunciation chart`

**Deployed as 1.8.** 123 tests across 18 files.

## Post-1.8 — dakuten, handakuten, and writing practice ✅

Owner-requested.

**The voiced rows (v1.9).** が ざ だ ば and ぱ — 25 characters, taking the set to 71.

- [x] `CLAUDE.md` §3.3 predicted these would be "additional rows needing no type
      change". **That held exactly**: `src/characters/hiragana.ts` was the only source
      file touched. No component, no type, no layout change
- [x] 25 example words, kana-only, each containing its character
- [x] **Two new homophone pairs**: じ/ぢ are both `ji`, ず/づ are both `zu`. Ids stay
      unique because they come from the written form — `di`, `du`
- [x] **Exactly one test failed** when the data landed: the one asserting a single
      romaji collision. The quiz's exclusion is keyed on romaji rather than on the
      お/を pair, so it absorbed both new pairs with no change — the generality written
      in Phase 6 paying off
- [x] The test now pins all three pairs, so a fourth cannot appear unnoticed

**Writing practice (v1.9)** — `#/writing`.

- [x] Play a random character, show its romaji, write it on paper, reveal to check
- [x] **The glyph is not in the DOM before the reveal** — not CSS-hidden, which would
      leave it for a screen reader. Rendering it early turns the exercise into copying
- [x] No answer capture, deliberately: producing a shape is the skill a keyboard cannot
      exercise
- [x] Never draws the same character twice running
- [x] Uses the deck when there is one and the whole set otherwise, and **says which** —
      requiring a selection before the first sound would be friction for no gain
- [x] Tests: the glyph stays hidden until revealed · the reveal matches what was spoken
      · the answer re-hides on the next sound · no back-to-back repeats · the pool
      follows the deck · replay does not advance
- [x] **A regression the browser caught that no test would have**: a fifth nav tab made
      the header 415px wide, overflowing **every** page at 375px. The nav wraps now, and
      overflow is 0 on all five routes down to a 320px viewport
- [x] Re-audited: **0 axe violations across twelve route/state combinations**,
      Lighthouse mobile 97 / 100 / 100 / 100
- [x] `feat: dakuten and handakuten rows, and writing practice`

**Deployed as 1.9.** 133 tests across 19 files.

Four decisions were taken with the owner before any code, and are folded into
`CLAUDE.md`:

|            | Decision                                                                                                                                                                 | Where |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| **Audio**  | Web Speech API, behind a provider interface, with a file provider written but unwired. No open 46-kana audio set exists — three candidate sources checked and ruled out. | §4    |
| **Quiz**   | Four-option multiple choice in both directions. Typing kana needs an IME, so typed answers cannot be symmetric.                                                          | §6    |
| **Deck**   | Starts empty. The empty state is a primary screen because a refresh always returns to it.                                                                                | §5    |
| **Design** | Its own paper-and-ink palette, same token discipline as the sibling app.                                                                                                 | §7    |

## Post-1.9 — katakana ✅

Owner-requested. **The claim the character-set model has been making since Phase 2, cashed.**

Three decisions were taken with the owner before any code:

|            | Decision                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| **Picker** | One chart at a time, behind a picker — 142 cells stacked is twice the scroll at 375px, and worse per set. |
| **Deck**   | One deck spanning both scripts, so あ and ア can be drilled against each other.                           |
| **Scope**  | All 71, mirroring the other chart. A katakana chart stopping short of ガ would be the odd one out.        |

**What it cost, honestly** — the long version is `CLAUDE.md` §3.5.

- [x] `src/characters/katakana.ts` — 71 characters in the same sixteen rows, the same
      gaps, the same three homophone pairs, and 72 loanword examples
- [x] **One registry entry.** No type changed. `quiz.ts`, `shuffle.ts`, the deck
      reducer, `CharacterGrid`, `GridLayout`, `GridCell`, `SoundCell`, `Flashcard` and
      `QuizCard` were **not touched at all**
- [x] **The quiz absorbed 71 new homophone pairs with no edit.** `collides` was keyed on
      romaji rather than on the お/を pair back in Phase 6; あ/ア and every other twin
      fell out of that for free. New tests pin it in both directions, including a deck
      holding nothing but one pair
- [x] `SetPicker` — takes the registry, reports an id, `aria-pressed` like a grid cell,
      and **renders nothing when only one set is registered**, so no page counts the
      registry itself
- [x] `useCharacterSet` — per-page, NOT a second context. §2 allows one and the deck has
      it; the deck is what is worth carrying between screens, and it does
- [x] `DeckSummary` re-thought for a deck that outgrew the chart above it: counts within
      the visible chart, states the rest separately, and scopes `Select all` / `Clear
all` to what you can see. Wiping everything is a separate, named control
- [x] The writing prompt **names the script** — "a" cannot be answered when あ and ア are
      both "a". From `character.script` through the registry, never hardcoded
- [x] **A latent defect the second script exposed:** `SpeakButton` built its
      `aria-label` from the glyph, which on the writing screen put the answer in the DOM
      before the reveal — precisely what §1 forbids. axe could not have caught it: the
      button was correctly labelled, it was just labelled with the answer. It takes a
      `label` override now, and a test asserts no glyph reaches that name
- [x] **The font needed nothing.** The Phase 1 subset already covered U+3040–30FF on the
      grounds that katakana was coming. Verified by re-subsetting the shipped file:
      カ, ヅ, ー and ヲ each yield a real outline (852–1020 bytes) while 漢 collapses to
      the 620-byte empty baseline
- [x] **Verified in a real browser**: zero horizontal overflow on all six routes at both
      375px and **320px** with the second chart showing, 71 cells at a 64.5px hit
      target, no console output
- [x] Re-audited: **0 axe violations across fifteen route/state combinations** — three
      new ones covering the second chart on both pickers and a deck spanning both
      scripts — Lighthouse mobile 96–97 / 100 / 100 / 100, no failed audits
- [x] `feat: katakana`

**Deployed as 2.0.** 173 tests across 21 files. Bundle 97.25 KB gzip, up from 93.85 —
the second set is data, and nothing renders more than one chart at a time.

---

## Phase 0 — The two documents ✅

- [x] `CLAUDE.md` — the durable spec
- [x] `PLAN.md` — this file
- [x] `git init`, `.gitignore`
- [x] `docs: spec and phased build plan`

## Phase 1 — Scaffold, tokens, styleguide, deploy pipeline ✅

Ships an empty-but-live site, so a broken deploy is never diagnosed at the same time as
broken application logic.

- [x] Vite 8 + React 19 + TypeScript 6 **strict** scaffold, with
      `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
      `noUnusedLocals`, `noUnusedParameters`
- [x] oxlint + prettier; vitest + Testing Library + jsdom, with a setup file
- [x] `base: '/japanese-learning/'` in `vite.config.ts`
- [x] Tailwind v4 via `@tailwindcss/vite`, reading `src/styles/tokens.css` through
      `@theme inline` so utilities are generated from the token layer by construction
- [x] `tokens.css` with the **measured** values from `CLAUDE.md` §7 — every contrast
      figure is in a comment
- [x] **Noto Sans JP hand-subsetted to 43.5 KB**, IBM Plex Sans self-hosted.
      @fontsource's own `japanese` subset is one ~1 MB woff2 with no unicode-range
      split, which would have been the dominant asset on the site;
      `scripts/subset-jp-font.mjs` cuts it by **95.6%** to the Hiragana + Katakana
      blocks (194 glyphs) and the output is committed
- [x] **Kana presence in the subset verified programmatically** — re-subsetting the
      shipped file to あ / ん / を / ネ each yields a real outline, while 漢 collapses
      to the empty baseline. Kana in, kanji out, as designed
- [x] `HashRouter` shell (`createHashRouter`, so `useRouteError` has a data router):
      header with `APP_VERSION`, nav, route table, route-level error boundary, 404
- [x] `/styleguide` rendering every token plus the first primitives (Button, Chip,
      Label, hairline Rule, Glyph scale, the semantic feedback pair)
- [x] `src/version.ts` — `APP_VERSION = '1.0'`
- [x] GitHub Actions: typecheck + lint + test + build, deploy to Pages on push to `main`
- [x] **Every asset verified 200 under the base path** against a real preview server —
      JS, CSS, all five fonts, the favicon, and a deep hash route
- [x] `feat: scaffold, design tokens, styleguide, and pages deploy`

**Deployed as 1.0.** Bundle: 91 KB gzip JS (React + Router), 4.1 KB gzip CSS, fonts
loaded on demand by unicode-range.

**Not done, deliberately:** the routes for Characters, Flashcards and Quiz are honest
placeholders naming the phase that fills them. They do not pretend to work.

## Phase 2 — Character model, hiragana data, and the registry ✅ · _the hinge phase_

The abstraction is decided here. Everything after it consumes a `CharacterSet` and
nothing else.

- [x] `src/types/characters.ts` per `CLAUDE.md` §3.1
- [x] `src/characters/hiragana.ts` — the 46 gojūon in eleven rows, gaps as `null`,
      Hepburn romaji, `を` romanised `o` with id `hiragana:wo`
- [x] **51 example words**, kana-only, each containing its own character; the `を`
      phrase and the `ん` word per §3.4
- [x] `src/characters/registry.ts` — `CHARACTER_SETS`, `characterSetById`,
      `allCharacters`, `everyCharacter`, `characterById`
- [x] Tests: 46 present · ids and glyphs unique · **exactly one romaji collision, pinned
      to お/を** · ん is the only character with no vowel · every other character sits in
      the column its vowel names · gaps preserved (2 in the や-row, 3 in the わ-row) ·
      every character has ≥1 example · every example contains its character · every
      example is hiragana-only
- [x] **The leak test** — `tests/abstraction.test.ts`. It caught a real leak on its first
      run: the Characters page named the script in its placeholder copy
- [x] `feat: character set model and hiragana data`

**Deployed as 1.2.** 25 tests across 5 files.

**Two things the implementation forced:**

- **The allowlist is two paths, not one.** `ScriptId` is a type-level fact and has to
  live in `src/types/characters.ts`; the original "only `src/characters/` may name a
  script" was unimplementable as written. `CLAUDE.md` §3.2 now states both.
- **The leak test moved to `tests/`.** It reads the file system, and
  `tsconfig.app.json` withholds Node's types from application code on purpose. Putting
  it beside the code would have meant letting `process` and `node:fs` into the app's
  type environment to satisfy one test.

## Phase 3 — Selection grid and deck state ✅

- [x] `DeckProvider` + `useDeck` — `Set<string>` of ids, `toggle`, `select`, `deselect`,
      `clear`. **In memory only**; no storage of any kind
- [x] The reducer is pure and lives apart from the provider (`src/data/deck.ts`), and
      **returns the same object on a no-op** so React can skip re-rendering all 46 cells
      when an already-full row is pressed — which happens, because the row label is a
      toggle
- [x] `CharacterGrid` branching on `set.layout`; the `flow` branch is exercised by
      `FLOW_FIXTURE` on /styleguide **and by a test**, so the no-matrix path is a
      capability rather than a claim
- [x] `GridCell` — `aria-pressed` toggle button, explicit accessible name, ≥44px target,
      selected state inverts to ground-on-accent
- [x] Gaps render as empty space, never as a disabled cell
- [x] Row labels double as per-row select/clear; global select all / clear
- [x] Persistent deck count; through-links to Flashcards and Quiz appear only once
      something is selected, since with an empty deck they open onto an empty state
- [x] `ButtonLink` primitive — a real `<Link>` sharing the button's styling, so a
      navigation control is a link to a screen reader rather than a styled button
- [x] Deck reducer tests, grid interaction tests, page-level tests
- [x] **Verified in a real browser at 375px**, not only in jsdom: 46 cells, none under
      44px, zero horizontal overflow, kana drawn in the shipped webfont, no console
      errors, and the selected cell measured at the validated ground-on-accent pair
- [x] `feat: character grid and deck selection`

**Deployed as 1.3.** 48 tests across 8 files. Bundle 93.85 KB gzip.

**Three things the browser caught that jsdom could not:**

- **Two rows both displayed "N"** — the な-row and ん. Ambiguous on screen and worse as
  an accessible name ("Select the N-row" vs "Select the N"). ん is now **"Final N"**,
  and a test pins row-label uniqueness.
- The label column was too narrow for the longest label and needed widening.
- A selected cell measured as _translucent_ accent — which turned out to be
  `transition-colors` caught mid-flight, not a bug. Settled, it is the validated
  7.93:1 ground-on-accent pair. Worth knowing before someone "fixes" it.

## Phase 4 — Pronunciation ✅

- [x] `src/lib/pronunciation.ts` — the `PronunciationProvider` interface,
      `createSpeechProvider`, and `createFileProvider` **written and tested but unwired**
- [x] The `voiceschanged` race handled; voice resolution by what `getVoices()` reports,
      never by browser sniffing, and `ja_JP` with an underscore matches too
- [x] Resolution cached per synth object — no test-only reset hatch in shipping code
- [x] `usePronunciation()` → `{ speak, status }` with **three** states; the
      `unavailable` control is disabled and explains itself rather than hiding
- [x] **Speaks the glyph, never the romaji** — tested explicitly
- [x] `speak` cancels anything in flight, so clicking quickly builds no backlog
- [x] Errors resolve rather than reject: revealing romaji must never require a `catch`
- [x] `SpeakButton` + `PronunciationNote`, added to `/styleguide` in all three states
      plus a live control wired to the real device
- [x] **Verified in a real browser, both paths.** Headless Chromium has the API and five
      voices, none Japanese → resolves to `unavailable` immediately and shows the note.
      With a Japanese voice injected and `getVoices()` starting empty, the late
      `voiceschanged` resolves it to `ready`, and a click speaks か — the glyph — after
      a `cancel()`
- [x] `feat: pronunciation providers`

**Deployed as 1.4.** 72 tests across 11 files.

**Two corrections the implementation forced:**

- **`checking` is a third status**, against the original two in `CLAUDE.md` §4.2.
  Collapsing "still resolving" into "unavailable" would flash the no-voice message at
  every user on first paint. Whether the API _exists_ is synchronous and now decides
  the initial value during render.
- **oxlint caught a cascading render** — `setState` called synchronously inside the
  effect for a fact already knowable at render time. Fixed by deriving the initial
  state with a lazy initialiser.

## Phase 5 — Flashcards ✅ · _built after Phase 6, out of order_

- [x] Deck shuffled once per visit; next / previous; position indicator
- [x] Front is the glyph alone, very large. Click flips
- [x] Back reveals the romaji; example words with romaji and English, and a replay
      control, sit below the card
- [x] The flip plays audio on the REVEAL only — flipping back is silent — and the
      reveal never depends on it
- [x] A new card always starts face down; carrying the flip across would hand over the
      next answer for free
- [x] Designed empty-deck state linking back to the grid
- [x] `prefers-reduced-motion` collapses the flip to an instant swap, through the
      global rule in `index.css` — nothing in the component checks for it
- [x] Added to `/styleguide`
- [x] **Verified in a real browser**: the card really rotates (`matrix3d`), the next
      card starts face down, no horizontal overflow at 375px, no console errors
- [x] `feat: flashcards`

**Deployed as 1.6.** 109 tests across 15 files.

**Two constraints the implementation ran into:**

- **Both faces have to be in the DOM at once**, or there is nothing to flip to. That
  puts the answer on the page before it is revealed — handled for sighted users by
  `backface-visibility`, and for screen readers by marking both faces `aria-hidden` and
  naming the button explicitly. A test asserts the reading stays out of the accessible
  name until the flip.
- **The replay control cannot live on the back face**, because a button cannot contain
  another button. It sits with the example words below the card.

## Phase 6 — Quiz ✅

- [x] `src/lib/quiz.ts` — pure, `rng` injected, no React; the UI holds no question logic
- [x] `src/lib/shuffle.ts` — Fisher-Yates, not `sort(() => rng() - 0.5)`, which is not a
      uniform shuffle and biases toward the input order
- [x] Direction chosen 50/50 **per question**, so a learner cannot settle into one
- [x] Four options; distractors ranked by confusability — same row, then same vowel,
      then the rest — drawn from the deck before the full set
- [x] The answer never duplicated; **お/を never in the same question**, keyed on romaji
      rather than on that specific pair so a future homophone is handled too
- [x] Tests: both directions occur · row-then-vowel tier order · deck before full set ·
      no duplicate displayed value · the お/を rule **including the subtle case** where
      the answer is a third character and both could be drawn as distractors · a
      two-character deck still yielding four distinct options · a one-character deck too
- [x] `QuizCard` — feedback carries a **word and an SVG mark**, and semantic colour is
      an outline and text, never a fill; both the right answer and a wrong choice are
      marked, since showing only the choice strands someone who guessed
- [x] Example word revealed on answering; audio plays on the reveal
- [x] In-memory round score, discarded on unmount
- [x] `EmptyDeck` — a designed primary screen, because every refresh lands there
- [x] `QuizCard` and `EmptyDeck` added to `/styleguide`
- [x] **Verified in a real browser**: 40 questions walked, always four options, never a
      duplicate, both directions seen, no console errors — then a full 46-question round
      confirming **8 questions involved お or を and none held both**
- [x] `feat: two-direction quiz`

**Deployed as 1.5.** 100 tests across 14 files.

**Two things worth keeping:**

- **"Go again" remounts the round rather than reloading the page.** The deck lives in
  memory by design, so a reload would throw the selection away and strand the learner on
  an empty grid. The first draft called `window.location.reload()`.
- **The round is built with `useState`'s initialiser, not `useMemo`.** React is free to
  discard a `useMemo` and recompute it, which would reshuffle the questions underneath
  the learner mid-round.

## Phase 7 — Quality pass ✅

- [x] Full Vitest suite green against every item in `CLAUDE.md` §8 — **116 tests across
      17 files**
- [x] Keyboard navigation end to end, verified in a browser: every stop reachable, tab
      order nav → controls → cells, **a visible focus ring on every one**, and a quiz
      question answerable with the keyboard alone (focus lands on _Next_ afterwards)
- [x] Semantic headings — **two routes were missing one; see below**
- [x] **axe clean on every route AND in the states that matter**: empty deck, row
      selected, card flipped, question answered. Eight combinations, **0 violations**
- [x] **Lighthouse mobile: performance 97–98, accessibility 100, best practices 100,
      SEO 100** — no failed audits
- [x] `prefers-reduced-motion` measured, not assumed: the flip goes from 0.3s to
      0.00001s
- [x] Empty-state audit — no bare "No data", and no placeholder copy left anywhere
- [x] Console clean: **no errors or warnings on any route, in any state**
- [x] Route-level error boundary finally exercised by a test — it was in §8 from the
      start and had never been run
- [x] `scripts/audit-a11y.mjs` committed, so the audit is repeatable rather than a
      one-off claim
- [x] `chore: quality pass — tests, a11y, and lighthouse`

**Deployed as 1.7.**

**Two defects the audit found that the unit tests could not:**

- **Flashcards and the quiz had no `h2`** once a deck existed — only the site-wide `h1`.
  A _missing_ heading is not a WCAG violation, so axe was silent; only reading the
  document outline caught it. Rather than bolt a large title onto two deliberately spare
  pages, the position indicator that was already there became the heading — "Card 3 of
  5" tells a screen-reader user where they are, which "Flashcards" (already in the nav)
  does not. No visual change; `src/pages/headings.test.tsx` guards it.
- **The grid cell's `aria-label` did not match its own visible text.** The label was
  added in v1.3 to stop a screen reader running "かka" together, and in doing so it broke
  the match a voice-control user depends on — a fix that caused a second defect. Fixed at
  the source this time, by putting a real space between the two children so the computed
  name and the visible text are the same string.

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
