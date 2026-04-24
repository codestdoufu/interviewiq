import PropTypes from 'prop-types';
import {
  COMPANY_PLACEHOLDER,
  INPUT_CHARACTER_LIMIT,
  INTERVIEW_TYPE_OPTIONS,
  JOB_TITLE_PLACEHOLDER,
} from '../constants';

const PARTICLE_COUNT = 20;

const particleStyle = (index) => ({
  '--start-x': `${(index * 17) % 100}%`,
  '--start-y': `${(index * 29) % 100}%`,
  '--delay': `${(index % 7) * 0.45}s`,
  '--duration': `${7 + (index % 5)}s`,
});

function SetupScreen({
  jobTitle,
  company,
  interviewType,
  onJobTitleChange,
  onCompanyChange,
  onInterviewTypeChange,
  onStartInterview,
  isLoading,
  errorMessage,
  onRetry,
}) {
  const canStart = jobTitle.trim() && company.trim();

  return (
    <section className="setup-screen">
      <div className="setup-particles" aria-hidden="true">
        {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
          <span key={`particle-${index + 1}`} className="setup-particle" style={particleStyle(index)} />
        ))}
      </div>
      <div className="gradient-blob" aria-hidden="true" />

      <div className="card setup-card setup-glow-card">
        <div className="setup-header">
          <h1>InterviewIQ</h1>
          <p>AI-powered mock interviews tailored to your dream job</p>
        </div>

        <div className="form-grid">
          <label className="field-label label-caps" htmlFor="job-title">
            Job title
          </label>
          <input
            id="job-title"
            className="text-input"
            type="text"
            placeholder={JOB_TITLE_PLACEHOLDER}
            value={jobTitle}
            maxLength={INPUT_CHARACTER_LIMIT}
            onChange={(event) => onJobTitleChange(event.target.value)}
          />
          <p className="char-counter">
            {jobTitle.length} / {INPUT_CHARACTER_LIMIT}
          </p>

          <label className="field-label label-caps" htmlFor="company-name">
            Company name
          </label>
          <input
            id="company-name"
            className="text-input"
            type="text"
            placeholder={COMPANY_PLACEHOLDER}
            value={company}
            maxLength={INPUT_CHARACTER_LIMIT}
            onChange={(event) => onCompanyChange(event.target.value)}
          />
          <p className="char-counter">
            {company.length} / {INPUT_CHARACTER_LIMIT}
          </p>

          <span className="field-label label-caps">Interview type</span>
          <div className="type-card-grid" role="radiogroup" aria-label="Interview type">
            {INTERVIEW_TYPE_OPTIONS.map((option) => {
              const isSelected = option.value === interviewType;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`type-card ${isSelected ? 'type-card-selected' : ''}`}
                  onClick={() => onInterviewTypeChange(option.value)}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <span className="type-card-icon" aria-hidden="true">
                    {option.icon}
                  </span>
                  <span className="type-card-label">{option.label}</span>
                </button>
              );
            })}
          </div>

          <button
            className="button-primary button-full"
            type="button"
            disabled={!canStart || isLoading}
            onClick={onStartInterview}
          >
            {isLoading ? 'Starting...' : 'Start Interview'}
          </button>
        </div>

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

SetupScreen.propTypes = {
  jobTitle: PropTypes.string.isRequired,
  company: PropTypes.string.isRequired,
  interviewType: PropTypes.string.isRequired,
  onJobTitleChange: PropTypes.func.isRequired,
  onCompanyChange: PropTypes.func.isRequired,
  onInterviewTypeChange: PropTypes.func.isRequired,
  onStartInterview: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  errorMessage: PropTypes.string,
  onRetry: PropTypes.func,
};

SetupScreen.defaultProps = {
  errorMessage: '',
  onRetry: null,
};

export default SetupScreen;
