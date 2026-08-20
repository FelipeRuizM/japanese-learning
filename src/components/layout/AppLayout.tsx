import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { APP_VERSION } from '../../version'
import { Label } from '../ui/primitives'

/**
 * The nav is a plain list of routes today. When the deck lands in Phase 3 it
 * grows a count; it does not grow anything else.
 */
const ROUTES = [
  { to: '/', label: 'Characters', end: true },
  { to: '/flashcards', label: 'Flashcards', end: false },
  { to: '/quiz', label: 'Quiz', end: false },
  { to: '/pronunciation', label: 'Sounds', end: false },
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

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-ground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl flex-wrap items-baseline gap-x-6 gap-y-2 px-5 py-4">
          <h1 className="m-0 font-sans text-lg font-semibold text-ink-0">
            Japanese practice
          </h1>
          <span className="font-sans text-label tracking-[0.08em] text-ink-2">
            v{APP_VERSION}
          </span>
          <nav aria-label="Primary" className="flex gap-5">
            {ROUTES.map((route) => (
              <NavItem key={route.to} {...route} />
            ))}
          </nav>
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
