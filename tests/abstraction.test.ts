import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * THE LEAK TEST (CLAUDE.md §3.2).
 *
 * The character-set abstraction is the whole reason katakana and kanji will not
 * need a rewrite, and the way it dies is quietly: someone reaches for the
 * hiragana module from a component because it is right there. This test is what
 * fails first when that starts. It has already caught one real leak — the
 * Characters page named the script in its placeholder copy.
 *
 * It lives in `tests/` rather than beside the code because it reads the file
 * system, and `tsconfig.app.json` deliberately withholds Node's types from
 * application code. This is a repo-level architectural check, not a unit test
 * of a module, and the location says so.
 *
 * `src/types/characters.ts` is allowed because `ScriptId` is a type-level fact
 * with nowhere else to live, and `src/characters/` is the data layer itself.
 * Everything else — components, pages, lib, data — must be script-agnostic.
 */
describe('the abstraction does not leak', () => {
  const SCRIPT_NAMES = ['hiragana', 'katakana', 'kanji']

  const ALLOWED = [join('src', 'characters'), join('src', 'types', 'characters.ts')]

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) return sourceFiles(full)
      return /\.(ts|tsx)$/.test(entry) ? [full] : []
    })
  }

  const root = join(process.cwd(), 'src')

  it('names a script only in the data layer and the type layer', () => {
    const offenders: string[] = []

    for (const file of sourceFiles(root)) {
      const rel = join('src', relative(root, file))
      if (ALLOWED.some((allowed) => rel === allowed || rel.startsWith(allowed + sep))) {
        continue
      }

      const source = readFileSync(file, 'utf8').toLowerCase()
      for (const name of SCRIPT_NAMES) {
        if (source.includes(name)) offenders.push(`${rel} mentions "${name}"`)
      }
    }

    expect(
      offenders,
      'A component, page or lib module named a script directly. Consume a ' +
        'CharacterSet from the registry instead — that is what lets katakana ' +
        'and kanji arrive as data (CLAUDE.md §3.2).',
    ).toEqual([])
  })

  it('actually scans files, rather than passing on an empty sweep', () => {
    // Guards the guard. A scan that silently found no files — a bad root, a
    // regex that stopped matching .tsx — would pass the test above forever
    // while enforcing nothing.
    const files = sourceFiles(root)
    expect(files.length).toBeGreaterThan(10)
    expect(files.some((f) => f.endsWith('.tsx'))).toBe(true)
    expect(files.some((f) => f.endsWith('.ts'))).toBe(true)
  })

  it('would catch a leak if one were introduced', () => {
    const pretendSource = "import { HIRAGANA } from '../characters/hiragana'"
    expect(SCRIPT_NAMES.some((n) => pretendSource.toLowerCase().includes(n))).toBe(true)
  })
})
