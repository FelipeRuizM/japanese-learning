import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { APP_VERSION } from './version'
import { PILLARS } from './routes'

const sections = () => screen.getByRole('navigation', { name: 'Sections' })

/**
 * THE ROUTER IS A MODULE SINGLETON, so the hash survives between tests in this
 * file: a test that navigates to Course leaves the next one starting there.
 * Two tests failed exactly that way before this existed, and the failure reads
 * as "the Kana activities are missing" rather than as pollution — which is a
 * long way from the cause.
 *
 * Resetting the hash rather than rebuilding the router, because the router
 * being module-scoped is how the app actually works. A harness that made a
 * fresh one per test would stop testing the thing that ships.
 */
beforeEach(async () => {
  window.location.hash = '#/'
  // `hashchange` is dispatched asynchronously, so without this the router is
  // still holding the PREVIOUS test's location when the next `render` runs,
  // and then moves out from under it mid-test.
  await flush()
})

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0)
  })

/**
 * Render the app and WAIT FOR THE REDIRECT TO LAND before touching anything.
 *
 * `#/` redirects into the first pillar, and that redirect WRITES THE HASH,
 * which dispatches its own `hashchange` a tick later. Click a link before that
 * event arrives and it arrives afterwards, putting you back where the redirect
 * pointed — the click is undone by navigation that was already in flight.
 *
 * The symptom was `expected [ 'Characters' ] to deeply equal [ 'Writing' ]`, in
 * the full suite only, about one run in three. Nothing about the message says
 * "race", which is why the wait is a named helper with this comment on it
 * rather than a `waitFor` inlined at one call site.
 */
async function showApp() {
  render(<App />)
  await waitFor(() => {
    expect(window.location.hash).toBe(`#${PILLARS[0]?.path ?? ''}`)
  })
  await flush()
}

describe('App shell', () => {
  it('renders the header and the version', async () => {
    await showApp()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Japanese practice' }),
    ).toBeInTheDocument()
    expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument()
  })

  /**
   * TWO LANDMARKS, AND THEY ANSWER DIFFERENT QUESTIONS. "Sections" is where you
   * are; the activities bar is what else is here. The v2.7 shell had one
   * landmark per pillar, both always rendered — which is the shape this
   * replaces, so the test asserts the new arrangement rather than being
   * re-pointed at the same one.
   */
  it('puts only the pillars in the sidebar', async () => {
    await showApp()
    const nav = await screen.findByRole('navigation', { name: 'Sections' })

    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(PILLARS.map((pillar) => pillar.label))
  })

  it('shows the open pillar’s activities, and only those', async () => {
    await showApp()
    const kana = PILLARS[0]
    if (!kana) throw new Error('no pillars registered')

    const bar = await screen.findByRole('navigation', {
      name: `${kana.label} activities`,
    })
    expect(
      within(bar)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(kana.sections.map((section) => section.label))
  })

  it('swaps the activities when the pillar changes', async () => {
    const user = userEvent.setup()
    await showApp()
    const course = PILLARS[1]
    if (!course) throw new Error('this test needs a second pillar')

    await user.click(within(sections()).getByRole('link', { name: course.label }))

    const bar = await screen.findByRole('navigation', {
      name: `${course.label} activities`,
    })
    expect(
      within(bar)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(course.sections.map((section) => section.label))
    // The kana activities are gone, not merely unhighlighted.
    expect(screen.queryByRole('navigation', { name: /^Kana activities$/ })).toBeNull()
  })

  /**
   * The landing section's path is a PREFIX of every other section in its
   * pillar, so without `end` it stays marked active from anywhere inside the
   * pillar — two tabs claiming to be the open one.
   */
  it('marks exactly one activity as the current page', async () => {
    const user = userEvent.setup()
    await showApp()
    const kana = PILLARS[0]
    const writing = kana?.sections.at(-1)
    if (!kana || !writing) throw new Error('no sections registered')

    const bar = await screen.findByRole('navigation', {
      name: `${kana.label} activities`,
    })
    await user.click(within(bar).getByRole('link', { name: writing.label }))

    // `waitFor`, not a bare read. A data router resolves a navigation through a
    // promise, so `user.click` can return before the location has moved and the
    // links have re-rendered — the read then sees the page you came FROM. It
    // failed that way about one full-suite run in three and passed this file in
    // isolation every time, because the gap only opens under load.
    await waitFor(() => {
      const current = within(bar)
        .getAllByRole('link')
        .filter((a) => a.getAttribute('aria-current') === 'page')
      expect(current.map((a) => a.textContent)).toEqual([writing.label])
    })
  })

  it('redirects the bare route into the first pillar', async () => {
    await showApp()
    // The grid is what #/kana opens, so finding it says the redirect landed.
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Choose what to study' }),
    ).toBeInTheDocument()
    expect(window.location.hash).toBe(`#${PILLARS[0]?.path ?? ''}`)
  })
})
