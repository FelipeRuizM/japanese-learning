import type { RoundSize } from '../lib/vocabQuiz'
import { roundSizeOptions } from '../lib/vocabQuiz'
import { Label, Toggle } from './ui/primitives'

/**
 * How many questions this round asks.
 *
 * Renders NOTHING when there is only one option, the rule `SetPicker` follows
 * for a single set: with five words selected the only honest offer is all five,
 * and a control with one choice is furniture.
 *
 * `'all'` is a live value, not a number captured at click time — turning a
 * topic on after choosing it lengthens the round, which is what "all" says.
 */
export function RoundSizePicker({
  total,
  size,
  onChange,
}: {
  total: number
  size: RoundSize
  onChange: (size: RoundSize) => void
}) {
  const options = roundSizeOptions(total)
  if (options.length < 2) return null

  return (
    <div className="flex flex-col gap-2">
      <Label>Questions</Label>
      <div role="group" aria-label="Questions" className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Toggle
            key={String(option)}
            size="sm"
            pressed={option === size}
            onClick={() => {
              onChange(option)
            }}
          >
            {option === 'all' ? `All (${total})` : option}
          </Toggle>
        ))}
      </div>
    </div>
  )
}
