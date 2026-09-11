import { lazy } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DeckProvider } from './data/DeckProvider'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { Characters } from './pages/Characters'

/**
 * HashRouter, always. GitHub Pages has no SPA rewrite, so a BrowserRouter path
 * 404s on refresh and on any deep link (CLAUDE.md §2).
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
      { index: true, element: <Characters /> },
      { path: 'flashcards', element: <Flashcards /> },
      { path: 'quiz', element: <Quiz /> },
      { path: 'pronunciation', element: <Sounds /> },
      { path: 'writing', element: <Writing /> },
      { path: 'vocabulary', element: <Vocabulary /> },
      { path: 'styleguide', element: <Styleguide /> },
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
