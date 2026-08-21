import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SetPicker } from './SetPicker'
import { CHARACTER_SETS } from '../characters/registry'

const [first, second] = CHARACTER_SETS

describe('the set picker', () => {
  it('offers every registered set, with the active one pressed', () => {
    expect(first).toBeDefined()
    if (!first) return

    render(
      <SetPicker
        sets={CHARACTER_SETS}
        activeId={first.id}
        onChange={() => undefined}
        label="Chart"
      />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(CHARACTER_SETS.length)
    expect(buttons.map((b) => b.textContent)).toEqual(
      CHARACTER_SETS.map((set) => set.label),
    )

    // A toggle that stays on, so `aria-pressed` — the same thing a selected
    // grid cell says, said the same way.
    expect(screen.getByRole('button', { name: first.label })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: second?.label ?? '' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reports the id of the set that was pressed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    expect(first && second).toBeTruthy()
    if (!first || !second) return

    render(
      <SetPicker
        sets={CHARACTER_SETS}
        activeId={first.id}
        onChange={onChange}
        label="Chart"
      />,
    )

    await user.click(screen.getByRole('button', { name: second.label }))
    expect(onChange).toHaveBeenCalledWith(second.id)
  })

  it('is named as a group, so the buttons are not two loose toggles', () => {
    if (!first) return
    render(
      <SetPicker
        sets={CHARACTER_SETS}
        activeId={first.id}
        onChange={() => undefined}
        label="Chart"
      />,
    )
    expect(screen.getByRole('group', { name: 'Chart' })).toBeInTheDocument()
  })

  /**
   * A picker offering one choice is furniture. Keeping that decision inside the
   * component means no caller has to count the registry — which is exactly the
   * check that would go stale when a third set arrives.
   */
  it('renders nothing at all when there is only one set', () => {
    if (!first) return
    const { container } = render(
      <SetPicker
        sets={[first]}
        activeId={first.id}
        onChange={() => undefined}
        label="Chart"
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
