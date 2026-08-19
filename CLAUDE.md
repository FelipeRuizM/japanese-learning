# CLAUDE.md — japanese-learning

**Read this file in full at the start of every session before touching any code.**
It is the durable spec. `PLAN.md` holds the phased build order.

> **Status — 2026-08-19.** Phase 1 shipped as **v1.0** — scaffold, token layer,
> styleguide and the Pages pipeline. The site is live and empty; no character data
> exists yet. Phase 2 is next.

---

## 0. How to work in this repo

1. **One phase at a time**, in `PLAN.md` order. At the end of a phase: run typecheck,
   lint, tests and build, **bump `APP_VERSION`**, commit with a conventional-commit
   message, report what changed **including the version number**, then **stop and wait
   for "continue."** Never run ahead into the next phase.
2. **When something is underspecified, stop and ask.** Do not pick silently.
3. Do not add dependencies casually. The stack in §2 is the stack.
4. **THE VERSION COUNTER.** `src/version.ts` holds `APP_VERSION`, rendered in the
   header. Bump it in the same commit as every deploy and state the number in the
   report. `major.minor`, not semver — it marks deploys, not API compatibility. It is
   the **only** version string in the repo; `package.json` stays at `0.0.0`.

---

## 1. What this is

A practice app for a **beginner learning Japanese**. Today it teaches **hiragana**. The
architecture must assume **katakana and kanji arrive later**.

Five features, and no more:

1. **Character grid** — every character, organised by row, click to select into a deck.
2. **Flashcards** — flip through the selected deck.
3. **Pronunciation** — audio and romaji, on click.
4. **Example words** — at least one real word per character, with romaji and English.
5. **Quiz** — recall over the selected deck, mixing both directions at random.

### The character-set rule

There is a **character-set registry** — one entry per script. The grid, the flashcards
and the quiz **iterate the registry and consume a `CharacterSet`**. They must never
import the hiragana data module and must never contain the string `'hiragana'`.

Adding katakana later means **adding a data module and one registry entry**. Adding
kanji means that plus using the `layout: 'flow'` branch that already exists.

> **Do not over-abstract past this.** A registry plus concrete data. No plugin
> framework, no generic schema engine, no runtime-configurable field system. This is
> the same restraint the sibling fitness app's category registry is built under, and for
> the same reason.

---

## 2. Stack and deployment

| Concern       | Choice                                                                     |
| ------------- | -------------------------------------------------------------------------- |
| Build         | Vite + React + **TypeScript strict**                                       |
| Styling       | Tailwind CSS v4 via `@tailwindcss/vite`, extending `src/styles/tokens.css` |
| Routing       | **HashRouter** — GitHub Pages has no SPA rewrite. Never `BrowserRouter`.   |
| State         | Plain hooks + one context. **No state management library.**                |
| Tests         | Vitest + Testing Library, jsdom                                            |
| Lint / format | oxlint + prettier                                                          |
| Hosting       | GitHub Pages via GitHub Actions on push to `main`                          |
| Base path     | `base: '/japanese-learning/'` in `vite.config.ts`                          |

- **No backend, no API, no environment variables.** The app is a static bundle with its
  data compiled in. This is deliberate and is what keeps it deployable to Pages with no
  secrets and no build-time injection.
- **No opinionated component library.** No untouched shadcn/ui, no MUI. Build the
  components. Headless primitives are acceptable only where accessibility is genuinely
  hard by hand; nothing here needs them.
- TypeScript is strict **plus** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters`. **No `any`. Anywhere.**
- **`subset-font` is the one devDependency added beyond the stack**, and it never ships.
  It exists because `@fontsource/noto-sans-jp` serves its `japanese` subset as a single
  ~1 MB woff2 with no unicode-range splitting, so a browser fetches the whole CJK set to
  draw one kana. `scripts/subset-jp-font.mjs` cuts that to **43.5 KB** and the result is
  **committed under `src/assets/fonts/`**, so CI needs no font tooling to build.

> If the GitHub repo is given a name other than `japanese-learning`, `base` and the
> workflow change **together**. A wrong `base` is the classic Pages failure: the page
> loads blank with a 404 on every asset.

---

## 3. The data contract

### 3.1 Types — `src/types/characters.ts`

```ts
export type ScriptId = 'hiragana' | 'katakana' | 'kanji'
export type Vowel = 'a' | 'i' | 'u' | 'e' | 'o'

export type ExampleWord = {
  kana: string // ねこ — kana only, never kanji (§3.4)
  romaji: string // neko
  english: string // cat
}

export type Character = {
  id: string // 'hiragana:ka' — script-qualified so sets cannot collide
  script: ScriptId
  glyph: string // か
  romaji: string // ka
  rowId: string // 'k'
  vowel: Vowel | null // null for ん
  examples: ExampleWord[] // at least one — enforced by a test
  audio?: string // static file path. Absent → speech synthesis (§4)
}

export type CharacterRow = {
  id: string
  label: string // 'K-row'
  cells: (Character | null)[] // null is a REAL gap, not padding
}

export type CharacterSet = {
  id: ScriptId
  label: string
  columns: readonly Vowel[] // empty for a set with no matrix
  layout: 'matrix' | 'flow'
  rows: CharacterRow[]
}
```

### 3.2 The rules that make the abstraction real

- `src/characters/registry.ts` exports `CHARACTER_SETS: CharacterSet[]` and
  `characterSetById(id)`. Hiragana is the only entry today.
- **`src/characters/` is the only directory allowed to name a script.** A test asserts
  this by scanning the source tree. It is the check that fails first if hiragana starts
  leaking into a component, which is exactly the leak that would force a rewrite.
- **`layout` is a property of the set, not of the grid.** Kanji has no vowel columns.
  A grid that hardcodes a five-column matrix is the thing that would need rewriting, so
  the grid branches on `set.layout` from day one. **Two branches, and no more.**
- **`cells` may contain `null`, and `null` means a genuine gap** — the や-row has no
  _yi_ or _ye_, the わ-row has no _wi_/_wu_/_we_. Gaps render as empty space, never as a
  disabled character and never collapsed away, because the shape of the chart is part of
  what is being learned.

### 3.3 Hiragana scope and layout

**The 46 gojūon only.** Dakuten/handakuten (が, ぱ) and yōon (きゃ) are deliberately
deferred; they are additional rows and need **no type change** when they arrive.

```
row      a    i    u    e    o
vowels   あ   い   う   え   お
k        か   き   く   け   こ
s        さ   し   す   せ   そ
t        た   ち   つ   て   と
n        な   に   ぬ   ね   の
h        は   ひ   ふ   へ   ほ
m        ま   み   む   め   も
y        や   —    ゆ   —    よ
r        ら   り   る   れ   ろ
w        わ   —    —    —    を
n        ん
```

> **ん is placed in the first column of the last row because a gojūon chart has nowhere
> else to put it — not because it is an 'a'-column character.** Its `vowel` is `null`.
> Layout uses the cell position; the quiz uses `vowel`. Nothing downstream is misled.

Romaji follows **Hepburn**: `shi`, `chi`, `tsu`, `fu`, and `を` is romanised **`o`**
(its pronunciation) with the note that it is written _wo_. The quiz answers on
pronunciation, so `お` and `を` would collide — see §6.

### 3.4 Example words — the rules

- **Kana only, never kanji.** A beginner cannot read 猫, so the entry is `ねこ`. A test
  asserts every `kana` string contains only kana characters.
- **The word must actually contain its character.** A test asserts
  `word.kana.includes(character.glyph)` for every entry.
- Keep them short, common, and concrete. This is context for a sound, not vocabulary
  study.
- Two characters are exceptions and are documented here so nobody "fixes" them:
  - **を** is a grammatical particle and never appears inside a word. Its example is a
    short phrase: `ほんをよむ` / _hon o yomu_ / "to read a book".
  - **ん** never appears word-initially. Its example is `みかん` / _mikan_ /
    "mandarin orange".
- Example words appear on the **flashcard back** and on the **quiz answer reveal**. The
  grid cell's click is the select/deselect toggle, so grid cells carry no detail panel.

---

## 4. Pronunciation

### 4.1 What was researched, and why it landed here

**There is no off-the-shelf, openly-licensed, coherently-recorded 46-kana audio set.**
Checked 2026-08-19:

| Source                                           | Verdict                                                                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ThoughtCo hiragana guide                         | Dotdash Meredith editorial content, all rights reserved. No license to hotlink or redistribute. **Ruled out.**                                                              |
| Wikimedia Commons `Ja-*.oga`                     | Only ~16 of 46 exist. Different speakers, mixed PD / CC BY-SA 3.0, and they are recordings of _words_, not isolated kana. **Ruled out as a set.**                           |
| `tofugu/japanese-vocabulary-pronunciation-audio` | Genuinely reusable — CC BY-SA 4.0, native voice actors. But it is **vocabulary**, not kana. Keep as a future source for _example-word_ audio; useless for character sounds. |

**Do not re-litigate this without new evidence.** If a licensed set is found later,
dropping it in is a data change (§4.2), not a rewrite.

### 4.2 The provider interface — `src/lib/pronunciation.ts`

```ts
export type PronunciationProvider = {
  readonly kind: 'speech' | 'file'
  available(): boolean
  speak(character: Character): Promise<void>
}
```

- **`speechProvider`** ships and is the default. `speechSynthesis` with `lang: 'ja-JP'`.
  It speaks the **glyph**, never the romaji — feeding romaji to a Japanese voice
  produces an English reading.
- **`fileProvider`** is written, unit-tested, and **left unwired**. It plays
  `character.audio` through an `<audio>` element. Turning it on later is one line in
  `usePronunciation` plus populating the `audio` field.
- `usePronunciation()` returns `{ speak, status: 'ready' | 'unavailable' }`.

**Two traps, both must be handled:**

1. **`getVoices()` returns `[]` on the first call** in Chrome until the `voiceschanged`
   event fires. Resolve the voice through that event, not on first read.
2. **Chrome on iOS uses the WebKit voice list**, not the desktop Chrome one. Never
   branch on the browser; branch on what `getVoices()` actually returns.

**When no Japanese voice is installed** — real on some Firefox and Linux setups — the
control is disabled and the UI says "No Japanese voice on this device" plainly.

> **Romaji reveal must never depend on audio.** Audio is an enhancement. Every place a
> sound plays, the romaji is already on screen or is revealed by the same click.

---

## 5. Pages and information architecture

Everything is **desktop and mobile**. Design for a **375px viewport first**, then let it
breathe on desktop.

```
#/            Grid        — select characters into the deck
#/flashcards  Flashcards  — flip through the deck
#/quiz        Quiz        — recall over the deck
#/styleguide  Styleguide  — every token and component in isolation
```

### The deck

`DeckProvider` — React context above the router — holds a `Set<string>` of character ids
plus `toggle`, `selectRow`, `selectAll`, `clear`.

> **In memory only. No `localStorage`, no `sessionStorage`, no URL state.** Persistence
> is explicitly out of scope (§10). The consequence is that **a refresh always lands on
> an empty deck**, which makes the empty state a primary screen, not an edge case.
> Design it: it says what to do and links to the grid.

**The deck starts empty.** `Select all` and per-row select make filling it one tap.

### Grid

- Cells are **toggle buttons** with `aria-pressed`, a real focus ring, and a hit target
  of at least 44px.
- Selected cells invert: paper glyph on indigo.
- Gaps in the matrix are rendered as empty space (§3.2).
- Row labels double as per-row select/clear controls.
- A persistent count of what is selected, and links to Flashcards and Quiz.

### Flashcards

- The deck, shuffled once per visit. Next / previous, and position ("7 of 15").
- **Front:** the glyph, very large, and nothing else.
- **Click flips.** The flip **plays the audio and reveals** the romaji and the example
  words with their romaji and English. A replay control sits on the back.
- `prefers-reduced-motion` collapses the flip to an instant swap.

### Quiz — see §6.

---

## 6. Quiz — exact specification

`src/lib/quiz.ts` is **pure functions with an injected `rng`**, no React, fully
unit-tested. The UI renders what it returns and holds no question logic.

- **Four-option multiple choice in both directions.** Typing the character itself is
  impossible without an IME, so the two directions cannot be symmetric if answers are
  typed. Multiple choice keeps them symmetric and works one-handed on a phone.
- **Direction is chosen per question, 50/50:** `glyph→romaji` (show か, pick "ka") or
  `romaji→glyph` (show "ka", pick か).
- **Distractors are sourced in this order**, taking what each tier offers before falling
  through: **same `rowId`** → **same `vowel`** → **rest of the deck** → **rest of the
  full set**.
  - Same-row first is the whole point: さ/ち, ぬ/め, and れ/わ/ね are the confusions a
    beginner actually has. Random distractors test luck instead of discrimination.
  - The final fallback exists because **a two-character deck cannot fill four options
    from itself.** A small deck must still produce a valid question.
- **The answer never appears twice among the options**, and no two options may share a
  displayed value — which is why **を is excluded from being a distractor for お** and
  vice versa: both romanise to `o` (§3.3), so in the `glyph→romaji` direction both
  options would be correct, and in the `romaji→glyph` direction the prompt is ambiguous.
- A **round** is the shuffled deck, one question per character. The end-of-round score
  is **in memory and discarded on leaving the page** — that is a round summary, not
  progress tracking (§10).
- On answering, the correct option is marked, the **example word is revealed**, and the
  audio plays.

---

## 7. Design system

**Direction: paper and ink.** A warm off-white ground with near-black glyphs, one
indigo accent. The reasoning is legibility of large kana: stroke shape is what is being
learned, and dark-on-light at large sizes is the arrangement that shows it most clearly.

### The grammar

- **Ground is warm paper**, not white and not grey-blue. Content sits directly on it.
- **One accent — indigo — carries interaction and selection.** Everything else is the
  ground plus four steps of neutral ink.
- **The glyph is the largest thing on screen, always.** Chrome recedes.
- **No container chrome.** No shadows, no borders as decoration, radius no larger than
  4px. Separation comes from whitespace and hairline rules.
- Labels and metadata are **small, letter-spaced and dim**; glyphs and answers are
  large and dark. The hierarchy inverts the usual.

### Hard bans — these read as generated-by-default

- gradient backgrounds, gradient text
- glassmorphism, `backdrop-blur`, translucent floating panels
- glowing or neon borders, coloured box-shadows
- `rounded-3xl` cards with drop shadows as the default container
- **emoji used as iconography or in UI copy** — icons are inline SVG
- untouched shadcn/ui, or the Tailwind default palette out of the box
  (`bg-slate-800`, `text-gray-400`, …)
- **Dark mode.** Light only. Do not build one.

### Token layer — `src/styles/tokens.css`

**No raw hex in components, ever.** If a component needs a colour that is not a token,
add the token. Tailwind v4 reads these through `@theme inline`, so the utility classes
are generated from the token layer by construction.

```css
:root {
  /* ground — warm paper. the only backgrounds that exist. */
  --color-ground: #faf7f2;
  --color-sunken: #f1ebe1; /* row bands, card backs */
  --color-rule: #ded5c8; /* hairlines. NOT FOR TEXT — 1.36:1 */

  /* ink ramp */
  --color-ink-3: #9c9184; /* 2.89:1 — gaps and disabled only, NOT FOR TEXT */
  --color-ink-2: #6b6257; /* 5.60:1 — labels, metadata */
  --color-ink-1: #3a342d; /* 11.50:1 — prose */
  --color-ink-0: #1a1714; /* 16.70:1 — glyphs and headlines */

  /* the one accent — selection and interaction. 7.97:1 on ground. */
  --color-accent: #2c4a8c;
  --color-accent-soft: #e4e8f3; /* hover wash, never text */

  /* semantic — quiz feedback only. see the note below. */
  --color-positive: #0e3f25; /* 11.19:1 */
  --color-negative: #c4472f; /*  4.58:1 */

  --radius-sm: 2px;
  --radius-md: 4px; /* nothing larger exists */
}
```

**Every value above is measured, not chosen by eye.** Contrast is against the
`#faf7f2` ground; the figures are in the comments and every text colour clears WCAG AA.

> **The positive/negative pair is the one that carries meaning, and it was corrected
> once.** The first draft (`#1b6f45` / `#b23a2b`) sat at **ΔE 9.1 under protanopia** —
> effectively indistinguishable for a protanope. Sweeping for **lightness** separation
> instead of hue separation produced the current pair at **ΔE 19.7 protan, 46.7 deutan,
> with a 24.6 L\* gap.** Do not "fix" the green by brightening it: the lightness gap is
> what does the work when the hue axis collapses.
>
> **Even so, colour is never the only channel.** Quiz feedback always carries a word
> ("Correct" / "Not quite") and an inline SVG mark. And because a filled vermilion chip
> would sit at only 4.58:1, **semantic colour appears as text and a rule on the paper
> ground — never as a filled background.** Indigo selection may fill; semantics may not.

### Typography

- **Kana: self-hosted Noto Sans JP** (`@fontsource/noto-sans-jp`, OFL). Without it, か
  falls back to Yu Gothic on Windows, Hiragino on macOS and something else again on
  Android — different stroke shapes on the one thing the app exists to teach. If the
  measured transfer is large, replace it with a hand-built subset of exactly the glyphs
  shipped; do not drop it.
- **Latin: IBM Plex Sans**, self-hosted, matching the sibling project.
- Romaji is set in the Latin face, never in the JP face.

### `/styleguide`

A route rendering **every token and every component in isolation**. Built in Phase 1 and
kept current. **A component that is not in the styleguide is not done.**

---

## 8. Quality bar

- **TypeScript strict, no `any`.**
- **Vitest, minimum:**
  - the data integrity set — 46 characters, unique ids and glyphs, every character has
    at least one example, every example contains its own character, every example is
    kana-only
  - **the leak test** — no module outside `src/characters/` names a script
  - the quiz generator — both directions occur, distractor tier ordering, the answer
    never duplicated, the お/を collision, and a two-character deck still yielding four
    distinct options
  - the deck reducer — toggle, select row, select all, clear
  - `speechProvider` against a stubbed `speechSynthesis`, including the empty-first-call
    race and the no-Japanese-voice path
- **Designed empty states.** Never a bare "No data" — and the empty deck is a primary
  screen, not an edge case (§5).
- **Error boundary at the route level.**
- Keyboard accessible end to end, real focus states, semantic headings.
- **Lighthouse: performance and accessibility ≥ 90 on mobile.** axe clean on every route.
- **No console errors or warnings in a clean run.**

---

## 9. Conventions

```
src/
  characters/   registry.ts + one module per script. THE ONLY PLACE A SCRIPT IS NAMED.
  components/   shared primitives — no script knowledge
  data/         DeckProvider, useDeck
  lib/          pronunciation.ts, quiz.ts, shuffle.ts
  pages/        route components
  styles/       tokens.css
  types/        characters.ts
  version.ts
```

- Component files `PascalCase.tsx`; everything else `camelCase.ts`.
- **Named exports only**; default export only where a router requires it.
- **No barrel `index.ts` re-export files.**
- **Conventional commits**: `feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`.
  One commit per phase, at the end of the phase, after the checks pass.

---

## 10. Deliberately out of scope

Do not build these, and do not sneak them in as a "small addition":

- **Progress tracking.** No per-character accuracy, no history, no stats page.
- **Spaced repetition.** No scheduling, no intervals, no leech detection.
- **Persistence of any kind.** No `localStorage`, no `sessionStorage`, no IndexedDB, no
  cookies, no URL-encoded deck state, no backend.
- **Accounts, auth, sync.**

The end-of-round quiz score is the one permitted exception and it lives in component
state, dying when the route unmounts.

### Things that will bite you — quick list

1. A wrong Vite `base` gives a blank page with 404s on every asset.
2. `getVoices()` is empty on first call; wait for `voiceschanged`.
3. Feeding romaji to a `ja-JP` voice reads it as English. Speak the glyph.
4. `お` and `を` both romanise to `o` — they cannot be options in the same question.
5. `ん` has `vowel: null`. Never assume every character has a vowel.
6. `cells` contains `null` for real gaps. Never `filter(Boolean)` it away for layout.
7. A deck smaller than 4 still has to produce a 4-option question.
8. Every refresh empties the deck. That is the design, and the empty state must earn it.
