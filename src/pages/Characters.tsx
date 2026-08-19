import { Label } from '../components/ui/primitives'

/**
 * The character grid. Phase 1 ships the route only — the grid itself, and the
 * deck it feeds, are Phase 3 (PLAN.md). This placeholder says what it is
 * rather than pretending to be finished.
 */
export function Characters() {
  return (
    <section className="flex flex-col gap-4">
      <Label>Characters</Label>
      <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
        Choose what to study
      </h2>
      <p className="m-0 max-w-prose text-ink-1">
        The selection grid arrives in Phase 3. It will show every hiragana character
        organised by row, and tapping one adds it to your deck.
      </p>
    </section>
  )
}
