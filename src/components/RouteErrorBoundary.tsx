import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Label } from './ui/primitives'

/**
 * The route-level error boundary (CLAUDE.md §8). A thrown render error must
 * lose one route, never the whole app — and it must say something true rather
 * than a blank screen.
 */
export function RouteErrorBoundary() {
  const error = useRouteError()

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'

  return (
    <section className="flex flex-col gap-4">
      <Label>Something broke</Label>
      <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
        This page didn&rsquo;t load.
      </h2>
      <p className="m-0 text-ink-1">
        The rest of the app still works — use the navigation above. Nothing was lost:
        this app keeps no saved data (CLAUDE.md §10).
      </p>
      <p className="m-0 font-sans text-sm text-negative">{detail}</p>
    </section>
  )
}
