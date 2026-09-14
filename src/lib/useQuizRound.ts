import { useState } from 'react'

/**
 * THE STATE EVERY QUIZ ROUND HAS, in one place.
 *
 * Four drills — characters, vocabulary, numbers, grammar — held byte-identical
 * copies of `index`, `chosen`, `score`, `done`, `choose` and `next`. That was
 * four copies of the same six lines before this phase asked all four to grow
 * back-and-forth navigation, an answer history and a retry. Four copies of
 * something that now has to be right is not a style question.
 *
 * It is a HOOK rather than a component, which is the same split the cards
 * make: what the four genuinely differ in is the prompt and the options, and a
 * shared component would take those as parameters and be a parameter list
 * wearing a component's clothes (see `ChoiceFeedback`). The state is not
 * different between them at all.
 *
 * NOTHING HERE IS PERSISTED. The answer history lives and dies with the
 * component, exactly as the score always has — this is a round you are in the
 * middle of, not a record of rounds you have done (CLAUDE.md §10).
 */
export type QuizRound<Q, A> = {
  questions: readonly Q[]
  index: number
  question: Q | undefined
  /** The answer given for the question on screen, or `null` if unanswered. */
  chosen: A | null
  score: number
  done: boolean
  isLast: boolean
  canGoBack: boolean
  /** Next is blocked until the question on screen has been answered. */
  canGoNext: boolean
  /**
   * True when this question was answered on an EARLIER visit — you paged back
   * to it. Distinct from `chosen !== null`, which is also true in the moment
   * after answering, and the difference matters: one is a result you are being
   * shown, the other is a result you are re-reading.
   */
  isReview: boolean
  answer: (choice: A) => void
  next: () => void
  previous: () => void
  /** The questions answered wrongly, in round order. What a retry is built from. */
  missed: Q[]
}

export function useQuizRound<Q, A>(
  questions: readonly Q[],
  isCorrect: (question: Q, choice: A) => boolean,
): QuizRound<Q, A> {
  const [answers, setAnswers] = useState<(A | null)[]>(() => questions.map(() => null))
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  /**
   * The question being answered right now, or `null` once you navigate off it.
   *
   * CLEARED BY EVERY MOVE, which is the whole of the distinction. Setting it on
   * answering and never clearing it makes "go forward then straight back" look
   * like answering rather than reviewing, because the index matches again —
   * a test on the numbers drill caught exactly that, one step off the path the
   * kana quiz test happened to take.
   */
  const [answering, setAnswering] = useState<number | null>(null)

  const question = questions[index]
  const chosen = answers[index] ?? null

  /**
   * Derived, never stored. A stored score and a stored answer list are two
   * facts that can disagree, and the one a retry is built from is the list —
   * so the score is computed from it rather than counted up alongside it.
   */
  const verdicts = questions.map((q, i) => {
    const given = answers[i]
    return given === null || given === undefined ? null : isCorrect(q, given)
  })

  return {
    questions,
    index,
    question,
    chosen,
    score: verdicts.filter((v) => v === true).length,
    done,
    isLast: index + 1 >= questions.length,
    canGoBack: index > 0,
    canGoNext: chosen !== null,
    isReview: chosen !== null && answering !== index,
    missed: questions.filter((_, i) => verdicts[i] === false),

    answer: (choice: A) => {
      // An answered question is final. Paging back to change one would make the
      // score a thing you can repair rather than a reading of the round you
      // actually did (§5).
      if (answers[index] !== null && answers[index] !== undefined) return
      setAnswers((current) => {
        const next = [...current]
        next[index] = choice
        return next
      })
      setAnswering(index)
    },

    next: () => {
      setAnswering(null)
      if (index + 1 >= questions.length) setDone(true)
      else setIndex(index + 1)
    },

    previous: () => {
      setAnswering(null)
      if (index > 0) setIndex(index - 1)
    },
  }
}
