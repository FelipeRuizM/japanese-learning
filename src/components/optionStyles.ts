/**
 * How one option in a four-option question looks, before and after answering.
 *
 * Shared by all three quizzes (characters, vocabulary, numbers). Separate from
 * `ChoiceFeedback.tsx` because a module exporting both a component and a plain
 * function defeats fast refresh.
 */
/**
 * How one option looks, before and after answering.
 *
 * After answering, BOTH the right answer and a wrong choice are marked. Showing
 * only what they picked leaves someone who guessed wrong without the thing they
 * came for.
 */
export function optionButtonClasses({
  answered,
  isAnswer,
  isChosen,
}: {
  answered: boolean
  isAnswer: boolean
  isChosen: boolean
}): string {
  if (!answered) {
    return 'border-rule bg-transparent text-ink-0 hover:border-accent hover:bg-accent-soft'
  }
  if (isAnswer) return 'border-positive bg-transparent text-positive'
  if (isChosen) return 'border-negative bg-transparent text-negative'
  return 'border-rule bg-transparent text-ink-3'
}
