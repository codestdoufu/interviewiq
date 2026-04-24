import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { SCORE_THRESHOLDS, TIMER_DURATION_SECONDS } from '../constants';

const getScoreToneClass = (score) => {
  if (score >= SCORE_THRESHOLDS.HIGH_MIN) {
    return 'score-green';
  }

  if (score >= SCORE_THRESHOLDS.MID_MIN) {
    return 'score-amber';
  }

  return 'score-red';
};

const formatTime = (seconds) => {
  const minutesPart = Math.floor(seconds / 60);
  const secondsPart = seconds % 60;

  return `${minutesPart}:${String(secondsPart).padStart(2, '0')}`;
};

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

function InterviewScreen({
  questionNumber,
  totalQuestions,
  question,
  answer,
  feedback,
  history,
  isLoadingQuestion,
  isSubmitting,
  isGeneratingSummary,
  onAnswerChange,
  onSubmitAnswer,
  onNextQuestion,
  onSeeResults,
  errorMessage,
  onRetry,
}) {
  const [secondsLeft, setSecondsLeft] = useState(TIMER_DURATION_SECONDS);
  const [recentScoredQuestion, setRecentScoredQuestion] = useState(null);

  const progress = Math.round((questionNumber / totalQuestions) * 100);
  const isLastQuestion = questionNumber === totalQuestions;
  const canSubmit = answer.trim().length > 0 && !feedback && !isSubmitting && !isLoadingQuestion;

  const scoreByQuestion = useMemo(() => {
    const map = new Map();

    history.forEach((item) => {
      map.set(item.questionNumber, item.score);
    });

    return map;
  }, [history]);

  useEffect(() => {
    if (!question) {
      return;
    }

    setSecondsLeft(TIMER_DURATION_SECONDS);
  }, [question, questionNumber]);

  useEffect(() => {
    if (!question || isLoadingQuestion || feedback || secondsLeft <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [question, isLoadingQuestion, feedback, secondsLeft]);

  useEffect(() => {
    if (!history.length) {
      return undefined;
    }

    const latestQuestion = history[history.length - 1].questionNumber;
    setRecentScoredQuestion(latestQuestion);

    const timerId = window.setTimeout(() => {
      setRecentScoredQuestion(null);
    }, 900);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [history]);

  const handleAnswerKeyDown = (event) => {
    if (event.key === 'Enter' && event.ctrlKey && canSubmit) {
      event.preventDefault();
      onSubmitAnswer();
    }
  };

  return (
    <section className="interview-screen">
      <div className="interview-top-line" aria-hidden="true" />
      <div className="interview-top card">
        <div className="progress-meta">
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span>{progress}%</span>
        </div>

        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="history-pills" aria-label="Question history">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const itemNumber = index + 1;

            if (itemNumber < questionNumber) {
              const score = scoreByQuestion.get(itemNumber);
              const isRecentlyScored = recentScoredQuestion === itemNumber;
              return (
                <span
                  key={`history-${itemNumber}`}
                  className={`history-pill ${getScoreToneClass(score || 0)} ${
                    isRecentlyScored ? 'history-pill-newscore' : ''
                  }`}
                >
                  {score ? `Q${itemNumber} \u00B7 ${score}/10` : `Q${itemNumber}`}
                </span>
              );
            }

            if (itemNumber === questionNumber) {
              return (
                <span key={`history-${itemNumber}`} className="history-pill history-pill-current">
                  Q{itemNumber}
                </span>
              );
            }

            return (
              <span key={`history-${itemNumber}`} className="history-pill history-pill-future">
                Q{itemNumber}
              </span>
            );
          })}
        </div>
      </div>

      <div className="card question-card">
        <div className="question-row">
          <p className="question-eyebrow">Interview question</p>
          <span className={`question-timer ${secondsLeft === 0 ? 'question-timer-expired' : ''}`}>
            {formatTime(secondsLeft)}
          </span>
        </div>

        {isLoadingQuestion ? (
          <div className="question-thinking-overlay" aria-live="polite" aria-label="Thinking">
            <div className="question-thinking-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : (
          <div key={questionNumber} className="question-enter">
            <p className="question-text">{question}</p>
          </div>
        )}
      </div>

      <div className="card answer-card">
        <label className="field-label label-caps" htmlFor="answer-box">
          Your answer
        </label>
        <textarea
          id="answer-box"
          rows={4}
          className="text-input text-area"
          placeholder="Type your answer here..."
          value={answer}
          onChange={(event) => onAnswerChange(event.target.value)}
          onKeyDown={handleAnswerKeyDown}
          disabled={isLoadingQuestion || Boolean(feedback)}
        />

        <p className="shortcut-hint">Tip: Press Ctrl+Enter to submit</p>

        <button
          className="button-primary button-full"
          type="button"
          disabled={!canSubmit}
          onClick={onSubmitAnswer}
        >
          {isSubmitting ? 'Evaluating...' : 'Submit Answer'}
        </button>

        {isSubmitting ? <ThinkingState text="Thinking" /> : null}
      </div>

      {feedback ? (
        <div className="card feedback-card feedback-reveal">
          <div className="feedback-header-row">
            <h3>Feedback</h3>
            <span className={`score-badge ${getScoreToneClass(feedback.score)}`}>
              Score: {feedback.score}/10
            </span>
          </div>

          <div className="feedback-split">
            <div className="feedback-section strength-section">
              <h4>Strength</h4>
              <p>
                {feedback.strength ||
                  'Try giving a more detailed answer to receive strength feedback.'}
              </p>
            </div>

            <div className="feedback-section improve-section">
              <h4>Improve</h4>
              <p>{feedback.improve}</p>
            </div>
          </div>

          {isLastQuestion ? (
            <button
              className="button-primary button-full"
              type="button"
              disabled={isGeneratingSummary}
              onClick={onSeeResults}
            >
              {isGeneratingSummary ? 'Thinking...' : 'See Results'}
            </button>
          ) : (
            <button
              className="button-primary button-full"
              type="button"
              disabled={isLoadingQuestion}
              onClick={onNextQuestion}
            >
              {isLoadingQuestion ? 'Thinking...' : 'Next Question'}
            </button>
          )}

          {isGeneratingSummary ? <ThinkingState text="Thinking" /> : null}
        </div>
      ) : null}

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
    </section>
  );
}

InterviewScreen.propTypes = {
  questionNumber: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  feedback: PropTypes.shape({
    score: PropTypes.number.isRequired,
    strength: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    improve: PropTypes.string.isRequired,
  }),
  history: PropTypes.arrayOf(
    PropTypes.shape({
      questionNumber: PropTypes.number.isRequired,
      score: PropTypes.number.isRequired,
    })
  ).isRequired,
  isLoadingQuestion: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  isGeneratingSummary: PropTypes.bool.isRequired,
  onAnswerChange: PropTypes.func.isRequired,
  onSubmitAnswer: PropTypes.func.isRequired,
  onNextQuestion: PropTypes.func.isRequired,
  onSeeResults: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  onRetry: PropTypes.func,
};

InterviewScreen.defaultProps = {
  feedback: null,
  errorMessage: '',
  onRetry: null,
};

export default InterviewScreen;
