import type { CharacterSet } from '../types/characters'
import { allCharacters } from '../characters/registry'
import { useDeck } from '../data/useDeck'
import { hasAll } from '../data/deck'
import { Button, ButtonLink, Chip } from './ui/primitives'

/**
 * What is in the deck, and what to do with it.
 *
 * THE DECK SPANS EVERY SET; this summary sits above ONE chart. That gap is the
 * whole design of this component:
 *
 *   - the count reads "12 of 71 selected" against the chart you are looking at,
 *     because that is the chart whose cells you can see,
 *   - anything selected on another chart is stated separately rather than
 *     folded into that fraction — "12 of 71" while the deck holds 20 would just
 *     look wrong, and
 *   - "Select all" and "Clear all" act on THIS chart, so switching charts and
 *     clearing does not silently throw away the other half of your deck.
 *     Wiping everything is a separate, named control.
 *
 * The through-links to Flashcards and Quiz appear only once something is
 * selected. With an empty deck they would lead straight to an empty state, and
 * offering a door that opens onto a shrug is worse than not offering it — the
 * primary nav still carries both routes for anyone who wants to look.
 */
export function DeckSummary({ set }: { set: CharacterSet }) {
  const deck = useDeck()
  const ids = allCharacters(set).map((character) => character.id)

  const here = ids.filter((id) => deck.has(id)).length
  const elsewhere = deck.count - here
  const everything = hasAll(deck.selected, ids)

  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <Chip>
          {/* "0 selected" is a real state worth naming, not a blank. */}
          {here} of {ids.length} selected
        </Chip>

        {elsewhere > 0 && <Chip>+{elsewhere} on another chart</Chip>}

        <Button onClick={() => (everything ? deck.deselect(ids) : deck.select(ids))}>
          {everything ? 'Clear all' : 'Select all'}
        </Button>

        {/* Only when it would do something the button beside it does not. */}
        {deck.count > 0 && (elsewhere > 0 || !everything) && (
          <Button onClick={deck.clear}>Clear deck</Button>
        )}
      </div>

      {deck.count > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink to="/flashcards" variant="primary">
            Study {deck.count} as flashcards
          </ButtonLink>
          <ButtonLink to="/quiz">Quiz me</ButtonLink>
        </div>
      )}
    </div>
  )
}
