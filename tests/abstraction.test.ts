import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * THE LEAK TEST (CLAUDE.md §3.2).
 *
 * The character-set abstraction is the whole reason katakana and kanji will not
 * need a rewrite, and the way it dies is quietly: someone reaches for a script's
 * data module from a component because it is right there. This test is what
 * fails first when that starts. It has already caught a real leak — the
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
 *
 * COMMENTS ARE STRIPPED BEFORE SCANNING. The rule is about code depending on a
 * script, not about prose. "Kanji has no vowel columns, which is why this branch
 * exists" is exactly the comment the flow layout should carry, and a scan that
 * banned it would push the explanation out of the codebase — which costs more
 * than it protects.
 *
 * String literals and JSX text are NOT stripped: user-visible copy naming a
 * script is a real leak, and that is precisely what this test caught first.
 */
describe('the abstraction does not leak', () => {
  const SCRIPT_NAMES = ['hiragana', 'katakana', 'kanji']

  const ALLOWED = [join('src', 'characters'), join('src', 'types', 'characters.ts')]

  /**
   * Crude but adequate. It would mis-handle a comment marker inside a string
   * literal; this codebase has none, and a false negative in an architectural
   * guard is cheaper than pushing every explanatory comment out of the source.
   */
  function withoutComments(source: string): string {
    // `.` excludes newlines, so the line-comment pattern stops at end of line.
    return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*/g, ' ')
  }

  function mentionsAScript(source: string): boolean {
    const scanned = withoutComments(source).toLowerCase()
    return SCRIPT_NAMES.some((name) => scanned.includes(name))
  }

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

      const scanned = withoutComments(readFileSync(file, 'utf8')).toLowerCase()
      for (const name of SCRIPT_NAMES) {
        if (scanned.includes(name)) offenders.push(`${rel} mentions "${name}"`)
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

  it('would catch a real leak: an import of a script data module', () => {
    expect(mentionsAScript(`import { HIRAGANA } from '../characters/hiragana'`)).toBe(
      true,
    )
  })

  it('would catch a real leak: user-visible copy naming a script', () => {
    expect(mentionsAScript('<p>Every hiragana character, organised by row.</p>')).toBe(
      true,
    )
  })

  it('does not fire on a comment that merely explains the abstraction', () => {
    const prose = [
      '/** Kanji has no vowel columns, so the flow branch exists. */',
      '// hiragana is the only registered set today',
    ].join('\n')
    expect(mentionsAScript(prose)).toBe(false)
  })
})
