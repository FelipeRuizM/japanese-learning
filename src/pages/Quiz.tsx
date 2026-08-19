import { Label } from '../components/ui/primitives'

/** Phase 6. See PLAN.md. */
export function Quiz() {
  return (
    <section className="flex flex-col gap-4">
      <Label>Quiz</Label>
      <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
        Test your recall
      </h2>
      <p className="m-0 max-w-prose text-ink-1">
        The quiz arrives in Phase 6. It will mix both directions at random — character
        to romaji, and romaji to character.
      </p>
    </section>
  )
}
