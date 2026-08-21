/**
 * The accessibility and performance audit behind CLAUDE.md §8.
 *
 * It is NOT part of `npm test` and its tools are NOT in package.json, on
 * purpose: Playwright, axe-core and Lighthouse together are a large install and
 * a browser download, and putting them in `devDependencies` would slow every
 * `npm ci` in CI for a check that is run deliberately, not on every commit.
 *
 * To run it:
 *
 *     npm run build
 *     npx vite preview --port 4455 --strictPort &
 *     npm install --no-save playwright @axe-core/playwright axe-core lighthouse
 *     node scripts/audit-a11y.mjs
 *
 * Last run 2026-08-21 (v2.0): 0 axe violations across FIFTEEN route/state
 * combinations — the three added with the second character set cover its chart
 * on both pickers and a deck holding characters from both scripts at once — no
 * console output of any kind, and Lighthouse mobile at performance 96–97 (it
 * varies a point run to run), accessibility 100, best practices 100, SEO 100.
 *
 * The second set doubled the compiled-in data — 97.25 KB gzip of JS, up from
 * 93.85 — without moving performance out of that band. It is data, not work:
 * the bundle is parsed once and nothing renders more than one chart at a time.
 *
 * Two things it found that the unit tests could not:
 *
 *   - Flashcards and the quiz had NO `h2` once a deck existed. A missing
 *     heading is not a WCAG violation, so axe was silent; only reading the
 *     document outline caught it. `src/pages/headings.test.tsx` now guards it.
 *   - The grid cell's `aria-label` did not match its own visible text. The
 *     label had been added to stop a screen reader running "かka" together —
 *     and in doing so it broke the match a voice-control user relies on. Fixed
 *     at the source, by putting a real space between the two children, rather
 *     than by overriding the name.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import lighthouse from 'lighthouse'

const BASE = process.env['AUDIT_URL'] ?? 'http://localhost:4455/japanese-learning/'

const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] })
let violations = 0
const noise = []

async function scan(name, drive) {
  // axe needs a real context, not the implicit one `browser.newPage()` makes.
  const context = await browser.newContext({ viewport: { width: 375, height: 900 } })
  const page = await context.newPage()
  page.on('pageerror', (e) => noise.push(`${name}: pageerror ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      noise.push(`${name}: ${m.type()} ${m.text()}`)
    }
  })

  await drive(page)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()

  violations += result.violations.length
  console.log(
    `${name.padEnd(26)} ${result.violations.length ? `${result.violations.length} VIOLATION(S)` : 'clean'}`,
  )
  for (const v of result.violations) {
    console.log(`   [${v.impact}] ${v.id}: ${v.help}`)
    for (const node of v.nodes.slice(0, 3))
      console.log(`      ${node.target.join(' ')}`)
  }
  await context.close()
}

const open = (hash) => async (page) => {
  await page.goto(BASE + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

const withDeck = async (page) => {
  await open('#/')(page)
  await page.getByRole('button', { name: 'K row, select all' }).click()
  await page.waitForTimeout(300)
}

console.log('— axe —')
await scan('grid (empty deck)', open('#/'))
await scan('flashcards (empty deck)', open('#/flashcards'))
await scan('quiz (empty deck)', open('#/quiz'))
await scan('pronunciation chart', open('#/pronunciation'))
await scan('writing (no prompt yet)', open('#/writing'))
await scan('styleguide', open('#/styleguide'))
await scan('404', open('#/no-such-page'))
await scan('grid (row selected)', withDeck)

await scan('flashcards (flipped)', async (page) => {
  await withDeck(page)
  await page.getByRole('link', { name: /as flashcards/ }).click()
  await page.locator('button[aria-expanded]').click()
  await page.waitForTimeout(500)
})

await scan('pronunciation (tapped)', async (page) => {
  await open('#/pronunciation')(page)
  await page.getByRole('button', { name: 'か ka, play' }).click()
  await page.waitForTimeout(400)
})

await scan('writing (revealed)', async (page) => {
  await open('#/writing')(page)
  await page.getByRole('button', { name: 'Play a random sound' }).click()
  await page.getByRole('button', { name: 'Show the character' }).click()
  await page.waitForTimeout(400)
})

/**
 * The second chart, on both screens that carry a picker. A `flow`-layout set
 * would need its own entry here; both registered sets are matrices.
 */
await scan('grid (second chart)', async (page) => {
  await open('#/')(page)
  await page.getByRole('button', { name: 'Katakana' }).click()
  await page.getByRole('button', { name: 'K row, select all' }).click()
  await page.waitForTimeout(300)
})

await scan('grid (deck spans both)', async (page) => {
  await withDeck(page)
  await page.getByRole('button', { name: 'Katakana' }).click()
  // `exact` matters: every row label is also "…, select all".
  await page.getByRole('button', { name: 'Select all', exact: true }).click()
  await page.waitForTimeout(300)
})

await scan('pronunciation (second chart)', async (page) => {
  await open('#/pronunciation')(page)
  await page.getByRole('button', { name: 'Katakana' }).click()
  await page.getByRole('button', { name: 'カ ka, play' }).click()
  await page.waitForTimeout(400)
})

await scan('quiz (answered)', async (page) => {
  await withDeck(page)
  await page.getByRole('link', { name: 'Quiz me' }).click()
  await page.locator('li button').first().click()
  await page.waitForTimeout(500)
})

console.log(`\ntotal violations: ${violations}`)
console.log('console output:', noise.length ? noise : 'none')

console.log('\n— lighthouse (mobile) —')
const { lhr } = await lighthouse(
  BASE,
  {
    port: 9222,
    output: 'json',
    logLevel: 'error',
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      disabled: false,
    },
  },
  undefined,
)

let belowTarget = false
for (const key of ['performance', 'accessibility', 'best-practices', 'seo']) {
  const score = Math.round((lhr.categories[key]?.score ?? 0) * 100)
  // §8 requires performance and accessibility at 90 or better.
  const required = key === 'performance' || key === 'accessibility'
  if (required && score < 90) belowTarget = true
  console.log(
    `${key.padEnd(16)} ${score}${required && score < 90 ? '  << BELOW §8 TARGET' : ''}`,
  )
}

const failed = Object.entries(lhr.audits).filter(
  ([, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary',
)
console.log('failed audits:', failed.length ? failed.map(([id]) => id) : 'none')

await browser.close()

if (violations > 0 || noise.length > 0 || belowTarget) process.exitCode = 1
