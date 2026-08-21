import type { RefObject } from 'react';
import { ArrowLeft, BookOpen, ExternalLink, Play } from 'lucide-react';
import { useLocation } from 'wouter';

import { HOW_TO_PLAY } from './how-to-play-content';

/**
 * The controls reference, in two places and written once.
 *
 * It is a reference rather than a lesson: somebody who has played a match and
 * wants to know what right-drag does should find it in about four seconds. So
 * it lives where they are — in the match panel beside the pitch — and it is
 * also a page of its own for reading properly, away from a game in progress.
 *
 * Both are the same collapsible sections from the same content module, so the
 * two can never drift apart.
 */
function HowToPlaySections() {
  return (
    <>
      {HOW_TO_PLAY.map((section) => (
        <details className="howto-part" id={section.id} key={section.id}>
          <summary>
            <span className="howto-part-title">{section.title}</span>
            <span className="summary-hint">tap to show</span>
          </summary>
          <p className="howto-blurb">{section.blurb}</p>

          {section.controls && (
            <dl className="howto-controls">
              {section.controls.map((control) => (
                <div className="howto-control" key={control.action}>
                  <dt>{control.action}</dt>
                  <dd>
                    {control.result}
                    {control.note && (
                      <span className="howto-note">{control.note}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {section.points && (
            <ul className="howto-points">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}
        </details>
      ))}
    </>
  );
}

const LEDE =
  'You are the manager, not a player. You decide what your side tries; the pitch decides whether it comes off.';

/**
 * The reference inside the match panel. Everything closed until asked for:
 * eleven sections sitting open underneath the moves would bury the game they
 * are meant to explain.
 */
export function HowToPlayPanel({
  open,
  onToggle,
  panelRef,
}: {
  open: boolean;
  onToggle: (open: boolean) => void;
  /** So the topbar button can bring it into view once it has opened it. */
  panelRef?: RefObject<HTMLDetailsElement | null>;
}) {
  const [, navigate] = useLocation();

  return (
    <details
      className="howto-panel"
      data-testid="how-to-play"
      open={open}
      onToggle={(event) => onToggle(event.currentTarget.open)}
      ref={panelRef}
    >
      <summary className="howto-panel-head">
        <BookOpen size={14} aria-hidden="true" />
        <span>How to play</span>
        <span className="summary-hint">tap to show</span>
      </summary>

      <p className="howto-lede">{LEDE}</p>
      <button
        className="howto-open-page"
        data-testid="button-howto-page"
        onClick={() => navigate('/how-to-play')}
        type="button"
      >
        Read it as a page
        <ExternalLink size={12} />
      </button>

      <HowToPlaySections />
    </details>
  );
}

/** The same reference with room to read it, away from a match in progress. */
export default function HowToPlay() {
  const [, navigate] = useLocation();

  return (
    <main className="howto-shell">
      <header className="howto-topbar">
        {/* The rules are the way in, so they are the way back. */}
        <button
          className="match-back"
          data-testid="button-howto-back"
          onClick={() => navigate('/rules')}
          type="button"
        >
          <ArrowLeft size={15} />
          The rules
        </button>
        <button
          className="match-back"
          data-testid="button-howto-play"
          onClick={() => navigate('/match')}
          type="button"
        >
          <Play size={15} />
          Play
        </button>
      </header>

      <div className="howto-body">
        <p className="howto-eyebrow">Match mode</p>
        <h1>How to play</h1>
        <p className="howto-lede">{LEDE}</p>
        <HowToPlaySections />
      </div>
    </main>
  );
}
