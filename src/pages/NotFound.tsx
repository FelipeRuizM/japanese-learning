import { Link } from 'react-router-dom'
import { Label } from '../components/ui/primitives'
import { PATHS } from '../routes'

export function NotFound() {
  return (
    <section className="flex flex-col gap-4">
      <Label>Not found</Label>
      <h2 className="m-0 font-sans text-2xl font-semibold text-ink-0">
        There&rsquo;s nothing at this address.
      </h2>
      <p className="m-0">
        <Link
          to={PATHS.characters}
          className="text-accent underline underline-offset-4"
        >
          Back to the characters
        </Link>
      </p>
    </section>
  )
}
