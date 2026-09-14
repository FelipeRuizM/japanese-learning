import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { APP_VERSION } from '../../version'
import { Label } from '../ui/primitives'

/**
 * THE NAV IS GROUPED BY PILLAR, not flat (CLAUDE.md §1).
 *
 * Eight destinations in one row was the point the flat list stopped saying
 * anything. "Quiz" and "Grammar" sat side by side with nothing to indicate that
 * one drills a closed set of 142 characters and the other drills what the class
 * taught last week — a distinction obvious to whoever built it and invisible to
 * anyone else. The two pillars are genuinely different kinds of thing, so the
 * nav says which one you are in.
 *
 * THE URLS DID NOT MOVE. Grouping is a statement about the menu, not about the
 * address space: `#/quiz` is still the kana quiz. Nesting the routes to match
 * would have broken every bookmark and every test path to buy tidier strings
 * nobody reads.
 *
 * Each group is its own landmark, named by the heading a sighted viewer reads,
 * so "navigate by landmark" and "read the screen" agree on what the sections
 * are called.
 */
const NAV_GROUPS = [
  {
    id: 'kana',
    label: 'Kana',
    routes: [
      { to: '/', label: 'Characters', end: true },
      { to: '/flashcards', label: 'Flashcards', end: false },
      { to: '/quiz', label: 'Quiz', end: false },
      { to: '/pronunciation', label: 'Sounds', end: false },
      { to: '/writing', label: 'Writing', end: false },
    ],
  },
  {
    id: 'course',
    label: 'Course',
    routes: [
      { to: '/vocabulary', label: 'Vocabulary', end: false },
      { to: '/numbers', label: 'Numbers', end: false },
      { to: '/grammar', label: 'Grammar', end: false },
    ],
  },
] as const

function NavItem({ to, label, end }: { to: string; label: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'inline-flex min-h-11 items-center px-1 font-sans text-base transition-colors',
          // The active route is marked by ink weight and a rule, not by a
          // filled pill — chrome recedes (CLAUDE.md §7).
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

function NavGroup({
  id,
  label,
  routes,
}: {
  id: string
  label: string
  routes: readonly { to: string; label: string; end: boolean }[]
}) {
  const headingId = `nav-${id}`
  return (
    // `aria-labelledby` rather than `aria-label`: the landmark's name is then
    // the same string that is on screen, which is what a voice-control user
    // will say out loud (CLAUDE.md §8).
    <nav aria-labelledby={headingId} className="flex flex-wrap items-baseline gap-x-5">
      <span id={headingId} className="w-16 shrink-0">
        <Label>{label}</Label>
      </span>
      {/*
        Wraps, and has to. This row overflowed a 375px phone at five flat
        routes, and a non-wrapping nav pushed EVERY page into horizontal
        scroll. A scrolling nav would hide the last destinations behind a
        gesture nobody is told about.
      */}
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {routes.map((route) => (
          <NavItem key={route.to} {...route} />
        ))}
      </div>
    </nav>
  )
}

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-ground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl flex-col gap-y-2 px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <h1 className="m-0 font-sans text-lg font-semibold text-ink-0">
              Japanese practice
            </h1>
            <span className="font-sans text-label tracking-[0.08em] text-ink-2">
              v{APP_VERSION}
            </span>
          </div>

          {NAV_GROUPS.map((group) => (
            <NavGroup key={group.id} {...group} />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
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
  )
}
