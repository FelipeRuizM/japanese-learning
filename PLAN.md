# PLAN.md — japanese-learning

Companion to `CLAUDE.md` (the spec). Each phase is independently shippable, ends with a
green typecheck + lint + test + build, an `APP_VERSION` bump, a working GitHub Pages
deploy, and one conventional commit. **Stop after every phase and wait for "continue."**

---

## Status — 2026-09-11

**All twelve phases complete.** The kana curriculum (1–7) teaches 142 characters across
two scripts. The course companion (8–12) drills JPST 100 Week 1 in four shapes: cards,
a vocabulary quiz, a numbers generator and a grammar cloze.

**It has still never been deployed.** The repository has no GitHub remote, so the
Actions workflow has never run — that remains the one thing between this and a live
site, and it is now the most valuable thing left to do.

### Where phases 1–7 left it

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

## Post-2.0 — the flashcard leaked the next answer ✅

Reported in use, not by a test.

- [x] **The bug.** Advancing from a revealed card animated `rotateY(180deg) → 0deg` on
      the same DOM node. The character had already changed, so the face rotating past
      the viewer was the back of the NEXT card — its glyph and its reading, briefly
      readable. Every rendered state was correct; the leak was entirely in the motion
      between them
- [x] **The fix.** The card is keyed on the character inside `Flashcard`, so advancing
      mounts a fresh element already at 0deg. A transition needs a previous value on the
      same node to interpolate from; a new node has none. Flipping the same card keeps
      its key, so functional motion survives
- [x] **Measured in a browser, before and after**: sampling the computed transform every
      frame for 400ms after pressing Next gave **19 of 26 frames mid-rotation** before
      and **0 of 26** after
- [x] Three tests, and **the two regression tests were confirmed to fail without the
      fix** — node identity on Next, on Previous, and unchanged identity on a real flip
- [x] `fix: never show the next card's answer`

**Deployed as 2.1.**

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

---

# Part two — the course companion

The second pillar (CLAUDE.md §11). Everything above teaches a **closed** set of
characters and is done. Everything below teaches **whatever JPST 100 taught this week**,
and grows.

The four phases after this one are four different drills because Week 1 turned out to be
four different shapes of material (§11.3). Resist the urge to make one screen serve all
of them — a hundred number flashcards is the exact mistake that shape is warning about.

---

## Phase 8 — The vocabulary model ✅

The hinge, and the direct analogue of Phase 2: no UI, just the model and the data, so
that everything after it is a consumer.

- [x] `src/types/vocab.ts` — `VocabItem`, `VocabGroup`, `VocabSet`
- [x] `src/vocab/registry.ts` — `VOCAB_SETS`, `vocabSetById`, `allVocab`,
      `everyVocabItem`, `vocabItemById`
- [x] Week 1 as three sets, one per class note, read from the vault:
      **Greetings** (16), **Self introduction** (19), **Everyday words** (7) — 42 items
- [x] `src/vocab/registry.test.ts` — ids unique across every set at once, every entry
      kana-only, romaji in the class's spelling, no empty group, every set cites a source
- [x] **The shared-meaning test** — pins おはよう/おはようございます and
      ありがとう/ありがとうございます so a later week's collision fails a test rather
      than surfacing in a quiz
- [x] CLAUDE.md §11 written; §1 and §10 reconciled with a second pillar existing
- [x] `feat: the vocabulary model and JPST 100 week 1`

**Deployed as 2.2.**

> **Why not `layout: 'flow'`.** Registering Week 1 as a `CharacterSet` was the cheap
> option — every existing screen would have rendered it immediately. It was rejected
> because `glyph` would hold a whole sentence, the meaning would hide in
> `examples[0].english`, `ScriptId` would widen to admit a non-script, and the quiz's
> `rowId`/`vowel` distractor tiers are meaningless for words. Reusing the model would
> have cost three loosened data-integrity tests to buy UI that does not fit anyway.

**Deliberately deferred, and both are real:**

- **No written form in Chinese characters.** Adding that field means widening the leak
  test, which is not something to do as a side effect (§11.2).
- **Vocabulary is not in the deck yet.** Whether vocabulary shares `DeckProvider` with
  characters or gets its own selection is a Phase 9 decision — the kana quiz must never
  receive a vocabulary item (§10 bite 11), and that constraint is easier to honour once
  there is a screen to look at.

---

## Phase 9 — Vocabulary flashcards ✅

- [x] `#/vocabulary`, with `SetPicker` made **generic over the id type** so one picker
      serves both registries and the render-nothing-for-one-set rule is written once
- [x] `VocabCard` — front **kana**, back **romaji + English**, with the note, the group
      and the example sentence below the reveal
- [x] Audio on reveal through the existing `usePronunciation`
- [x] The remount-on-advance invariant carried over, with its own test
- [x] The deck question answered: **vocabulary does not use the deck at all** (§11.4)
- [x] `VocabCard` in the styleguide, beside `Flashcard`
- [x] `feat: vocabulary flashcards`

**Deployed as 2.3.**

> **The pronunciation layer had to change, and it was the only thing in the kana half
> that did.** `PronunciationProvider.speak` took a `Character`, which was honest while a
> character was the only pronounceable thing in the app and became a lie the moment a
> phrase needed saying. It takes a `Speakable` — `{ ja, audio? }` — and each data layer
> exports a `speakable()` adapter for its own model. Twelve call sites moved, no
> behaviour changed, and `tsc` found every one of them.
>
> This is the Phase 9 entry in the §3.5 ledger: **the model was free, the seam was
> not.** A second consumer is what tells you which of your interfaces were typed to a
> model when they should have been typed to a capability.

> **A flaky test, and it was the test that was wrong.** The page shuffles, so the
> assertions find the item on screen by reading the card's accessible name — and the
> first version matched with `includes`. Three Week 1 pairs are prefixes of each other
> (ありがとう/ありがとうございます, おはよう/おはようございます), so whenever the
> shuffle dealt the long one, the search returned the short one and the run failed.
> About one visit in eight. Matching the kana exactly fixed it; the suite now runs
> clean repeatedly rather than usually.

> **Deliberately not built: an "all of Week 1" pseudo-set.** Drilling all 42 at once is
> a reasonable thing to want, but it means a synthetic `VocabSet` with no class note
> behind it, which breaks the one rule that keeps this data honest — every set cites its
> source. If it is wanted, it belongs in the quiz, where a round already spans a chosen
> scope.

## Phase 10 — Vocabulary quiz ✅

- [x] `src/lib/vocabQuiz.ts` — pure, injected `rng`, no React
- [x] Two directions, 50/50: **kana → English** and **English → kana**
- [x] Distractors: same `VocabGroup` → rest of the set → rest of the registry
- [x] **The shared-meaning exclusion**, keyed on the displayed values rather than on the
      named pairs, so a later week's collision is handled before it is typed in
- [x] A group of two, a set of two and a set of **one** all still yield four distinct
      options
- [x] `VocabEntry` — an item with the group it came from, `groupId` set-qualified
- [x] `VocabQuizCard`, and cards + quiz sharing `#/vocabulary` behind a mode toggle
- [x] `VocabQuizCard` in the styleguide
- [x] `feat: the vocabulary quiz`

**Deployed as 2.4.**

> **The distractor tiers are where the two quizzes stop resembling each other.** The
> character quiz asks "same row, then same vowel" because さ/ち and ぬ/め are shape
> confusions. This one asks "same group", because the class note already grouped the
> words by the situation they are used in — and "Leaving & returning home" holds four
> phrases, two of which differ only by **who is speaking**. That is the discrimination
> worth drilling, and it came free from data that was already shaped correctly.

> **Both invariants were mutation-checked rather than assumed.** Dropping the English
> half of the collision rule fails six tests; flattening the group tier fails one. A
> guard that has never been seen to fail is not yet known to be a guard.

## Phase 11 — The numbers drill ✅

Not flashcards. A **generator**, because 1–100 is a rule (CLAUDE.md §11.3, §11.6).

- [x] `src/lib/numbers.ts` — pure, injected `rng`: a number in, its kana reading out
- [x] The rule: `[tens]じゅう[ones]`, dropping either half when zero; ten is じゅう alone
- [x] Counting readings — **よん** not し, **なな** not しち, **きゅう** not く, with the
      discarded readings reused as distractors
- [x] The age irregulars as **a sound change, not a table** — see below
- [x] **よねんせい**, and school years 1–6
- [x] Three question types, in fixed proportions so every round exercises all three
- [x] Distractors are predicted mistakes: digit swap, discouraged reading, naive age form
- [x] Unit tests over the whole 1–100 range, against a written-out table
- [x] `#/numbers`, `NumberCard`, and the card in the styleguide
- [x] `feat: the numbers drill`

**Deployed as 2.5.**

> **The class note's "a few combine irregularly" understates it, and the drill would
> have taught the understatement.** The note lists 1, 8, 10 and 20. Three of those four
> are not one-off forms — they are one sound change that propagates to every number
> ending in いち, はち or じゅう. So 18 is じゅうはっさい and 30 is さんじゅっさい,
> neither of which is in the note, and both of which a learner generalising from the
> note alone gets wrong. Implemented as the sound change; a lookup table would have
> needed thirty rows and still been wrong for the thirty-first. **20 is the real
> one-off** — はたち drops さい entirely.
>
> This is the first place the vault note was _extended_ rather than transcribed, and the
> distinction matters: §11.2 says never to "fix" what the note says, and nothing here
> contradicts it. Every form the note gives is exactly as the note gives it.

> **Two tests were wrong before the code was.** A sweep for the discouraged readings
> asserted no counting reading contains く — but く is inside ろく and ひゃく, both
> correct. And a UI test asserted every option is a valid reading, which failed on
> ろくじゅうくさい: 69 with the discouraged く, which is a distractor doing its job.
> Both were the test over-claiming, and both are now pinned precisely instead.

> **The third quiz is where the duplication got extracted.** The verdict line, the
> option states and the two SVG marks were identical in all three cards — tolerable at
> two, not at three. They live in `ChoiceFeedback.tsx` and `optionStyles.ts` now. The
> CARDS stayed separate: what they genuinely differ in is the options (four glyphs, four
> English sentences, four kana readings), and a shared card would take the prompt, the
> option renderer, the reveal and the labelling as parameters — a parameter list wearing
> a component's clothes. Same split `GridLayout` makes.

## Phase 12 — The grammar cloze ✅

- [x] `src/lib/cloze.ts` — pure, injected `rng`
- [x] `src/grammar/` — the data layer, with the same registry rule the other two follow
- [x] です patterns: present/past × affirmative/negative, and the か question
- [x] の patterns: possession, origin/category, chaining, standing in for a noun
- [x] Sentences built from Week 1 vocabulary only — 17 patterns
- [x] The blank is the **particle or the copula**, never the noun, and a test says so
- [x] The English shown with the QUESTION, because without it half of them have two
      defensible answers
- [x] `#/grammar`, `ClozeCard`, and the card in the styleguide
- [x] `feat: the grammar cloze`

**Deployed as 2.6.**

> **The distinction this phase turned on: "never offer together" is not "equally
> correct".** じゃないです and ではありません are interchangeable — either answers the
> question, so they must never both be options, and the reveal says the other would have
> been fine. です and だ also fill the same slot and also must not appear together — but
> だ is the plain form and every sentence here is polite, so telling a learner it is
> equally correct would be **wrong**. One list cannot express both; `FormGroup` carries
> an `interchangeable` flag, and a mutation test pins each direction — conflating them
> fails one test whichever way it is conflated.

> **The same sentence appears twice with the blank moved.** わたしのなまえはフェリペです
> is asked once for the の and once for the は. That is what a cloze is for: the sentence
> is the same, the thing being taught is not.

---

## Phase 13 — The Kana section ✅

- [x] `NAV_GROUPS` in `AppLayout` — two groups, **Kana** and **Course**
- [x] Kana: Characters, Flashcards, Quiz, Sounds, Writing
- [x] Course: Vocabulary, Numbers, Grammar
- [x] One landmark per group, named by `aria-labelledby` off the visible heading
- [x] `App.test.tsx` asserts the grouping — membership and count, not just presence
- [x] `feat: group the nav into Kana and Course sections`

**Deployed as 2.7.**

> **The URLs did not move, and that was a choice rather than laziness.** Nesting the
> routes to match the menu (`#/kana/quiz`) buys tidier strings nobody reads, at the cost
> of every bookmark and every test path. Grouping is a statement about the MENU; the
> address space was already fine.

> **The test had to change shape, not just its selectors.** The old one asserted three
> links exist somewhere in a nav named "Primary" — which a link that drifted from one
> pillar to the other would still pass, and that drift is the only regression this phase
> can have. It now asserts membership per landmark and pins the count, so a route added
> to the wrong group fails.

> **`aria-labelledby`, not `aria-label`.** The group heading is on screen, so the
> landmark's accessible name is the same string a voice-control user can read out —
> the §8 lesson from the grid cell's mismatched label, applied before it bit twice.

---

## Phase 14 — Week 1, re-sourced from the weekly note ✅

- [x] `src/vocab/week1.ts` — ONE set per week, the note's 11 tables as its groups
- [x] 44 items, checked row by row against the note: every kana and every romaji
- [x] `week1Greetings.ts`, `week1Introduction.ts`, `week1Nouns.ts` deleted
- [x] The colliding pair moved: いただきます / ごちそうさまでした, both glossed
      "Thank you for the food"
- [x] A new guard — no Chinese characters in a `note` or an `english` either
- [x] `feat: re-source Week 1 from the weekly summary note`

**Deployed as 2.8.**

> **A week had to become ONE set, and that is the whole reason this phase exists.**
> "Choose some weeks, then choose topics inside them" only parses if a week is one thing
> with topics in it. Three sets per week made "week" a label convention — `Week 1 ·
> Greetings`, `Week 1 · Self introduction` — and a convention cannot be a filter.

> **The summary note is now the only source, and that removed real content.** ただいま,
> おかえりなさい, よろしくおねがいします, the ございます pair, ブラジル, カナダ and
> いちねんせい〜ごねんせい are not in its tables, so they are gone. So is every
> `example` sentence: the tables have no example column, and the ones that were here had
> been written for the grammar notes rather than taken from class. Filling an optional
> field with invented sentences is how a transcription quietly becomes an authored deck.

> **The collision moved rather than disappeared, which is why it was keyed on values.**
> The ございます pairs left and いただきます / ごちそうさまでした arrived — both glossed
> "Thank you for the food" by the note itself. `collides` needed no edit, exactly as it
> needed none when katakana brought 71 homophones (§3.5). `registry.test.ts` re-pinned
> the list, and nothing else changed.

> **The new pair is strictly harder than the old one, because they share a GROUP.**
> "Meals" has two items, so for either of them the first distractor tier yields nothing
> at all — not "too few", but zero — and all three distractors must come from outside a
> group that is not empty. A fallback keyed on "is this group big enough" rather than on
> "how many did we actually get" ships a three-option question here. It was already
> keyed the right way; there is now a test that says so.

> **One flake was introduced, and caught before it could bite.** でんわ means "Phone" and
> sits in the group labelled "Phone", so two card tests that found the meaning by bare
> text also matched the category chip — passing or failing on which item the shuffle
> dealt, about one visit in forty-four. Both faces are always in the DOM, so this was
> never about the reveal; both queries are scoped to the card element now.

> **Three tests were lost to there being one registered week**, and the note belongs
> here rather than in a commit message: the two that switched to a second set cannot
> run, and inventing a fixture week to keep them alive would only test the fixture. What
> they guarded — a changed selection remounts the cards — is still covered through the
> mode toggle, and comes back properly in Phase 15, when the selection becomes weeks and
> topics rather than one set.

## What is left

- **Deploy it.** No remote, so no workflow run, so no site (§2). Everything else on this
  list is smaller than this one.
- **The quiz builder** — weeks, topics and a question count, chosen on the spot.
- **Week 2**, whenever the vault has it — a data module and a registry entry per §11.8.
- **Kanji**, which the course teaches and which needs the `layout: 'flow'` branch the
  grid has carried unused since Phase 2 (§3.2).

---

## Notes on sequencing, part two

- **Phase 8 is the hinge, exactly as Phase 2 was.** The vocabulary model is what makes a
  new week cost a data module and one registry entry. Nothing broadens until it is in.
- **Flashcards precede the quiz**, because the quiz is the wider consumer of the model
  and the flashcard screen is where the deck question gets answered.
- **The numbers drill and the cloze are last** because they are the two with real logic
  and no existing analogue — and because a week of using the flashcards will say more
  about what they should be than a design argument now will.
