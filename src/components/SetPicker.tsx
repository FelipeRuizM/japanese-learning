/**
 * Which set is on screen.
 *
 * It takes the sets and reports an id — it never names one, and it has no idea
 * how many there are. With a single registered set it renders NOTHING: a picker
 * offering one choice is furniture, and the caller should not have to know that
 * (`CHARACTER_SETS.length > 1` scattered across two pages is exactly the kind of
 * detail that goes stale when a third set arrives).
 *
 * GENERIC OVER THE ID since v2.3, because there are two registries now and the
 * rule about rendering nothing for a single set is worth having once rather
 * than twice. It asks for `{ id, label }` and nothing else — both a
 * `CharacterSet` and a `VocabSet` satisfy that without being made to share a
 * base type they have no other reason to share. The id type is inferred, so a
 * script id and a vocabulary set id still cannot be passed to each other.
 *
 * `aria-pressed` rather than a radio group, matching `GridCell`: these are
 * toggles that stay on, and the pressed one is what you are reading.
 */
export function SetPicker<Id extends string>({
  sets,
  activeId,
  onChange,
  label,
}: {
  sets: readonly { id: Id; label: string }[]
  activeId: Id
  onChange: (id: Id) => void
  /** Names the group for a screen reader — "Chart", "Practise" and so on. */
  label: string
}) {
  if (sets.length < 2) return null

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {sets.map((set) => {
        const active = set.id === activeId
        return (
          <button
            key={set.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              onChange(set.id)
            }}
            // The same inversion a selected cell uses — ground on accent. The
            // picker and the chart under it are saying the same thing ("this
            // one is on"), so they say it the same way.
            className={[
              'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md',
              'border px-4 font-sans text-base font-medium transition-colors',
              active
                ? 'border-accent bg-accent text-ground'
                : 'border-rule bg-transparent text-ink-1 hover:bg-accent-soft',
            ].join(' ')}
          >
            {set.label}
          </button>
        )
      })}
    </div>
  )
}
