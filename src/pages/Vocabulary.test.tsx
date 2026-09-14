import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Vocabulary } from './Vocabulary'
import { VOCAB_SETS, allVocab } from '../vocab/registry'
import type { VocabSet } from '../types/vocab'

const speak = vi.fn()
vi.mock('../lib/usePronunciation', () => ({
  usePronunciation: () => ({ status: 'ready', speak: (s: unknown) => speak(s) }),
}))

/**
 * The set is shuffled once per visit, so no test may depend on WHICH card is
 * first. Every assertion below is about the card on screen, whichever it is.
 */
const card = () => screen.getByRole('button', { expanded: false })
const flipped = () => screen.getByRole('button', { expanded: true })

/** The card whichever way up it is, for queries that must exclude its contents. */
const cardEl = () => {
  const el = screen.getAllByRole('button').find((b) => b.hasAttribute('aria-expanded'))
  if (!el) throw new Error('no card on screen')
  return el
}

/**
 * The group labels showing as the reveal's category chip.
 *
 * TWO THINGS ARE EXCLUDED, and each is a real thing on the page:
 *
 *   - THE CARD ITSELF. でんわ MEANS "Phone" and sits in the group labelled
 *     "Phone", so a bare text query cannot tell the chip from the card's own
 *     meaning. Both faces are always in the DOM, so before any reveal that
 *     query already finds one — the test then passes or fails on which item the
 *     shuffle deals, which is the worst kind of failure to debug.
 *   - BUTTONS. Every topic label is permanently on screen as a toggle in the
 *     scope picker, and that is not a hint: a list of all eleven topics says
 *     nothing about which one THIS card belongs to. The rule is that the
 *     category is not STATED beside the prompt, and a control offering every
 *     category states none of them.
 */
const groupChipsOnScreen = (labels: readonly string[]) =>
  labels.filter((label) =>
    screen
      .queryAllByText(label)
      .some((el) => !cardEl().contains(el) && el.closest('button') === null),
  )

function firstSet(): VocabSet {
  const set = VOCAB_SETS[0]
  if (!set) throw new Error('no vocabulary set is registered')
  return set
}

const PROMPT = 'Show the meaning of '

/**
 * Which item is on screen, read off the card's accessible name.
 *
 * MATCHED EXACTLY, NOT BY `includes`. When one item's kana is a prefix of
 * another's, a substring search returns the short one whenever the shuffle
 * deals the long one, and the test then fails on a fraction of visits. It did,
 * back when the set carried ありがとう beside ありがとうございます. The exact
 * match is kept rather than relaxed because a later week will reintroduce the
 * shape, and an intermittent test is worse than a strict one.
 */
function currentItem() {
  const name = card().getAttribute('aria-label') ?? ''
  const kana = name.startsWith(PROMPT) ? name.slice(PROMPT.length) : ''
  const item = allVocab(firstSet()).find((i) => i.kana === kana)
  if (!item) throw new Error(`no item matched "${name}"`)
  return item
}

const show = () =>
  render(
    <MemoryRouter>
      <Vocabulary />
    </MemoryRouter>,
  )

beforeEach(() => {
  speak.mockClear()
})

describe('Vocabulary flashcards', () => {
  /**
   * A set is now a WEEK, and one week is registered — so the week chooser
   * renders nothing at all. That is `SetPicker`'s own rule (§3.5) rather than
   * anything this page decides, and the assertion is here because the page is
   * where it is visible: a chooser offering a single option is a control that
   * cannot do anything.
   */
  it('renders no week chooser while a single week is registered', () => {
    show()
    expect(VOCAB_SETS).toHaveLength(1)
    expect(screen.queryByRole('group', { name: 'Vocabulary set' })).toBeNull()
  })

  it('counts the cards in the chosen set, and heads the position', () => {
    show()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: `Card 1 of ${allVocab(firstSet()).length}`,
      }),
    ).toBeInTheDocument()
  })

  /**
   * THE FRONT MUST NOT CARRY THE ANSWER, and an `aria-label` is DOM — the same
   * rule writing practice is built on (CLAUDE.md §1, bite 10). Both faces are
   * rendered so the card has something to flip to, which makes the accessible
   * name the only thing between a screen-reader user and the meaning.
   */
  it('does not name the meaning before the reveal', () => {
    show()
    // `currentItem` throws unless the name is exactly the prompt plus a real
    // item's kana, so resolving one is itself the assertion that nothing else
    // is in there.
    const item = currentItem()
    const name = card().getAttribute('aria-label') ?? ''

    expect(name).toContain(item.kana)
    expect(name).not.toContain(item.english)
    expect(name).not.toContain(item.romaji)
    if (item.note !== undefined) expect(name).not.toContain(item.note)
  })

  it('gives the reading and the meaning once flipped', async () => {
    const user = userEvent.setup()
    show()
    const item = currentItem()

    await user.click(card())

    expect(flipped()).toHaveAccessibleName(
      `${item.kana} is "${item.romaji}" — ${item.english}. Hide the meaning.`,
    )
    // Scoped to the card: a meaning can also be a group label on this page.
    expect(within(flipped()).getByText(item.english)).toBeInTheDocument()
  })

  /**
   * A category beside a prompt is a hint: "Meals" narrows いただきます to one of
   * two. The group belongs to the reveal, where it is context instead.
   */
  it('withholds the group label until the reveal', async () => {
    const user = userEvent.setup()
    show()
    const groups = firstSet().groups.map((g) => g.label)

    expect(groupChipsOnScreen(groups)).toEqual([])

    await user.click(card())
    expect(groupChipsOnScreen(groups)).toHaveLength(1)
  })

  it('speaks on the reveal and stays silent flipping back', async () => {
    const user = userEvent.setup()
    show()
    const item = currentItem()

    await user.click(card())
    expect(speak).toHaveBeenCalledTimes(1)
    // The KANA, never the romaji — a ja-JP voice reads romaji as English.
    expect(speak).toHaveBeenCalledWith({ ja: item.kana })

    await user.click(flipped())
    expect(speak).toHaveBeenCalledTimes(1)
  })

  it('starts each new card face down', async () => {
    const user = userEvent.setup()
    show()

    await user.click(card())
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument()
  })

  /**
   * THE TRANSITION LEAK (CLAUDE.md §5, bite 13).
   *
   * Advancing from a revealed card changes the item and clears `revealed` in
   * one render. On a single DOM node the browser animates
   * `rotateY(180deg) → 0deg`, and past the midpoint the face toward the viewer
   * is the back of the card now holding the NEXT item — its meaning, legible in
   * the wobble. A freshly mounted node has no previous value to interpolate
   * from, so there is nothing to animate and nothing to glimpse.
   *
   * jsdom runs no transitions, so this asserts node identity rather than
   * appearance. That identity is what makes the leak impossible.
   */
  it('mounts a new node when advancing from a revealed card', async () => {
    const user = userEvent.setup()
    show()

    await user.click(card())
    const revealedNode = flipped()
    expect(revealedNode.style.transform).toBe('rotateY(180deg)')

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(card()).not.toBe(revealedNode)
    expect(card().style.transform).toBe('rotateY(0deg)')
  })

  it('mounts a new node going back, too', async () => {
    const user = userEvent.setup()
    show()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(card())
    const revealedNode = flipped()

    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(card()).not.toBe(revealedNode)
    expect(card().style.transform).toBe('rotateY(0deg)')
  })

  /** A real flip must still animate — it is functional motion, not decoration. */
  it('keeps the same node when flipping one card', async () => {
    const user = userEvent.setup()
    show()

    const front = card()
    await user.click(front)

    expect(flipped()).toBe(front)
    expect(front.style.transform).toBe('rotateY(180deg)')
  })

  it('walks the whole set and stops at both ends', async () => {
    const user = userEvent.setup()
    show()
    const total = allVocab(firstSet()).length

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    for (let i = 1; i < total; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }

    expect(
      screen.getByRole('heading', { level: 2, name: `Card ${total} of ${total}` }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  /*
   * There was a test here that switched to a second set and asserted the cards
   * restarted from the top. It cannot run against a single registered week, and
   * writing a fixture week to keep it alive would test the fixture. The
   * behaviour it guarded — a changed selection remounts the cards — is still
   * covered by "goes back to the cards, from the top", which switches MODE
   * through the same remount. It comes back properly in the next phase, when
   * the selection becomes weeks and topics rather than one set.
   */

  it('cites the class note the set came from', () => {
    show()
    expect(screen.getByText(`From ${firstSet().source}.`)).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------------- */

const optionButtons = () =>
  screen.getAllByRole('listitem').map((li) => {
    const button = li.querySelector('button')
    if (!button) throw new Error('an option rendered without a button')
    return button
  })

/**
 * The number of questions the round on screen says it has.
 *
 * READ OFF THE HEADING rather than computed from the data. A round is now a
 * SAMPLE of the chosen scope — it is however long the size picker says — so a
 * test that recomputed the length would be asserting its own arithmetic
 * against the page's, and would agree with a page that had ignored the picker
 * entirely.
 */
function roundTotal(): number {
  const heading = screen.getByRole('heading', {
    level: 2,
    name: /^Question \d+ of \d+$/,
  })
  const total = /of (\d+)$/.exec(heading.textContent ?? '')?.[1]
  if (!total) throw new Error(`unreadable round heading: "${heading.textContent}"`)
  return Number(total)
}

/** Answer and advance through a whole round, counting the verdicts. */
async function walkRound(user: ReturnType<typeof userEvent.setup>) {
  const total = roundTotal()
  let correct = 0
  for (let i = 0; i < total; i++) {
    const first = optionButtons()[0]
    if (!first) throw new Error('no options')
    await user.click(first)
    if (screen.queryByText('Correct') !== null) correct++
    await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
  }
  return { total, correct }
}

/** Switch the page into quiz mode. */
async function enterQuiz(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Quiz' }))
}

describe('Vocabulary quiz', () => {
  it('offers the two modes, with cards showing first', () => {
    show()
    expect(screen.getByRole('group', { name: 'Practice mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Quiz' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('asks the chosen number of questions, not the whole scope', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    // 10 is the default, and the week holds far more than that — so this also
    // says the round is a SAMPLE rather than an enumeration.
    expect(allVocab(firstSet()).length).toBeGreaterThan(10)
    expect(roundTotal()).toBe(10)
  })

  it('always offers four options', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    expect(optionButtons()).toHaveLength(4)
  })

  /** Four options that show the same thing twice is not a question (§11.2). */
  it('never shows the same option value twice', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    const total = roundTotal()
    for (let i = 0; i < total; i++) {
      const shown = optionButtons().map((b) => b.textContent)
      expect(new Set(shown).size, `question ${i + 1}`).toBe(4)

      const first = optionButtons()[0]
      if (!first) throw new Error('no options')
      await user.click(first)
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }
  })

  it('marks the right answer and says so in words, not only colour', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    const first = optionButtons()[0]
    if (!first) throw new Error('no options')
    await user.click(first)

    // A word, always — colour is never the only channel (CLAUDE.md §7).
    expect(screen.getByText(/^(Correct|Not quite)$/)).toBeInTheDocument()

    // Exactly one option is marked right, whether or not they picked it:
    // someone who guessed wrong still needs the thing they came for.
    const marked = optionButtons().filter((b) =>
      b.className.includes('border-positive'),
    )
    expect(marked).toHaveLength(1)
  })

  it('locks the options once answered', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    const first = optionButtons()[0]
    if (!first) throw new Error('no options')
    await user.click(first)

    for (const button of optionButtons()) expect(button).toBeDisabled()
  })

  it('speaks the answer on answering, in kana', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)
    speak.mockClear()

    const first = optionButtons()[0]
    if (!first) throw new Error('no options')
    await user.click(first)

    expect(speak).toHaveBeenCalledTimes(1)
    const spoken = speak.mock.calls[0]?.[0] as { ja: string }
    expect(allVocab(firstSet()).some((i) => i.kana === spoken.ja)).toBe(true)
  })

  it('counts the round and reports a score that matches the verdicts', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    const { total, correct } = await walkRound(user)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Round complete' }),
    ).toBeInTheDocument()
    expect(screen.getByText(`${correct} / ${total}`)).toBeInTheDocument()
  })

  it('starts a fresh round on Go again', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    const { total } = await walkRound(user)

    await user.click(screen.getByRole('button', { name: 'Go again' }))
    expect(
      screen.getByRole('heading', { level: 2, name: `Question 1 of ${total}` }),
    ).toBeInTheDocument()
  })

  /* Removed with its sibling above, and for the same reason. */

  it('goes back to the cards, from the top', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)
    await user.click(screen.getByRole('button', { name: 'Cards' }))

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: `Card 1 of ${allVocab(firstSet()).length}`,
      }),
    ).toBeInTheDocument()
  })
})

/* ------------------------------------------------------------------------- */

/**
 * SCOPED TO THE PICKER, and it has to be — the same でんわ / "Phone" collision
 * that bit the card tests, in a second place.
 *
 * でんわ means "Phone" and its topic is labelled "Phone", so in quiz mode a
 * kana→English question that happens to offer でんわ puts a SECOND button named
 * "Phone" on the page. An unscoped `getByRole` then throws "found multiple
 * elements" — on the fraction of shuffles that deal that one item, in the full
 * suite, with a message that says nothing about why.
 *
 * The scope picker's week row is a `group` named for the week, so that is the
 * boundary. This is the third time one datum has forced a query to be scoped;
 * the lesson is not about でんわ, it is that a vocabulary meaning and a topic
 * label are drawn from overlapping vocabularies and always could collide.
 */
const pickerFor = (set: VocabSet) =>
  within(screen.getByRole('group', { name: set.label }))

const topicToggle = (label: string, set: VocabSet) =>
  pickerFor(set).getByRole('button', { name: label })

const weekToggle = (set: VocabSet) =>
  pickerFor(set).getByRole('button', { name: `All of ${set.label}` })

const cardCount = () => {
  const heading = screen.getByRole('heading', { level: 2, name: /^Card \d+ of \d+$/ })
  return Number(/of (\d+)$/.exec(heading.textContent ?? '')?.[1])
}

describe('the scope picker', () => {
  it('offers every topic of every week, all on to begin with', () => {
    show()
    const group = screen.getByRole('group', { name: firstSet().label })

    for (const topic of firstSet().groups) {
      expect(within(group).getByRole('button', { name: topic.label })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    }
    expect(weekToggle(firstSet())).toHaveAttribute('aria-pressed', 'true')
  })

  /**
   * The week toggle is DERIVED from its topics rather than stored beside them.
   * Storing both would allow "week on, no topics selected", and the screen
   * would then have to choose which of the two facts to believe.
   */
  it('marks the week mixed once a topic is turned off', async () => {
    const user = userEvent.setup()
    show()
    const topic = firstSet().groups[0]
    if (!topic) throw new Error('the week has no topics')

    await user.click(topicToggle(topic.label, firstSet()))

    expect(topicToggle(topic.label, firstSet())).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(weekToggle(firstSet())).toHaveAttribute('aria-pressed', 'mixed')
  })

  it('narrows the cards to the topics left on', async () => {
    const user = userEvent.setup()
    show()
    const topic = firstSet().groups[0]
    if (!topic) throw new Error('the week has no topics')
    const before = cardCount()

    await user.click(topicToggle(topic.label, firstSet()))

    expect(cardCount()).toBe(before - topic.items.length)
  })

  /**
   * This is the coverage Phase 14 lost when the second set went away, back in
   * the shape the selection actually has now: a changed scope restarts the
   * pass rather than carrying on from card 19 of a list that just changed.
   */
  it('restarts the cards when the scope changes', async () => {
    const user = userEvent.setup()
    show()
    const topic = firstSet().groups[0]
    if (!topic) throw new Error('the week has no topics')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(
      screen.getByRole('heading', { level: 2, name: /^Card 3 of / }),
    ).toBeInTheDocument()

    await user.click(topicToggle(topic.label, firstSet()))

    expect(
      screen.getByRole('heading', { level: 2, name: /^Card 1 of / }),
    ).toBeInTheDocument()
  })

  /** MIXED CLEARS. A half-lit control is one you are on your way to turning off. */
  it('clears the whole week from mixed, rather than filling it', async () => {
    const user = userEvent.setup()
    show()
    const topic = firstSet().groups[0]
    if (!topic) throw new Error('the week has no topics')

    await user.click(topicToggle(topic.label, firstSet()))
    expect(weekToggle(firstSet())).toHaveAttribute('aria-pressed', 'mixed')

    await user.click(weekToggle(firstSet()))
    expect(weekToggle(firstSet())).toHaveAttribute('aria-pressed', 'false')
  })

  it('fills the week again from empty', async () => {
    const user = userEvent.setup()
    show()

    await user.click(weekToggle(firstSet()))
    await user.click(weekToggle(firstSet()))

    expect(weekToggle(firstSet())).toHaveAttribute('aria-pressed', 'true')
    expect(cardCount()).toBe(allVocab(firstSet()).length)
  })

  /** A designed empty state, not a bare "no data" (CLAUDE.md §8). */
  it('says what to do when nothing is selected', async () => {
    const user = userEvent.setup()
    show()

    await user.click(weekToggle(firstSet()))

    expect(
      screen.getByRole('heading', { level: 2, name: 'Nothing selected' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^Card / })).toBeNull()
  })
})

describe('the round size picker', () => {
  it('is a quiz control, and not on screen with the cards', async () => {
    const user = userEvent.setup()
    show()
    expect(screen.queryByRole('group', { name: 'Questions' })).toBeNull()

    await enterQuiz(user)
    expect(screen.getByRole('group', { name: 'Questions' })).toBeInTheDocument()
  })

  it('builds a round of the chosen length', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    await user.click(screen.getByRole('button', { name: '5' }))

    expect(roundTotal()).toBe(5)
  })

  it('offers all of the scope, and says how many that is', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)
    const total = allVocab(firstSet()).length

    await user.click(screen.getByRole('button', { name: `All (${total})` }))

    expect(roundTotal()).toBe(total)
  })

  /**
   * A round is a SAMPLE, so a short round over a big scope must not always deal
   * the same five words. Two rounds of five from forty-four agreeing entirely
   * would be a 1-in-1.1-million coincidence; over three rounds, the assertion
   * is that at least one pair differs.
   */
  it('samples the scope rather than taking its first few', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)
    await user.click(screen.getByRole('button', { name: '5' }))

    const rounds: string[] = []
    for (let i = 0; i < 3; i++) {
      const seen: string[] = []
      for (let q = 0; q < 5; q++) {
        seen.push(
          optionButtons()
            .map((b) => b.textContent)
            .join('/'),
        )
        const first = optionButtons()[0]
        if (!first) throw new Error('no options')
        await user.click(first)
        await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
      }
      rounds.push(seen.join('|'))
      await user.click(screen.getByRole('button', { name: 'Go again' }))
    }

    expect(new Set(rounds).size).toBeGreaterThan(1)
  })

  /**
   * The stored size falls back to `'all'` when the scope can no longer offer
   * it, so exactly one option is pressed at all times. Without that, narrowing
   * the topics past a preset leaves every option unpressed and the round some
   * length nothing on screen accounts for.
   */
  it('keeps exactly one option pressed as the scope narrows', async () => {
    const user = userEvent.setup()
    show()
    await enterQuiz(user)

    for (const topic of firstSet().groups.slice(0, 9)) {
      await user.click(topicToggle(topic.label, firstSet()))
      const options = within(
        screen.getByRole('group', { name: 'Questions' }),
      ).getAllByRole('button')
      const pressed = options.filter((b) => b.getAttribute('aria-pressed') === 'true')
      expect(pressed, `after turning off ${topic.label}`).toHaveLength(1)
    }
  }, 20000)
})
