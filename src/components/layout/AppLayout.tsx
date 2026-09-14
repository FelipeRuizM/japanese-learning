import { Suspense } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { APP_VERSION } from '../../version'
import { PILLARS, pillarForPath, type NavPillar } from '../../routes'
import { Label } from '../ui/primitives'

/**
 * THE SHELL: pillars on the left, the pillar's activities across the top of the
 * content, the content in the middle.
 *
 * Two levels, because the app has two levels (§1). The flat row this replaced
 * put eight destinations in one line and asked the reader to know which pillar
 * each belonged to; grouping them into two labelled rows (v2.7) said which was
 * which but still spent the full width on a menu. Here the answer to "where am
 * I" is the sidebar, and the answer to "what else is here" is the row above the
 * content — and neither is answering the other's question.
 *
 * THE SIDEBAR UNSTACKS INTO A ROW BELOW `md`. A 375px phone has no room for a
 * column of navigation beside anything, and the alternative — a drawer — buys
 * vertical space at the cost of a focus trap, an escape key and a scrim, all
 * hand-built, to hide two links behind a gesture nobody is told about. Two
 * links do not need hiding.
 *
 * It renders NO section bar on the pages that belong to neither pillar (the
 * styleguide, the 404): five kana activities above "page not found" would be
 * furniture insisting you are somewhere you are not.
 */
export function AppLayout() {
  const { pathname } = useLocation()
  const pillar = pillarForPath(pathname)

  return (
    <div className="min-h-dvh bg-ground md:flex">
      <header
        className={[
          'border-b border-rule',
          // Below md this is a banner across the top; from md it is the rail,
          // stuck to the viewport so the activities stay reachable down a long
          // chart.
          'md:sticky md:top-0 md:h-dvh md:w-56 md:shrink-0',
          'md:overflow-y-auto md:border-r md:border-b-0',
        ].join(' ')}
      >
        <div className="flex flex-col gap-4 px-5 py-4 md:gap-6 md:py-6">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="m-0 font-sans text-lg font-semibold text-ink-0">
              Japanese practice
            </h1>
            <span className="font-sans text-label tracking-[0.08em] text-ink-2">
              v{APP_VERSION}
            </span>
          </div>

          <nav
            aria-label="Sections"
            className="-mb-4 flex flex-row gap-x-2 md:mb-0 md:flex-col md:gap-y-1"
          >
            {PILLARS.map((entry) => (
              <PillarLink key={entry.id} pillar={entry} />
            ))}
          </nav>
        </div>
      </header>

      {/* `min-w-0` so a wide child — a chart, a code block — shrinks the column
          rather than pushing the whole page into horizontal scroll. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {pillar === undefined ? null : (
          <nav
            aria-label={`${pillar.label} activities`}
            className="border-b border-rule"
          >
            {/* Same max width and gutter as the content below it, so the active
                tab lines up with the left edge of what it opens. */}
            <div className="mx-auto flex max-w-3xl flex-wrap gap-x-5 gap-y-1 px-5">
              {pillar.sections.map((section) => (
                <SectionLink key={section.path} {...section} />
              ))}
            </div>
          </nav>
        )}

        <main className="mx-auto w-full max-w-3xl px-5 py-8">
          <Suspense
            fallback={
              <p className="m-0">
                <Label>Loading</Label>
              </p>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

/**
 * A pillar. Active is marked by an accent rule, ink weight and a wash — chrome
 * recedes, and the accent is the one thing allowed to fill (§7).
 *
 * The wash is at EVERY width, not just the rail. Stacked on a phone the two
 * rows sit directly above each other, and with only a rule to tell them apart
 * they read as one list of eight rather than two levels of navigation. On the
 * rail position already says it; on a phone nothing else does.
 *
 * The rule flips edge with the layout: a bottom border under a row, a left
 * border beside a column. A single edge would point at nothing in one of the
 * two arrangements.
 */
function PillarLink({ pillar }: { pillar: NavPillar }) {
  return (
    <NavLink
      to={pillar.path}
      className={({ isActive }) =>
        [
          'inline-flex min-h-11 items-center px-3 font-sans text-base transition-colors',
          'border-b-2 md:w-full md:justify-start md:border-b-0 md:border-l-2',
          isActive
            ? 'border-accent bg-accent-soft font-medium text-ink-0'
            : 'border-transparent text-ink-2 hover:text-ink-0',
        ].join(' ')
      }
    >
      {pillar.label}
    </NavLink>
  )
}

/** One activity within the open pillar. Wraps; at 375px five of these need it. */
function SectionLink({
  path,
  label,
  end,
}: {
  path: string
  label: string
  end: boolean
}) {
  return (
    <NavLink
      to={path}
      end={end}
      className={({ isActive }) =>
        [
          'inline-flex min-h-11 items-center px-1 font-sans text-base transition-colors',
          isActive
            ? 'border-b-2 border-accent font-medium text-ink-0'
            : 'border-b-2 border-transparent text-ink-2 hover:text-ink-0',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}
