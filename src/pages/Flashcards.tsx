import { Label } from '../components/ui/primitives'

/** Phase 5. See PLAN.md. */
export function Flashcards() {
  return (
    <section className="flex flex-col gap-4">
      <Label>Flashcards</Label>
      <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
        Flip through your deck
      </h2>
      <p className="m-0 max-w-prose text-ink-1">
        Flashcards arrive in Phase 5, once there is a deck to draw from.
      </p>
    </section>
  )
}
