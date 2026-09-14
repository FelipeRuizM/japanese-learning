import { useState } from 'react'
import type { VocabEntry, VocabSet } from '../types/vocab'
import { VOCAB_SETS, everyVocabEntry, vocabGroupRefs } from '../vocab/registry'

/** A week's own toggle: all of it, none of it, or some of it. */
export type WeekState = boolean | 'mixed'

export type VocabScope = {
  weeks: readonly VocabSet[]
  /** Set-qualified group ids, as `vocabGroupId` builds them. */
  selectedGroupIds: ReadonlySet<string>
  /** The chosen words, in registry order. */
  entries: VocabEntry[]
  /** The weeks contributing at least one group, for citing their notes. */
  chosenWeeks: VocabSet[]
  weekState: (set: VocabSet) => WeekState
  toggleWeek: (set: VocabSet) => void
  toggleGroup: (groupId: string) => void
  /**
   * Changes whenever the SELECTION changes. A remount key: a changed scope has
   * to restart the cards and rebuild the round, and a key is how that is said
   * once rather than in an effect on each of them.
   */
  key: string
}

/**
 * What the vocabulary screen is drilling — which weeks, and which topics inside
 * them (CLAUDE.md §11.4).
 *
 * THE SELECTION IS A SET OF GROUP IDS, AND ONLY THAT. A week is not stored
 * separately; its toggle is derived from whether its groups are all in, all
 * out, or mixed. Storing both would mean two facts that can disagree — a week
 * marked on with none of its topics selected — and the screen would have to
 * pick which one to believe.
 *
 * PER PAGE, like `useCharacterSet` before it (CLAUDE.md §5): the app has one
 * context and the deck has it. This replaced `useVocabSet`, which held a single
 * id; a single id cannot express "these three topics out of two weeks", which
 * is the whole of this phase.
 *
 * The default is the FIRST WEEK, whole. Not everything: with a second week
 * registered, "everything" silently turns the default round into ninety
 * questions, and a default nobody chose should not grow every time the vault
 * does.
 */
export function useVocabScope(): VocabScope {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => {
    const first = VOCAB_SETS[0]
    return new Set(first ? vocabGroupRefs(first).map((g) => g.id) : [])
  })

  const groupIdsOf = (set: VocabSet) => vocabGroupRefs(set).map((g) => g.id)

  const weekState = (set: VocabSet): WeekState => {
    const ids = groupIdsOf(set)
    const on = ids.filter((id) => selected.has(id)).length
    if (on === 0) return false
    return on === ids.length ? true : 'mixed'
  }

  const toggleWeek = (set: VocabSet) => {
    const ids = groupIdsOf(set)
    setSelected((current) => {
      const next = new Set(current)
      // MIXED CLEARS, it does not fill. A half-lit week reads as "partly on",
      // and the obvious thing to do to something partly on is turn it off.
      // Filling from mixed would also make the control unable to clear a week
      // at all without first clicking every topic.
      const clearing = ids.some((id) => current.has(id))
      for (const id of ids) {
        if (clearing) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  const toggleGroup = (groupId: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(groupId)) next.add(groupId)
      return next
    })
  }

  // Filtering the flat registry list, rather than walking the chosen groups,
  // keeps the result in registry order however the selection was clicked.
  const entries = everyVocabEntry().filter((entry) => selected.has(entry.groupId))
  const chosenWeeks = VOCAB_SETS.filter((set) => weekState(set) !== false)

  return {
    weeks: VOCAB_SETS,
    selectedGroupIds: selected,
    entries,
    chosenWeeks,
    weekState,
    toggleWeek,
    toggleGroup,
    // Sorted: the key must describe WHAT is selected, not the order it was
    // clicked in, or turning a topic off and on again would restart the round.
    key: [...selected].sort().join('|'),
  }
}
