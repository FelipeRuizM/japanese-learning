import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { APP_VERSION } from './version'

describe('App shell', () => {
  it('renders the header, the version, and every primary route', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Japanese practice' }),
    ).toBeInTheDocument()
    expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    for (const label of ['Characters', 'Flashcards', 'Quiz']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(nav).toBeInTheDocument()
  })

  it('lands on the characters route', async () => {
    render(<App />)
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Choose what to study' }),
    ).toBeInTheDocument()
  })
})
