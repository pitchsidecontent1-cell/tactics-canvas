import { ArrowLeft, GraduationCap, Play } from 'lucide-react';
import { useLocation } from 'wouter';

import { HOW_TO_PLAY } from './how-to-play-content';

/**
 * The controls, in one place.
 *
 * Deliberately a reference rather than a lesson: somebody who has played a
 * match and wants to know what right-drag does should be able to find it in
 * about four seconds. The lesson is the tutorial, and there is a door to it at
 * the top of this page for anyone who would rather be shown.
 */
export default function HowToPlay() {
  const [, navigate] = useLocation();

  return (
    <main className="howto-shell">
      <header className="howto-topbar">
        <button
          className="match-back"
          data-testid="button-howto-back"
          onClick={() => navigate('/match')}
          type="button"
        >
          <ArrowLeft size={15} />
          Back to the match
        </button>
      </header>

      <div className="howto-body">
        <div className="howto-intro">
          <p className="howto-eyebrow">Match mode</p>
          <h1>How to play</h1>
          <p className="howto-lede">
            You are the manager, not a player. You decide what your side tries; the pitch decides
            whether it comes off. Everything you can do is on this page.
          </p>
          <div className="howto-actions">
            <button
              className="howto-primary"
              data-testid="button-howto-tutorial"
              onClick={() => navigate('/learn')}
              type="button"
            >
              <GraduationCap size={16} />
              Take me through it
            </button>
            <button
              className="howto-secondary"
              data-testid="button-howto-play"
              onClick={() => navigate('/match')}
              type="button"
            >
              <Play size={15} />
              Just let me play
            </button>
          </div>
        </div>

        <nav className="howto-contents" aria-label="Contents">
          {HOW_TO_PLAY.map((section) => (
            <a className="howto-jump" href={`#${section.id}`} key={section.id}>
              {section.title}
            </a>
          ))}
        </nav>

        {HOW_TO_PLAY.map((section) => (
          <section className="howto-section" id={section.id} key={section.id}>
            <h2>{section.title}</h2>
            <p className="howto-blurb">{section.blurb}</p>

            {section.controls && (
              <dl className="howto-controls">
                {section.controls.map((control) => (
                  <div className="howto-control" key={control.action}>
                    <dt>{control.action}</dt>
                    <dd>
                      {control.result}
                      {control.note && <span className="howto-note">{control.note}</span>}
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
          </section>
        ))}

        <footer className="howto-footer">
          <button
            className="howto-primary"
            data-testid="button-howto-tutorial-foot"
            onClick={() => navigate('/learn')}
            type="button"
          >
            <GraduationCap size={16} />
            Take me through it
          </button>
        </footer>
      </div>
    </main>
  );
}
