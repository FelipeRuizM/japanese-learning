import type { VocabSet } from '../types/vocab'
import type { VocabScope } from '../lib/useVocabScope'
import { vocabGroupRefs } from '../vocab/registry'
import { Label, Toggle } from './ui/primitives'

/**
 * WHICH WEEKS AND WHICH TOPICS (CLAUDE.md §11.4).
 *
 * The weeks are not a separate row above the topics. Each week's own toggle
 * leads its topics, because that toggle IS "all of this week" — a separate row
 * would be a second control saying the same thing from further away, and with
 * two weeks registered it would leave the reader to work out which topic row
 * belonged to which.
 *
 * It takes the scope and never names a week, the same rule everything else that
 * renders vocabulary follows: a new week arrives as a registry entry and this
 * file does not change.
 */
export function ScopePicker({ scope }: { scope: VocabScope }) {
  return (
    <div className="flex flex-col gap-3">
      <Label>Weeks &amp; topics</Label>
      {scope.weeks.map((week) => (
        <WeekRow key={week.id} week={week} scope={scope} />
      ))}
    </div>
  )
}

function WeekRow({ week, scope }: { week: VocabSet; scope: VocabScope }) {
  return (
    <div role="group" aria-label={week.label} className="flex flex-wrap gap-2">
      <Toggle
        pressed={scope.weekState(week)}
        // The visible text is inside the accessible name rather than replaced
        // by it — a voice-control user says what they can read (§8). Without
        // the prefix this button is indistinguishable from a topic.
        label={`All of ${week.label}`}
        onClick={() => {
          scope.toggleWeek(week)
        }}
      >
        {week.label}
      </Toggle>

      {/* Decorative: the grouping is carried by `role="group"`, not by a line. */}
      <span aria-hidden="true" className="my-1 w-px self-stretch bg-rule" />

      {vocabGroupRefs(week).map((group) => (
        <Toggle
          key={group.id}
          size="sm"
          pressed={scope.selectedGroupIds.has(group.id)}
          onClick={() => {
            scope.toggleGroup(group.id)
          }}
        >
          {group.label}
        </Toggle>
      ))}
    </div>
  )
}
