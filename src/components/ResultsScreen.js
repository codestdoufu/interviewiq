import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const CONFETTI_COUNT = 24;

const getRingColor = (score) => {
  if (score >= 7) {
    return '#10b981';
  }

  if (score >= 4) {
    return '#f59e0b';
  }

  return '#ef4444';
};

const getConfettiStyle = (index) => ({
  '--x': `${(index * 13) % 100}%`,
  '--delay': `${(index % 8) * 0.06}s`,
  '--duration': `${1.3 + (index % 4) * 0.18}s`,
  '--rotation': `${(index * 37) % 360}deg`,
});

function ThinkingState({ text }) {
  return (
    <div className="thinking-state" aria-live="polite">
      <span>{text}</span>
      <div className="thinking-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

ThinkingState.propTypes = {
  text: PropTypes.string,
};

ThinkingState.defaultProps = {
  text: 'Thinking',
};

function ResultsScreen({
  overallScore,
  summary,
  jobTitle,
  company,
  onStartNewInterview,
  errorMessage,
  onRetry,
}) {
  const [showToast, setShowToast] = useState(false);
  const percentage = Math.max(0, Math.min(100, Math.round((overallScore / 10) * 100)));
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const ringColor = useMemo(() => getRingColor(overallScore), [overallScore]);
  const showConfetti = overallScore >= 7;

  useEffect(() => {
    if (!showToast) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setShowToast(false);
    }, 1800);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [showToast]);

  const handleShareScore = async () => {
    const formattedScore = overallScore.toFixed(1);
    const tweetText = `I just scored ${formattedScore}/10 on my mock ${jobTitle} interview at ${company} using InterviewIQ! \uD83C\uDFAF #InterviewIQ #CareerPrep`;

    try {
      await navigator.clipboard.writeText(tweetText);
      setShowToast(true);
    } catch (error) {
      console.error('Failed to copy score share text:', error);
    }
  };

  return (
    <section className="results-screen">
      <div className="card results-card">
        {showConfetti ? (
          <div className="confetti-wrap" aria-hidden="true">
            {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
              <span key={`confetti-${index + 1}`} className="confetti-piece" style={getConfettiStyle(index)} />
            ))}
          </div>
        ) : null}

        <h2>Your Interview Report</h2>

        <div className="results-top">
          <div className="score-ring-wrap">
            <svg className="score-ring-svg" viewBox="0 0 160 160" aria-hidden="true">
              <circle className="score-ring-track" cx="80" cy="80" r={radius} />
              <circle
                className="score-ring-progress"
                cx="80"
                cy="80"
                r={radius}
                style={{
                  '--ring-circ': circumference,
                  '--ring-offset': dashOffset,
                  '--ring-color': ringColor,
                }}
              />
            </svg>

            <div className="score-ring-inner">
              <span className="score-large">{overallScore.toFixed(1)}</span>
              <span className="score-sub">out of 10</span>
            </div>
          </div>
        </div>

        {summary ? (
          <>
            <div className="results-columns">
              <div>
                <h3>Your strengths</h3>
                <ul className="strengths-list">
                  {summary.strengths.map((item, index) => (
                    <li key={`strength-${index + 1}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3>Focus areas</h3>
                <ul className="focus-list">
                  {summary.improvements.map((item, index) => (
                    <li key={`improve-${index + 1}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="closing-line">{summary.closing}</p>
          </>
        ) : (
          <ThinkingState text="Thinking" />
        )}

        <div className="results-actions">
          <button className="button-outline button-full" type="button" onClick={onStartNewInterview}>
            Start New Interview
          </button>
          <button className="button-ghost button-full" type="button" onClick={handleShareScore}>
            Share your score
          </button>
        </div>

        {showToast ? <p className="toast-copy">Copied to clipboard!</p> : null}

        {errorMessage ? (
          <div className="error-card" role="alert">
            <p>{errorMessage}</p>
            {onRetry ? (
              <button className="button-ghost" type="button" onClick={onRetry}>
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

ResultsScreen.propTypes = {
  overallScore: PropTypes.number.isRequired,
  summary: PropTypes.shape({
    strengths: PropTypes.arrayOf(PropTypes.string).isRequired,
    improvements: PropTypes.arrayOf(PropTypes.string).isRequired,
    closing: PropTypes.string.isRequired,
  }),
  jobTitle: PropTypes.string.isRequired,
  company: PropTypes.string.isRequired,
  onStartNewInterview: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  onRetry: PropTypes.func,
};

ResultsScreen.defaultProps = {
  summary: null,
  errorMessage: '',
  onRetry: null,
};

export default ResultsScreen;
