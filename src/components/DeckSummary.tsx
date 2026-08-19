import type { CharacterSet } from '../types/characters'
import { allCharacters } from '../characters/registry'
import { useDeck } from '../data/useDeck'
import { hasAll } from '../data/deck'
import { Button, ButtonLink, Chip } from './ui/primitives'

/**
 * What is in the deck, and what to do with it.
 *
 * The through-links to Flashcards and Quiz appear only once something is
 * selected. With an empty deck they would lead straight to an empty state, and
 * offering a door that opens onto a shrug is worse than not offering it — the
 * primary nav still carries both routes for anyone who wants to look.
 */
export function DeckSummary({ set }: { set: CharacterSet }) {
  const deck = useDeck()
  const ids = allCharacters(set).map((character) => character.id)
  const everything = hasAll(deck.selected, ids)

  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <Chip>
          {/* "0 selected" is a real state worth naming, not a blank. */}
          {deck.count} of {ids.length} selected
        </Chip>

        <Button onClick={() => (everything ? deck.clear() : deck.select(ids))}>
          {everything ? 'Clear all' : 'Select all'}
        </Button>

        {deck.count > 0 && !everything && <Button onClick={deck.clear}>Clear</Button>}
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
