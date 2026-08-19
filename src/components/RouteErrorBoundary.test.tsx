import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { RouteErrorBoundary } from './RouteErrorBoundary'

/**
 * CLAUDE.md §8 requires a route-level error boundary: a thrown render error
 * must cost one route, never the whole app. It had never been exercised until
 * the Phase 7 audit — an untested boundary is a claim, not a safety net.
 */
function Boom(): never {
  throw new Error('deliberate failure')
}

describe('the route error boundary', () => {
  it('catches a render error and still says something true', () => {
    // React logs the caught error; silence it so the run stays clean.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const router = createMemoryRouter([
      { path: '/', element: <Boom />, errorElement: <RouteErrorBoundary /> },
    ])
    render(<RouterProvider router={router} />)

    expect(screen.getByText(/didn’t load/i)).toBeInTheDocument()
    expect(screen.getByText('deliberate failure')).toBeInTheDocument()
    // Nothing was lost, because nothing is ever stored (§10).
    expect(screen.getByText(/keeps no saved data/i)).toBeInTheDocument()

    spy.mockRestore()
  })
})
