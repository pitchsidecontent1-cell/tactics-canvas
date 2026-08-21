import { ArrowLeft, BookOpen, GraduationCap, Play } from 'lucide-react';
import { useLocation } from 'wouter';

import { RULES } from './rules-content';

/**
 * The rules, and the door into the game.
 *
 * This is what Play a match lands on: nobody should be dropped into a match
 * having been told nothing. It reads top to bottom in under a minute — laid
 * open rather than behind taps, because a page that hides the rules is not
 * showing you the rules — and the two ways in sit at the top and the bottom,
 * so you can leave at either end.
 *
 * The controls live on How to play. These are the laws.
 */
export default function Rules() {
  const [, navigate] = useLocation();

  const doors = (place: string) => (
    <div className="rules-doors">
      <button
        className="rules-primary"
        data-testid={`button-rules-learn-${place}`}
        onClick={() => navigate('/learn')}
        type="button"
      >
        <GraduationCap size={16} />
        Take me through it
      </button>
      <button
        className="rules-secondary"
        data-testid={`button-rules-play-${place}`}
        onClick={() => navigate('/match')}
        type="button"
      >
        <Play size={15} />
        Just let me play
      </button>
    </div>
  );

  return (
    <main className="howto-shell">
      <header className="howto-topbar">
        <button
          className="match-back"
          data-testid="button-rules-back"
          onClick={() => navigate('/')}
          type="button"
        >
          <ArrowLeft size={15} />
          Back to the board
        </button>
        <button
          className="match-back"
          data-testid="button-rules-howto"
          onClick={() => navigate('/how-to-play')}
          type="button"
        >
          <BookOpen size={15} />
          How to play
        </button>
      </header>

      <div className="howto-body">
        <p className="howto-eyebrow">Match mode</p>
        <h1>The rules</h1>
        <p className="howto-lede">
          A tactics board you can lose on. Sixty seconds of football, both
          sides picked by you, and every decision priced before you make it —
          here is what governs it.
        </p>
        {doors('top')}

        <ol className="rules-list">
          {RULES.map((section, index) => (
            <li className="rules-section" id={section.id} key={section.id}>
              <span aria-hidden="true" className="rules-number">
                {index + 1}
              </span>
              <h2>{section.title}</h2>
              <p className="rules-blurb">{section.blurb}</p>
              <ul className="howto-points">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <footer className="rules-footer">
          <p className="rules-blurb">
            That is everything that governs a match. What every control does is
            on{' '}
            <button
              className="howto-open-page"
              data-testid="button-rules-howto-foot"
              onClick={() => navigate('/how-to-play')}
              type="button"
            >
              How to play
            </button>
            .
          </p>
          {doors('foot')}
        </footer>
      </div>
    </main>
  );
}
