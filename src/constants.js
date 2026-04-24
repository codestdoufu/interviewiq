export const APP_SCREENS = {
  LANDING: 'landing',
  SETUP: 'setup',
  INTERVIEW: 'interview',
  RESULTS: 'results',
};

export const QUESTION_COUNT = 5;
export const TIMER_DURATION_SECONDS = 180;

export const JOB_TITLE_PLACEHOLDER = 'Software Engineer Intern';
export const COMPANY_PLACEHOLDER = 'Google';
export const INPUT_CHARACTER_LIMIT = 50;

export const INTERVIEW_TYPES = {
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  MIXED: 'Mixed',
};

export const INTERVIEW_TYPE_OPTIONS = [
  {
    value: INTERVIEW_TYPES.TECHNICAL,
    label: 'Technical',
    icon: '\u25B8',
  },
  {
    value: INTERVIEW_TYPES.BEHAVIORAL,
    label: 'Behavioral',
    icon: '\u25C9',
  },
  {
    value: INTERVIEW_TYPES.MIXED,
    label: 'Mixed',
    icon: '\u25C6',
  },
];

export const SCORE_THRESHOLDS = {
  HIGH_MIN: 8,
  MID_MIN: 5,
};

export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_MODEL = 'gpt-4o-mini';
export const OPENAI_PARSE_RETRY_ATTEMPTS = 2;

export const SUMMARY_ITEM_COUNT = 3;
