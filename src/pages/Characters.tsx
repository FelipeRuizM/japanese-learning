import { CharacterGrid } from '../components/CharacterGrid'
import { DeckSummary } from '../components/DeckSummary'
import { DEFAULT_CHARACTER_SET } from '../characters/registry'
import { Label } from '../components/ui/primitives'

/**
 * The selection grid.
 *
 * It reads the set from the registry rather than naming one, so a second set
 * becomes a picker here and nothing else changes.
 */
export function Characters() {
  const set = DEFAULT_CHARACTER_SET

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Label>{set.label}</Label>
        <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
          Choose what to study
        </h2>
        <p className="m-0 max-w-prose text-ink-1">
          Tap a character to add it to your deck. Tap a row label to take the whole row.
        </p>
      </header>

      <DeckSummary set={set} />
      <CharacterGrid set={set} />
    </section>
  )
}
