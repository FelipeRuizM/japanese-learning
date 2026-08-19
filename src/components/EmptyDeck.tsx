import { ButtonLink, Label } from './ui/primitives'

/**
 * The empty-deck screen.
 *
 * This is a PRIMARY screen, not an edge case: nothing persists between
 * sessions by design (CLAUDE.md §10), so every refresh lands here. It has to
 * say what happened and offer the way out, rather than reading as a fault.
 */
export function EmptyDeck({ activity }: { activity: string }) {
  return (
    <section className="flex flex-col items-start gap-4">
      <Label>Nothing selected</Label>
      <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
        Your deck is empty
      </h2>
      <p className="m-0 max-w-prose text-ink-1">
        Pick some characters and they&rsquo;ll show up here to {activity}. Nothing is
        saved between visits, so a refresh always starts you fresh.
      </p>
      <ButtonLink to="/" variant="primary">
        Choose characters
      </ButtonLink>
    </section>
  )
}
