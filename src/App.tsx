import { lazy } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DeckProvider } from './data/DeckProvider'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { Characters } from './pages/Characters'
import { PATHS } from './routes'

/**
 * HashRouter, always. GitHub Pages has no SPA rewrite, so a BrowserRouter path
 * 404s on refresh and on any deep link (CLAUDE.md §2).
 *
 * THE PATHS LIVE IN `routes.ts`, not here. The router, the shell's navigation
 * and a handful of in-page links all have to agree on them, and three copies of
 * `/kana/quiz` is two too many.
 *
 * Characters is the landing route and stays eager — lazy-loading it would put a
 * fallback in front of the very first paint for the one case with nothing
 * cached. Everything else is its own chunk.
 */
const Flashcards = lazy(() =>
  import('./pages/Flashcards').then((m) => ({ default: m.Flashcards })),
)
const Quiz = lazy(() => import('./pages/Quiz').then((m) => ({ default: m.Quiz })))
const Sounds = lazy(() => import('./pages/Sounds').then((m) => ({ default: m.Sounds })))
const Writing = lazy(() =>
  import('./pages/Writing').then((m) => ({ default: m.Writing })),
)
const Vocabulary = lazy(() =>
  import('./pages/Vocabulary').then((m) => ({ default: m.Vocabulary })),
)
const Numbers = lazy(() =>
  import('./pages/Numbers').then((m) => ({ default: m.Numbers })),
)
const Grammar = lazy(() =>
  import('./pages/Grammar').then((m) => ({ default: m.Grammar })),
)
const Styleguide = lazy(() =>
  import('./pages/Styleguide').then((m) => ({ default: m.Styleguide })),
)
const NotFound = lazy(() =>
  import('./pages/NotFound').then((m) => ({ default: m.NotFound })),
)

const router = createHashRouter([
  {
    element: <AppLayout />,
    // A data router is what gives `useRouteError` something to read, which is
    // why the boundary hangs off the layout rather than wrapping <Routes>.
    errorElement: <RouteErrorBoundary />,
    children: [
      // `#/` is a real address someone can land on, and it belongs to neither
      // pillar. It redirects rather than rendering the grid at a second path:
      // two URLs for one screen is a bookmark that disagrees with the sidebar.
      // `replace`, so Back leaves the app instead of bouncing off the redirect.
      { index: true, element: <Navigate to={PATHS.characters} replace /> },

      { path: PATHS.characters.slice(1), element: <Characters /> },
      { path: PATHS.flashcards.slice(1), element: <Flashcards /> },
      { path: PATHS.quiz.slice(1), element: <Quiz /> },
      { path: PATHS.sounds.slice(1), element: <Sounds /> },
      { path: PATHS.writing.slice(1), element: <Writing /> },

      { path: PATHS.vocabulary.slice(1), element: <Vocabulary /> },
      { path: PATHS.numbers.slice(1), element: <Numbers /> },
      { path: PATHS.grammar.slice(1), element: <Grammar /> },

      { path: PATHS.styleguide.slice(1), element: <Styleguide /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export function App() {
  // The deck lives ABOVE the router, so a selection survives navigating between
  // the grid, the flashcards and the quiz. It does not survive a refresh, and
  // that is the design (CLAUDE.md §10).
  return (
    <DeckProvider>
      <RouterProvider router={router} />
    </DeckProvider>
  )
}
