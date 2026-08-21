import { CharacterGrid } from '../components/CharacterGrid'
import { DeckSummary } from '../components/DeckSummary'
import { SetPicker } from '../components/SetPicker'
import { CHARACTER_SETS } from '../characters/registry'
import { useCharacterSet } from '../lib/useCharacterSet'

/**
 * The selection grid.
 *
 * It reads the sets from the registry rather than naming one, which is what
 * made a second chart a picker here and nothing else. The deck spans both: an
 * id is script-qualified, so あ and ア can sit in one deck and the quiz can ask
 * you to tell them apart.
 */
export function Characters() {
  const { set, choose } = useCharacterSet()

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
          Choose what to study
        </h2>
        <p className="m-0 max-w-prose text-ink-1">
          Tap a character to add it to your deck. Tap a row label to take the whole row.
        </p>
        <SetPicker
          sets={CHARACTER_SETS}
          activeId={set.id}
          onChange={choose}
          label="Chart"
        />
      </header>

      <DeckSummary set={set} />
      <CharacterGrid set={set} />
    </section>
  )
}
