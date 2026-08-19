/**
 * Build the shipped Japanese font subset.
 *
 * WHY THIS EXISTS. `@fontsource/noto-sans-jp` ships its `japanese` subset as a
 * single ~1 MB woff2 — it is not split by unicode-range, so a browser fetches
 * the whole CJK set to draw か. That is the dominant asset on a site whose
 * total JS is a few tens of kilobytes, and it fails the Lighthouse target in
 * CLAUDE.md §8 on its own. §7 anticipated this and requires a hand-built subset
 * rather than dropping the font: without it, か renders in Yu Gothic on Windows,
 * Hiragino on macOS and something else again on Android — different stroke
 * shapes on the one thing this app exists to teach.
 *
 * WHAT IT KEEPS. The whole Hiragana and Katakana Unicode blocks
 * (U+3040–U+30FF), plus the small handful of Japanese punctuation marks the UI
 * can render. That is ~190 glyphs and it is deliberately wider than what Phase 2
 * ships, because:
 *
 *   - example words are kana-only by CLAUDE.md §3.4, so every word this app will
 *     ever display is already inside the range, and
 *   - katakana is a planned character set (§1), so it costs nothing now and
 *     saves regenerating later.
 *
 * Kanji is NOT in the subset. If a kanji character set is ever added, this
 * script grows a kanji range and the output is regenerated — that is a known,
 * documented step, not a surprise.
 *
 * THE OUTPUT IS COMMITTED. `src/assets/fonts/` is checked in, so CI needs no
 * font tooling to build. Re-run this only when the range above changes:
 *
 *     node scripts/subset-jp-font.mjs
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import subsetFont from 'subset-font'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(root, 'src', 'assets', 'fonts')

/** Hiragana + Katakana blocks, and the punctuation the UI can actually emit. */
const RANGES = [
  [0x3040, 0x30ff], // Hiragana and Katakana, including 、。ー・゛゜
  [0xff5e, 0xff5e], // fullwidth tilde
]
const EXTRA = '　' // ideographic space

function charset() {
  let out = EXTRA
  for (const [start, end] of RANGES) {
    for (let code = start; code <= end; code++) out += String.fromCodePoint(code)
  }
  return out
}

const WEIGHTS = [400, 700]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const text = charset()

  for (const weight of WEIGHTS) {
    const src = join(
      root,
      'node_modules',
      '@fontsource',
      'noto-sans-jp',
      'files',
      `noto-sans-jp-japanese-${weight}-normal.woff2`,
    )
    const original = await readFile(src)
    const subset = await subsetFont(original, text, { targetFormat: 'woff2' })
    const dest = join(OUT_DIR, `noto-sans-jp-kana-${weight}.woff2`)
    await writeFile(dest, subset)

    const before = (original.length / 1024).toFixed(0)
    const after = (subset.length / 1024).toFixed(1)
    console.log(
      `${weight}: ${before} KB -> ${after} KB  (${(
        (1 - subset.length / original.length) *
        100
      ).toFixed(1)}% smaller)  ${dest}`,
    )
  }

  console.log(`\n${[...new Set(text)].length} glyphs kept.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
