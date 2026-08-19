import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button, Chip, Glyph, Label } from './primitives'

describe('Button', () => {
  it('is a real button and clears the 44px hit target', () => {
    render(<Button>Start</Button>)
    const button = screen.getByRole('button', { name: 'Start' })
    // min-h-11 is 2.75rem = 44px. Asserted through the class rather than
    // computed height because jsdom does not lay out.
    expect(button).toHaveClass('min-h-11')
  })

  it('disables without removing it from the accessibility tree', () => {
    render(<Button disabled>Start</Button>)
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()
  })
})

describe('Glyph', () => {
  /**
   * `lang="ja"` is load-bearing, not decoration: it is what makes a screen
   * reader (and speechSynthesis in Phase 4) treat か as Japanese rather than
   * spelling it out as Latin. Regressing it is silent, hence the test.
   */
  it('marks kana as Japanese', () => {
    render(<Glyph>か</Glyph>)
    const glyph = screen.getByText('か')
    expect(glyph).toHaveAttribute('lang', 'ja')
    expect(glyph).toHaveClass('font-jp')
  })
})

describe('Label and Chip', () => {
  it('render their content', () => {
    render(
      <>
        <Label>Characters</Label>
        <Chip>15 selected</Chip>
      </>,
    )
    expect(screen.getByText('Characters')).toBeInTheDocument()
    expect(screen.getByText('15 selected')).toBeInTheDocument()
  })
})
