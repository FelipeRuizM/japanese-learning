# CLAUDE.md — japanese-learning

**Read this file in full at the start of every session before touching any code.**
It is the durable spec. `PLAN.md` holds the phased build order.

> **Status — 2026-09-11. Kana curriculum complete at v2.1; the course companion is
> under way at v2.2.** The first pillar is finished — all seven phases, all five
> features in §1, plus two added afterwards on request (the pronunciation chart and
> writing practice), the **dakuten/handakuten rows**, and **katakana**. It teaches
> **142 characters across two scripts**.
>
> **v2.2 opened the second pillar (§11):** the vocabulary model, the registry, and
> JPST 100 Week 1 as data — 42 items across three sets, with no UI. **v2.3 put a screen
> on it** — `#/vocabulary`, flashcards over a chosen set (§11.4). Phases 10–12 in
> `PLAN.md` build the vocabulary quiz, the numbers generator and the grammar cloze.
>
> **v2.3 is also the first change to reach into the kana half**, and it was the
> pronunciation layer: `speak` was typed to `Character`, which a phrase is not. It now
> takes a `Speakable` and each data layer adapts its own model (§4.2). Twelve call sites
> moved; no behaviour changed, and the compiler found every one.
>
> (v1.0 scaffold; v1.1 reversed
> the design system to dark only, see §7; v1.2 the character model and data; v1.3 the
> grid and deck; v1.4 pronunciation; v1.5 the quiz; v1.6 flashcards; v1.7 the quality
> pass; v1.8 the pronunciation chart; v1.9 the voiced rows and writing practice.)
>
> **v2.0 is the payoff the whole model was built for, and the prediction held to the
> letter:** a data module and one registry entry. No type changed, no component was
> rewritten, and `src/lib/quiz.ts` was not touched at all — see §3.5 for what it did
> cost, which was not nothing.
>
> **It has never been deployed** — the repository has no GitHub remote, so the Actions
> workflow has never run. That is the only thing standing between this and a live site.
>
> Kanji is the remaining script, and it is the one that needs the `layout: 'flow'`
> branch (§3.2). The course teaches it (the vault has a `Kanji/Numbers 1-10` folder), so
> it is no longer hypothetical.

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

A practice app for a **beginner learning Japanese**. It teaches **hiragana and
katakana**. The architecture must assume **kanji arrives later**.

The app has **two pillars**, and they are not the same kind of thing:

1. **The kana curriculum** — fixed, finite, and finished. Five features, and no more
   (plus the two added on request). It teaches a closed set of characters.
2. **The course companion** — open-ended and growing. It teaches whatever JPST 100
   taught this week, and a new week arrives as data. See **§11**.

The kana curriculum's features:

1. **Character grid** — every character, organised by row, click to select into a deck.
2. **Flashcards** — flip through the selected deck.
3. **Pronunciation** — audio and romaji, on click.
4. **Example words** — at least one real word per character, with romaji and English.
5. **Quiz** — recall over the selected deck, mixing both directions at random.
6. **Pronunciation chart** — the whole set as a reference; tap any character to hear
   it. Added after the original five, on request.
7. **Writing practice** — hear a random character and read its romaji, write the kana
   **on paper**, then reveal it to check. Added on request.

   > **The app does not capture the answer, deliberately.** Recognising a shape and
   > producing one are different skills, and producing it is the one a keyboard cannot
   > exercise. The screen owes the learner exactly one thing: an honest reveal.
   >
   > **The glyph must not be in the DOM before that reveal** — not merely hidden with
   > CSS, which would leave it for a screen reader to announce. Rendering it early turns
   > writing practice into copying.

   > **It reads the whole set, not the deck.** It is a reference you dip into, not a
   > drill: gating it behind a selection would make the obvious question — _what does
   > this one sound like?_ — take three steps.

   > **The prompt names the script.** あ and ア are both "a", so a reading alone does not
   > say which shape to draw. The name comes from `character.script` through the
   > registry, so a third script needs no change here.
   >
   > **This is also why `SpeakButton` takes a `label` override.** Its default accessible
   > name is "Play the pronunciation of あ", which is right everywhere the glyph is
   > already on screen and wrong on this one screen, where an `aria-label` is just
   > another way of putting the answer in the DOM.

### The character-set rule

There is a **character-set registry** — one entry per script. The grid, the flashcards
and the quiz **iterate the registry and consume a `CharacterSet`**. They must never
import the hiragana data module and must never contain the string `'hiragana'`.

Adding katakana meant **adding a data module and one registry entry**, exactly as
written here — see §3.5. Adding kanji means that plus using the `layout: 'flow'` branch
that already exists.

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
- **Only two places may name a script:** `src/characters/` (the data layer) and
  `src/types/characters.ts` (where `ScriptId` lives — a type-level fact with nowhere
  else to go). Everything else — components, pages, lib, data — must be script-agnostic.
  `tests/abstraction.test.ts` scans the tree and asserts exactly that.

  It is the check that fails first when the abstraction starts leaking, and **it has
  already caught a real one**: the Characters page named the script in its placeholder
  copy. The test lives in `tests/` rather than beside the code because it reads the file
  system, and `tsconfig.app.json` deliberately withholds Node's types from application
  code.

- **`layout` is a property of the set, not of the grid.** Kanji has no vowel columns.
  A grid that hardcodes a five-column matrix is the thing that would need rewriting, so
  the grid branches on `set.layout` from day one. **Two branches, and no more.**
- **`cells` may contain `null`, and `null` means a genuine gap** — the や-row has no
  _yi_ or _ye_, the わ-row has no _wi_/_wu_/_we_. Gaps render as empty space, never as a
  disabled character and never collapsed away, because the shape of the chart is part of
  what is being learned.

### 3.3 Kana scope and layout

**Each script is 71 characters: the 46 gojūon, the 20 dakuten rows and the 5
handakuten — 142 in all.** Yōon (きゃ / キャ) remains out of scope in both.

**The two charts are the same chart twice.** Same sixteen rows, same row ids, same row
labels, same gaps, same three homophone pairs, same id suffixes. That is not
copy-paste inertia: a learner reading them side by side must find the same sound in the
same cell, and `katakana.test.ts` asserts the alignment row by row and reading by
reading. A row added to one and not the other is a test failure, not a discovery made
later on screen.

> **The voiced rows were added after v1.8, and §3.3's prediction held exactly.** They
> needed no type change and no component change — `src/characters/hiragana.ts` was the
> only source file touched. Yōon would arrive the same way.

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

The katakana chart is that grid again, cell for cell: ア イ ウ エ オ, カ キ ク ケ コ, and
so on down to ン, with the same two gaps in the ヤ-row and three in the ワ-row.

> **ん is placed in the first column of the last row because a gojūon chart has nowhere
> else to put it — not because it is an 'a'-column character.** Its `vowel` is `null`.
> Layout uses the cell position; the quiz uses `vowel`. Nothing downstream is misled.
> **ン** is built by hand in its own module for exactly the same reason.

Romaji follows **Hepburn**: `shi`, `chi`, `tsu`, `fu`, and `を` / `ヲ` are romanised
**`o`** (their pronunciation) with the note that they are written _wo_. The quiz answers
on pronunciation, so `お` and `を` would collide — see §6.

**With two scripts, every reading collides**: あ and ア are both `a`, and so on 71 times
over. The quiz needed no change for it, because its exclusion was already keyed on
romaji rather than on a named pair (§6). Ids stay unique because they are
script-qualified and built from the written form.

### 3.4 Example words — the rules

- **Kana only, never kanji.** A beginner cannot read 猫, so the entry is `ねこ`. A test
  asserts every `kana` string contains only kana characters.
- **The word must actually contain its character.** A test asserts
  `word.kana.includes(character.glyph)` for every entry.
- Keep them short, common, and concrete. This is context for a sound, not vocabulary
  study.
- **Katakana example words are loanwords**, because that is what the script is for: a
  beginner meets it on a menu and a shop sign long before anywhere else. They may use
  the prolonged sound mark **ー** (U+30FC), which is how katakana writes a long vowel —
  `コーヒー`, not `コオヒイ`. The hiragana rule deliberately excludes ー for the mirror
  reason: hiragana doubles the vowel, so a ー appearing there means a katakana word
  slipped in. Each script's test carries its own character-range regex.
- **Five characters are exceptions and are documented here so nobody "fixes" them:**
  - **を** is a grammatical particle and never appears inside a word. Its example is a
    short phrase: `ほんをよむ` / _hon o yomu_ / "to read a book".
  - **ん** never appears word-initially. Its example is `みかん` / _mikan_ /
    "mandarin orange".
  - **ヲ** is worse off than を: the particle is written in hiragana in modern Japanese,
    so ヲ appears in no ordinary word at all. Its example is `ホンヲヨム` — the
    all-katakana style of old telegrams and signage, which is where a learner actually
    meets it.
  - **ヂ** and **ヅ** appear in no loanword, because modern spelling uses ジ and ズ. Their
    examples are the places the characters genuinely survive: `ラヂオ` / _rajio_, the
    pre-war spelling of "radio" still seen on old shopfronts, and `ヅケ` / _zuke_,
    marinated tuna as written on sushi menus.

  > The last three could each have been faked with a katakana transliteration of a
  > native word. Showing a learner where a rare character **really** occurs is the more
  > honest answer, and it teaches the rarity along with the shape.

- Example words appear on the **flashcard back** and on the **quiz answer reveal**. The
  grid cell's click is the select/deselect toggle, so grid cells carry no detail panel.

---

### 3.5 What a second script actually cost

Kept because the next person adding one should know what to expect, and because "it was
free" would be a lie the code does not support.

**Free, as designed.** `src/types/characters.ts`, `src/lib/quiz.ts`, `src/lib/shuffle.ts`,
`CharacterGrid`, `GridLayout`, `GridCell`, `SoundCell`, `Flashcard`, `QuizCard`, the deck
reducer and the provider — **none of them changed.** The quiz in particular absorbed 71
new homophone pairs without an edit, because `collides` was keyed on romaji rather than
on the お/を pair (§6). That generality was written in Phase 6 on the guess that it would
pay for itself, and this is the payment.

**Not free, and none of it was a design flaw.** Every one of these is a question that
did not exist while there was one script, not a mistake made earlier:

1. **A picker had to exist.** `SetPicker` — it takes the registry and reports an id, and
   **renders nothing at all when only one set is registered**, so the decision lives in
   one place rather than as `CHARACTER_SETS.length > 1` on every page that shows a chart.
2. **The deck spans scripts, so the counts had to be re-thought** (§5).
3. **Writing practice became ambiguous.** "Write this: a" cannot be answered when あ and
   ア are both "a", so the prompt names the script — from `character.script` through the
   registry, never hardcoded (§5).
4. **A latent defect surfaced in the light of the new one.** `SpeakButton` builds its
   `aria-label` from the glyph, which on the writing screen put the answer in the DOM
   before the reveal — the exact thing §1 forbids, missed because axe cannot know that a
   correctly-labelled button is showing an answer. It takes a `label` override now, and
   a test asserts no glyph appears in that control's accessible name.

**The rule this suggests for kanji:** the data and the registry entry really are the
whole mechanical cost. Budget the real work for the questions a third script asks that a
second one did not — and expect at least one of them to be a defect that was already
there.

## 4. Pronunciation

### 4.1 What was researched, and why it landed here

**There is no off-the-shelf, openly-licensed, coherently-recorded kana audio set.**
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
/** Japanese text, and optionally a recording of it. */
export type Speakable = { ja: string; audio?: string | undefined }

export type PronunciationProvider = {
  readonly kind: 'speech' | 'file'
  available(): boolean
  speak(subject: Speakable): Promise<void>
}
```

> **`speak` took a `Character` until v2.3.** That was fine while a character was
> the only thing the app could pronounce, and it stopped being true the moment
> vocabulary arrived: ごちそうさまでした is not a glyph, and wrapping it in a fake
> `Character` to get it spoken would have been the tail wagging the dog. The module
> now knows about Japanese text and nothing else, and **each data layer exports its own
> `speakable()` adapter** — `src/characters/registry.ts` maps a glyph, `src/vocab/registry.ts`
> maps kana. The rule "speak the glyph, never the romaji" is unchanged; it is now a
> rule about what each adapter puts in `ja`.

- **`speechProvider`** ships and is the default. `speechSynthesis` with `lang: 'ja-JP'`.
  It speaks the **glyph**, never the romaji — feeding romaji to a Japanese voice
  produces an English reading.
- **`fileProvider`** is written, unit-tested, and **left unwired**. It plays
  `character.audio` through an `<audio>` element. Turning it on later is one line in
  `usePronunciation` plus populating the `audio` field.
- `usePronunciation()` returns `{ speak, status }`, where status is
  **`'checking' | 'ready' | 'unavailable'`**.

  > **`checking` is a third state, added in Phase 4 against this spec's original
  > two.** Voice resolution is asynchronous and `getVoices()` is empty on the first
  > call, so collapsing "still looking" into "unavailable" would flash _No Japanese
  > voice on this device_ at every user on first paint and then take it back. Whether
  > the API **exists** is synchronous and decides the initial value during render;
  > only the voice lookup updates from an effect.

**Two traps, both must be handled:**

1. **`getVoices()` returns `[]` on the first call** in Chrome until the `voiceschanged`
   event fires. Resolve the voice through that event, not on first read.
2. **Chrome on iOS uses the WebKit voice list**, not the desktop Chrome one. Never
   branch on the browser; branch on what `getVoices()` actually returns.

**When no Japanese voice is installed** — real on some Firefox and Linux setups, and on
headless Chromium, where this path was verified — the control is **disabled and explains
itself rather than being hidden.** An absent button reads as "this app has no audio",
which is not what happened. The explanation is rendered **once per screen**, not beside
all seventy-one characters of a chart.

Two further behaviours the implementation settled, both tested:

- **A loaded voice list with no Japanese in it answers immediately.** Only an _empty_
  list means "not loaded yet". Making someone wait out the timeout to be told what is
  already known is just a slow no.
- **`speak` cancels anything in flight first.** Chrome queues utterances rather than
  replacing them, so a learner clicking quickly through flashcards would build a
  backlog that keeps talking after they have moved on.

> **Romaji reveal must never depend on audio.** Audio is an enhancement. Every place a
> sound plays, the romaji is already on screen or is revealed by the same click.

---

## 5. Pages and information architecture

Everything is **desktop and mobile**. Design for a **375px viewport first**, then let it
breathe on desktop.

```
#/               Grid        — select characters into the deck
#/flashcards     Flashcards  — flip through the deck
#/quiz           Quiz        — recall over the deck
#/pronunciation  Sounds      — the whole set; tap a character to hear it
#/writing        Writing     — hear one at random, write it on paper, then check
#/vocabulary     Vocabulary  — flip through a week's words from the course (§11)
#/styleguide     Styleguide  — every token and component in isolation
```

### The two grids

`GridLayout` holds the chart SHAPE — the matrix/flow branch, the column headers, the
gaps — and takes render props for the cell and the row label. Two grids consume it:

|                         | Cell                                       | Row label              |
| ----------------------- | ------------------------------------------ | ---------------------- |
| **Deck selector**       | `GridCell` — a toggle, `aria-pressed`      | selects/clears the row |
| **Pronunciation chart** | `SoundCell` — an action, no `aria-pressed` | plain text             |

> **A `SoundCell` is not a `GridCell` with a different handler.** One is a toggle that
> stays on; the other performs an action and returns to rest. Announcing "pressed" for
> the second would misdescribe it. Sharing the _layout_ while keeping the _behaviour_
> separate is the split that matters — duplicating the layout instead would mean a
> future `flow` set had to be made to work twice.

### The set picker

`SetPicker` sits above the chart on **Grid** and **Sounds**. One chart at a time: 142
cells stacked on one page is twice the scroll at 375px and gets worse with every script.

- It takes `CHARACTER_SETS` and reports a `ScriptId`. It never names a script and never
  counts them — **with one set registered it renders nothing.**
- `aria-pressed`, like `GridCell` and unlike `SoundCell`: it is a toggle that stays on.
  It uses the same ground-on-accent inversion a selected cell does, so the picker and
  the chart under it say "this one is on" the same way.
- **Its state is per-page** (`useCharacterSet`), not a second context. §2 allows one
  context and the deck has it. Which chart you last opened is not worth a second one —
  and because the deck crosses scripts, landing back on the first chart loses nothing:
  what you selected is still selected, and still says so.
- Switching charts on **Sounds clears the echo** below it. That character is no longer on
  the chart in front of you, and leaving it there reads as belonging to the new set.

### The deck

`DeckProvider` — React context above the router — holds a `Set<string>` of character ids
plus `toggle`, `selectRow`, `selectAll`, `clear`.

**One deck, spanning every script.** Ids are script-qualified, so `hiragana:ka` and
`katakana:ka` coexist and the quiz can ask a learner to tell あ from ア — which is the
drill a two-script app exists to offer. The consequence is that a summary sitting above
**one** chart has to be careful:

- the count reads against the chart on screen ("12 of 71"), because those are the cells
  you can see;
- anything selected elsewhere is stated **separately** ("+8 on another chart") rather
  than folded into that fraction, which would read as wrong;
- **`Select all` and `Clear all` act on the visible chart only.** Wiping a deck you
  cannot see is not something a control should do quietly, so `Clear deck` is a separate
  button, named for what it does, shown only when it would do something the button
  beside it would not.

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
- Row labels double as per-row select/clear controls, so **every row label must be
  unique** — the label becomes the control's accessible name, and the な-row and ん
  both want to be called "N". ん is **"Final N"** for that reason, and a test pins
  label uniqueness.
- A persistent count of what is selected, and links to Flashcards and Quiz.

### Flashcards

- The deck, shuffled once per visit. Next / previous, and position ("7 of 15").
- **Front:** the glyph, very large, and nothing else.
- **Click flips.** The flip **plays the audio and reveals** the romaji and the example
  words with their romaji and English. A replay control sits with them. Flipping _back_
  is silent — only the reveal speaks.

  > **Both faces are in the DOM at once**, because a flip needs something to flip to.
  > That means the answer is present before it is revealed, so both faces are
  > `aria-hidden` and the button carries an explicit name that mentions the reading only
  > once revealed. Without that a screen reader reads the answer straight off the back
  > face and there is nothing left to practise.
  >
  > The example words and the replay control sit **below** the card rather than on its
  > back face: a button cannot contain another button, and replay has to be a real one.

- **A new card is a new element, not the old one rotating back.** The card is keyed on
  the character, inside `Flashcard` itself.

  > **This was a real defect, found in use and fixed in v2.1.** Advancing from a
  > revealed card changes the character and clears `revealed` in one render. On a single
  > DOM node the browser then animates `rotateY(180deg) → 0deg`, and for the half of
  > that 300ms rotation past the midpoint, the face toward the viewer is the **back of
  > the card now holding the next character**. The next answer was legible in the
  > wobble. Measured before the fix: **19 of 26 sampled frames mid-rotation**; after:
  > **0 of 26**.
  >
  > A transition needs a previous value **on the same node** to interpolate from, so
  > mounting a fresh element removes the animation rather than hiding it. Flipping the
  > same card keeps its key, so a real flip still animates — that is functional motion
  > and must survive the fix. A test asserts all three: new node on advance, new node on
  > **Previous**, same node on a flip.
  >
  > The key lives in `Flashcard`, not at the call site: it is an invariant of the flip,
  > and a caller cannot be relied on to remember a key that looks decorative.

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

**Direction: chalk on slate.** A warm near-black ground with bright kana and one
lightened-indigo accent. The glyph is the brightest thing on screen, because stroke
shape is what is being learned.

> **This reverses the original light "paper and ink" direction.** v1.0 shipped light,
> on the reasoning that dark-on-light at large sizes shows stroke shape most clearly.
> The owner asked for dark only in v1.1 and that is the decision; the reasoning above is
> recorded so nobody re-argues it from the old comments in the codebase. **The palette
> was re-derived and re-measured, not flipped by eye** — see the token layer.

### The grammar

- **Ground is warm near-black**, not `#000` and not a blue-grey slate. Content sits
  directly on it.
- **One accent — a lightened indigo — carries interaction and selection.** Everything
  else is the ground plus four steps of neutral ink.
- **The glyph is the largest and brightest thing on screen, always.** Chrome recedes.
- **No container chrome.** No shadows, no borders as decoration, radius no larger than
  4px. Separation comes from whitespace and hairline rules.
- Labels and metadata are **small, letter-spaced and dim**; glyphs and answers are
  large and bright. The hierarchy inverts the usual.

### Hard bans — these read as generated-by-default

- gradient backgrounds, gradient text
- glassmorphism, `backdrop-blur`, translucent floating panels
- glowing or neon borders, coloured box-shadows
- `rounded-3xl` cards with drop shadows as the default container
- **emoji used as iconography or in UI copy** — icons are inline SVG
- untouched shadcn/ui, or the Tailwind default palette out of the box
  (`bg-slate-800`, `text-gray-400`, …)
- **Light mode. Dark only. Do not build one.**

### Token layer — `src/styles/tokens.css`

**No raw hex in components, ever.** If a component needs a colour that is not a token,
add the token. Tailwind v4 reads these through `@theme inline`, so the utility classes
are generated from the token layer by construction.

```css
:root {
  /* ground — warm near-black. the only backgrounds that exist. */
  --color-ground: #14110e;
  --color-sunken: #1c1815; /* row bands, card backs */
  --color-rule: #2b2721; /* hairlines. NOT FOR TEXT — 1.27:1 */

  /* ink ramp — the bright end is the "ink" now */
  --color-ink-3: #5c5449; /* 2.53:1 — gaps and disabled only, NOT FOR TEXT */
  --color-ink-2: #968c7e; /* 5.69:1 — labels, metadata */
  --color-ink-1: #cfc7ba; /* 11.23:1 — prose */
  --color-ink-0: #f5f1ea; /* 16.71:1 — glyphs, headlines */

  /* the one accent — selection and interaction. 7.93:1 on ground. */
  --color-accent: #8fa6ee;
  --color-accent-soft: #242536; /* hover wash, never text */

  /* semantic — quiz feedback only. see the note below. */
  --color-positive: #a8e3bf; /* 12.90:1 */
  --color-negative: #e8674a; /*  5.80:1 */

  --radius-sm: 2px;
  --radius-md: 4px; /* nothing larger exists */
}
```

**Every value above is measured, not chosen by eye.** Contrast is against the
`#14110e` ground; the figures are in the comments and every text colour clears WCAG AA.

> **The positive/negative pair is the one that carries meaning, and the same trap has
> now been hit twice.** On the light ground the first draft measured **ΔE 9.1 under
> protanopia**; on this dark ground the obvious pair (`#3fa86c` / `#ff8a6b`) measures
> **ΔE 1.9** — effectively identical. Both times the fix was the same: sweep for
> **lightness** separation rather than hue. The shipped pair measures **ΔE 38.0 protan,
> 43.6 deutan, 26.2 L\* gap**, and both stay clear of the accent (min ΔE 55.7 deutan).
>
> **Do not "fix" the green by saturating it,** and do not lighten the light-mode values
> to make a dark pair — that is exactly what produced the ΔE 1.9 draft. Re-sweep.
>
> **Even so, colour is never the only channel.** Quiz feedback always carries a word
> ("Correct" / "Not quite") and an inline SVG mark. **Semantic colour appears as text
> and a rule on the ground — never as a filled background.** Accent may fill; semantics
> may not.

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
  - the data integrity set, **per script** — 71 characters, unique ids and glyphs, every
    character has at least one example, every example contains its own character, every
    example is written in that script only
  - **the alignment set** — the two charts have the same rows in the same order, every
    character has a same-reading counterpart in the other script, and no glyph or id is
    shared between them
  - the registry — ids unique across every set at once, every set distinctly labelled
  - **the leak test** — no module outside `src/characters/` names a script
  - the quiz generator — both directions occur, distractor tier ordering, the answer
    never duplicated, the お/を collision, and a two-character deck still yielding four
    distinct options
  - the quiz **across scripts** — a character never appears beside its counterpart in
    the other script, no displayed value is shown twice in either direction, and a deck
    holding nothing but one such pair still fills four options
  - the picker — every set offered, the active one pressed, the id reported, and
    **nothing rendered at all when only one set is registered**
  - writing practice — the prompt names the right script, and **no glyph reaches the
    replay control's accessible name**
  - the deck reducer — toggle, select row, select all, clear
  - `speechProvider` against a stubbed `speechSynthesis`, including the empty-first-call
    race and the no-Japanese-voice path
- **Designed empty states.** Never a bare "No data" — and the empty deck is a primary
  screen, not an edge case (§5).
- **Error boundary at the route level.**
- Keyboard accessible end to end, real focus states, semantic headings.
- **Lighthouse: performance and accessibility ≥ 90 on mobile.** axe clean on every route.
- **No console errors or warnings in a clean run.**

> **`scripts/audit-a11y.mjs` is how the last three are measured.** It is deliberately
> not part of `npm test`: Playwright, axe-core and Lighthouse are a large install and a
> browser download, and putting them in `devDependencies` would slow every `npm ci` for
> a check that is run on purpose rather than on every commit. The script's header
> carries the run instructions and the last recorded result.
>
> **Two defects it found that the unit tests could not**, both fixed in v1.7:
>
> 1. **Flashcards and the quiz had no `h2`** once a deck existed — only the site-wide
>    `h1`. A _missing_ heading is not a WCAG violation, so axe was silent; only reading
>    the document outline caught it. `src/pages/headings.test.tsx` now guards it.
> 2. **The grid cell's `aria-label` did not match its own visible text.** The label was
>    added in v1.3 to stop a screen reader running "かka" together — and in doing so it
>    broke the match a voice-control user depends on. Fixed at the source, by putting a
>    real space between the two children, rather than by overriding the name.

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

> **Vocabulary is NOT on this list, as of v2.2.** The owner is taking JPST 100 and asked
> for a way to drill what the course teaches each week. That is a second pillar (§1),
> not a "small addition" to the first — and every prohibition above still binds it: the
> vocabulary decks are as unpersisted and as untracked as the kana deck is.

### Things that will bite you — quick list

1. A wrong Vite `base` gives a blank page with 404s on every asset.
2. `getVoices()` is empty on first call; wait for `voiceschanged`.
3. Feeding romaji to a `ja-JP` voice reads it as English. Speak the glyph.
4. `お` and `を` both romanise to `o` — they cannot be options in the same question. So
   do `じ`/`ぢ`, `ず`/`づ`, their katakana counterparts, and **every character and its
   twin in the other script**. The rule is keyed on romaji; do not re-key it on a pair.
5. `ん` and `ン` have `vowel: null`. Never assume every character has a vowel.
6. `cells` contains `null` for real gaps. Never `filter(Boolean)` it away for layout.
7. A deck smaller than 4 still has to produce a 4-option question.
8. Every refresh empties the deck. That is the design, and the empty state must earn it.
9. The deck spans scripts, so `deck.count` is NOT "how many of this chart". A summary
   above one chart has to count within it (§5).
10. An `aria-label` is DOM. On the writing screen, naming the glyph in one hands over the
    answer — which is why `SpeakButton` takes a `label` override.
11. Vocabulary ids and character ids share one namespace shape but NOT one model.
    **Vocabulary never enters `DeckProvider` at all** (§11.4), so the kana quiz cannot
    receive one — that is structural, not a rule to remember.
12. The class note's romaji is authoritative even where it is inconsistent with itself.
    "Fixing" `senkou` to `senkoo` changes what the owner is being graded on.
13. **A CSS transition can leak an answer even when every rendered state is correct.**
    Changing content and reversing a transform on the same node animates the NEW content
    through the old transform. Remount instead of un-flipping (§5). jsdom runs no
    transitions, so only a browser — or a test pinning node identity — catches this.

---

## 11. Vocabulary — the course companion

The second pillar (§1). The owner is taking **JPST 100** and keeps notes in an Obsidian
vault; this is where what the class taught becomes something drillable.

**The vault is the source of truth, and it is readable directly:**

```
C:\Users\felip\Desktop\Home\Obsidian Vault\big-brain\UBC\Winter 1\JPST 100\
```

(There is a second, near-empty `Obsidian Vault` under `OneDrive/Documentos`. It is not
the one. Do not read it and conclude the notes are missing.)

A week's folder holds one note per topic. **Read the notes; do not ask for them to be
pasted.** Every `VocabSet` cites the note it came from, so a card that looks wrong can
be checked against the source rather than argued about.

### 11.1 The model — `src/types/vocab.ts`

```ts
export type VocabExample = { kana: string; romaji: string; english: string }

export type VocabItem = {
  id: string // 'jpst100:w1:ohayoo' — course-qualified
  kana: string // おはよう
  romaji: string // ohayoo — as the class writes it
  english: string // Good morning
  note?: string // 'polite' — secondary text, never a prompt or an answer
  example?: VocabExample // only where the item is a building block
}

export type VocabGroup = { id: string; label: string; items: VocabItem[] }

export type VocabSet = {
  id: string // 'jpst100-w1-greetings'
  label: string
  source: string // the class note this was transcribed from
  groups: VocabGroup[]
}
```

**This is deliberately not the character model, and the reasoning should not be
re-litigated.** A character is a glyph with a position in a chart — a row, a vowel, a
set of example words that contain it. A vocabulary item is a word with a meaning and no
chart to sit in. Registering Week 1 as a `CharacterSet` with `layout: 'flow'` was the
cheap option and was rejected: `glyph` would hold a whole sentence, the meaning would be
smuggled into `examples[0].english`, `ScriptId` would have to widen to admit a value
that is not a script, three data-integrity tests would need loosening, and the quiz's
distractor tiers — keyed on `rowId` and `vowel` — are meaningless for words.

### 11.2 The rules

- **`src/vocab/registry.ts` exports `VOCAB_SETS`**, and a new week is **a data module
  plus one entry** — the same rule the character registry follows, for the same reason.
  Nothing that renders vocabulary may import a week's module or name a week.
- **Every entry is kana.** A test asserts it, allowing only the wave dash `〜` (the
  missing half of a suffix, `〜じん`) and the prolonged sound mark `ー`.
- **There is no field for the written form in Chinese characters, and adding one is a
  real decision rather than a detail.** The leak test (§3.2) forbids naming a script
  outside the character data layer, so a field named for one would have to widen that
  guard — and a guard widened as a side effect of an unrelated feature is a guard that
  stops holding. If the course starts marking written forms, raise it as its own change.
- **Romaji is spelled the way the class spells it**, not the way Hepburn would:
  `ohayoo`, `sayoonara`, `gochisoosama`. These are the strings the owner is graded on.
  Where the class note is internally inconsistent, **follow the note** — `senkou` stays
  `senkou` even beside `ohayoo`.
- **Two items really do share a meaning** — おはよう/おはようございます and
  ありがとう/ありがとうございます, each a casual/polite pair. This is the vocabulary
  version of the お/を collision (§6): they may never be two options in one question.
  `registry.test.ts` pins the list, so a **new** collision typed in with a later week
  fails a test rather than surfacing on screen.

### 11.3 What the course material actually is

Week 1 made it obvious that "vocabulary" is four different shapes, and that flashcards
only fit one of them. The build follows that split rather than flattening it:

| Shape                 | Example          | Drill                             |
| --------------------- | ---------------- | --------------------------------- |
| Fixed phrases         | いただきます     | Flashcards, kana ↔ English        |
| Building-block nouns  | がくせい, 〜じん | Flashcards, with the example slot |
| A generative **rule** | numbers 1–100    | A generator, **not** 100 cards    |
| A **pattern**         | です, の         | Cloze — `わたし＿がくせいです`    |

> **Do not turn the numbers into a deck.** 1–100 is a rule plus five irregulars
> (はたち, いっさい, はっさい, じゅっさい, よねんせい). A hundred flashcards teaches
> the list; a generator teaches the rule, and the rule is the thing the class taught.

### 11.4 The vocabulary screen — `#/vocabulary`

**There is no selection step, and that is deliberate.** The kana deck exists because 142
characters is far too many for one sitting, so the grid had to come first and the deck
had to carry a choice between screens. A vocabulary set is a class note — sixteen to
nineteen items, which _is_ one sitting. **The set is the deck**, so choosing one in the
picker is the whole of the selection, and a second selection grid would add a screen
that saves nobody any work.

The consequence is worth stating plainly: **vocabulary never enters `DeckProvider`.**
The kana quiz therefore cannot be handed a vocabulary item — structurally, rather than
because someone remembered not to.

- `SetPicker` is **generic over the id type** as of v2.3. It asks for `{ id, label }`
  and nothing else, so a `CharacterSet` and a `VocabSet` both satisfy it without being
  made to share a base type they have no other reason to share. The rule about rendering
  nothing for a single set is then written once. The id type is still inferred, so a
  script id and a vocabulary set id cannot be passed to each other.
- **`VocabCard` is a sibling of `Flashcard`, not a generalisation of it.** They differ in
  what the back must carry — a character reveals a reading, a word reveals a reading
  _and_ a meaning — and in how large the front can be set: ごちそうさまでした at the
  character card's front size overflows a 375px screen. Merging them would buy one
  component that branches on which model it was handed, which is worse to own than two
  short ones that each do one job.
- **The remount-on-advance invariant applies unchanged** (§5, bite 13), and its test is
  duplicated rather than shared, because it is the card's invariant and not the page's.
- **The group label is shown only after the reveal.** "Meals" narrows いただきます to one
  of two and "Leaving & returning home" narrows ただいま to one of four: a category
  beside a prompt is a hint. After the reveal it is context, which is what it was for.
- Each set **cites its class note on screen**, so a card that looks wrong can be checked
  rather than argued about.

### 11.5 Adding a week

1. Read the week's folder in the vault.
2. One `VocabSet` per class note, ids `jpst100:w<n>:<romaji>`.
3. Register it. Run the tests — the shared-meaning list is the one most likely to fire.
4. Bump `APP_VERSION`, commit, report.
