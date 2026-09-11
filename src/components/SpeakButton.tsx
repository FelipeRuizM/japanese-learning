import type { Speakable } from '../lib/pronunciation'
import type { PronunciationStatus } from '../lib/usePronunciation'

/**
 * Play the pronunciation of whatever it is handed.
 *
 * Audio is an enhancement and is never the only channel: wherever this appears,
 * the romaji is already on screen or is revealed by the same interaction
 * (CLAUDE.md §4.2). So when there is no Japanese voice the control is disabled
 * and says so, rather than being hidden — a missing button reads as "this app
 * has no audio", which is not what happened.
 */
export function SpeakButton({
  subject,
  status,
  onSpeak,
  className = '',
  label,
}: {
  subject: Speakable
  status: PronunciationStatus
  onSpeak: (subject: Speakable) => void
  className?: string
  /**
   * Overrides the accessible name.
   *
   * The default names the text being spoken, which is right everywhere that
   * text is already on screen — and wrong on the one screen where it is the
   * answer. Writing
   * practice requires the glyph to be absent from the DOM until the reveal, and
   * an `aria-label` is DOM: a screen reader announces it and a braille display
   * renders it. CLAUDE.md §1.
   */
  label?: string
}) {
  const unavailable = status === 'unavailable'

  return (
    <button
      type="button"
      disabled={unavailable || status === 'checking'}
      onClick={() => onSpeak(subject)}
      aria-label={
        unavailable
          ? `Pronunciation unavailable — no Japanese voice on this device`
          : (label ?? `Play the pronunciation of ${subject.ja}`)
      }
      className={[
        'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2',
        'rounded-md border border-rule px-3 font-sans text-base text-ink-1',
        'transition-colors hover:bg-accent-soft hover:text-ink-0',
        'disabled:cursor-not-allowed disabled:text-ink-3 disabled:hover:bg-transparent',
        className,
      ].join(' ')}
    >
      <SpeakerMark muted={unavailable} />
    </button>
  )
}

/**
 * The visible explanation, rendered ONCE per screen rather than beside every
 * control — forty-six copies of the same sentence is noise, not clarity.
 */
export function PronunciationNote({ status }: { status: PronunciationStatus }) {
  if (status !== 'unavailable') return null

  return (
    <p className="m-0 max-w-prose font-sans text-sm text-ink-2">
      No Japanese voice is installed on this device, so pronunciation can&rsquo;t play.
      Romaji still shows for every card.
    </p>
  )
}

/* Inline SVG. Emoji as iconography is banned (CLAUDE.md §7). */
function SpeakerMark({ muted }: { muted: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 7h2.5L10 4v10L6.5 11H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M12.5 6.5l3 5M15.5 6.5l-3 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M12.5 6.2a4 4 0 010 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
