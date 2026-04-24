import {
  INTERVIEW_TYPES,
  OPENAI_API_URL,
  OPENAI_MODEL,
  OPENAI_PARSE_RETRY_ATTEMPTS,
  QUESTION_COUNT,
  SUMMARY_ITEM_COUNT,
} from '../constants';

const COMPANY_PERSONALITY_MAP = {
  google: 'focus on scalability, systems thinking, and data structures',
  meta: 'focus on product sense, growth metrics, and social impact',
  amazon: 'focus on leadership principles, customer obsession, and ownership',
  microsoft: 'focus on growth mindset, collaboration, and technical depth',
};

const DEFAULT_COMPANY_PERSONALITY = 'focus on problem solving and cultural fit';

class JsonParseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'JsonParseError';
    this.originalError = originalError;
  }
}

const ensureApiKey = () => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing REACT_APP_OPENAI_API_KEY. Add it to your environment and restart the app.'
    );
  }

  return apiKey;
};

const countWords = (text) => {
  return `${text || ''}`.trim().split(/\s+/).filter(Boolean).length;
};

const parseApiJson = async (response) => {
  try {
    return await response.json();
  } catch (error) {
    throw new JsonParseError('Failed to parse OpenAI API response JSON.', error);
  }
};

const callOpenAI = async (messages, options = {}) => {
  const apiKey = ensureApiKey();
  let lastError = null;

  for (let attempt = 1; attempt <= OPENAI_PARSE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          temperature: options.temperature ?? 0.7,
          ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
        }),
      });

      const data = await parseApiJson(response);

      if (!response.ok) {
        const detail = data.error?.message || '';
        throw new Error(detail || `OpenAI request failed (${response.status})`);
      }

      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('OpenAI returned an empty response.');
      }

      return content;
    } catch (error) {
      lastError = error;
      const shouldRetry =
        error instanceof JsonParseError && attempt < OPENAI_PARSE_RETRY_ATTEMPTS;

      if (!shouldRetry) {
        console.error('OpenAI API call failed:', error);
        throw error;
      }
    }
  }

  console.error('OpenAI API call failed:', lastError);
  throw lastError;
};

const runWithParseRetry = async (task, label) => {
  let lastError = null;

  for (let attempt = 1; attempt <= OPENAI_PARSE_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const shouldRetry =
        error instanceof JsonParseError && attempt < OPENAI_PARSE_RETRY_ATTEMPTS;

      if (!shouldRetry) {
        console.error(`${label} failed:`, error);
        throw error;
      }
    }
  }

  console.error(`${label} failed:`, lastError);
  throw lastError;
};

const parseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new JsonParseError('Failed to parse JSON from model output.', error);
  }
};

const extractJson = (raw) => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1].trim() : raw.trim();

  try {
    return parseJson(candidate);
  } catch (error) {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);

    if (!objectMatch) {
      throw new JsonParseError('Model did not return valid JSON.', error);
    }

    try {
      return parseJson(objectMatch[0]);
    } catch (secondError) {
      throw new JsonParseError('Model did not return valid JSON.', secondError);
    }
  }
};

const normalizeScore = (score) => {
  const numeric = Number(score);

  if (Number.isNaN(numeric)) {
    return 5;
  }

  return Math.max(1, Math.min(10, Math.round(numeric)));
};

const getCompanyPersonality = (company) => {
  const normalized = `${company || ''}`.toLowerCase().trim();

  if (COMPANY_PERSONALITY_MAP[normalized]) {
    return COMPANY_PERSONALITY_MAP[normalized];
  }

  const partialMatch = Object.entries(COMPANY_PERSONALITY_MAP).find(([name]) =>
    normalized.includes(name)
  );

  return partialMatch ? partialMatch[1] : DEFAULT_COMPANY_PERSONALITY;
};

const getQuestionTypeInstruction = (interviewType, questionNumber) => {
  if (interviewType === INTERVIEW_TYPES.BEHAVIORAL) {
    return 'Ask a behavioral question that naturally prompts a STAR-format response (Situation, Task, Action, Result).';
  }

  if (interviewType === INTERVIEW_TYPES.TECHNICAL) {
    return 'Ask a technical coding, debugging, architecture, or systems-design style question appropriate for the role level.';
  }

  const isBehavioralTurn = questionNumber % 2 === 0;
  return isBehavioralTurn
    ? 'This is a mixed interview. For this turn, ask a behavioral question that encourages a STAR-format answer.'
    : 'This is a mixed interview. For this turn, ask a technical coding or systems-thinking question.';
};

const getEvaluationInstruction = (interviewType) => {
  if (interviewType === INTERVIEW_TYPES.BEHAVIORAL) {
    return 'Apply STAR criteria while scoring: Situation clarity, Task ownership, Action quality, and measurable Result.';
  }

  if (interviewType === INTERVIEW_TYPES.TECHNICAL) {
    return 'Prioritize technical correctness, reasoning quality, tradeoff awareness, and clarity.';
  }

  return 'Use both technical and behavioral expectations based on the question type.';
};

const cleanListItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => `${item || ''}`.trim())
    .filter(
      (item) =>
        item &&
        !/placeholder/i.test(item) &&
        !/demonstrates interview readiness point/i.test(item)
    )
    .slice(0, SUMMARY_ITEM_COUNT);
};

const buildStrengthFallbacks = (questionsAndAnswers) => {
  const derived = questionsAndAnswers.slice(0, SUMMARY_ITEM_COUNT).map((entry, index) => {
    const questionLabel = entry.questionNumber || index + 1;
    const hasNumbers = /\d|%/.test(entry.answer || '');

    if (hasNumbers) {
      return `In Question ${questionLabel}, you used concrete details and metrics that made your answer more credible.`;
    }

    return `In Question ${questionLabel}, you addressed the prompt directly, but evidence was limited.`;
  });

  const safeDefaults = [
    'You completed each question and maintained an attempt to communicate clearly.',
    'You showed basic alignment with the role prompts even when details were limited.',
    'You stayed engaged across the interview and responded to each prompt.',
  ];

  return [...derived, ...safeDefaults].slice(0, SUMMARY_ITEM_COUNT);
};

const buildImprovementFallbacks = (questionsAndAnswers) => {
  const derived = questionsAndAnswers.slice(0, SUMMARY_ITEM_COUNT).map((entry, index) => {
    const questionLabel = entry.questionNumber || index + 1;
    const answerLength = (entry.answer || '').trim().length;

    if (answerLength < 120) {
      return `For Question ${questionLabel}, expand to at least 2-3 sentences with concrete details and outcomes.`;
    }

    return `For Question ${questionLabel}, tighten structure and surface your strongest impact earlier.`;
  });

  const safeDefaults = [
    'Use a clear framework before each answer so your key points are easy to follow.',
    'Add measurable outcomes, user impact, or technical results to support your claims.',
    'Close answers with what you learned and how it applies to the role.',
  ];

  return [...derived, ...safeDefaults].slice(0, SUMMARY_ITEM_COUNT);
};

const ensureLength = (primaryItems, fallbackItems) => {
  const merged = [...primaryItems];

  for (const fallback of fallbackItems) {
    if (merged.length >= SUMMARY_ITEM_COUNT) {
      break;
    }

    merged.push(fallback);
  }

  return merged.slice(0, SUMMARY_ITEM_COUNT);
};

export const generateQuestion = async (
  jobTitle,
  company,
  interviewType,
  questionNumber,
  previousQuestions
) => {
  const previousQuestionText = previousQuestions.length
    ? previousQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')
    : 'None yet.';

  const companyPersonality = getCompanyPersonality(company);
  const questionTypeInstruction = getQuestionTypeInstruction(interviewType, questionNumber);

  try {
    const content = await callOpenAI(
      [
        {
          role: 'system',
          content: `You are an experienced recruiter at ${company} interviewing a candidate for a ${jobTitle} position. Company priorities: ${companyPersonality}. Ask realistic, specific interview questions, vary the difficulty, and never repeat questions. ${questionTypeInstruction}`,
        },
        {
          role: 'user',
          content: `Interview type: ${interviewType}\nQuestion number: ${questionNumber} of ${QUESTION_COUNT}\nPrevious questions:\n${previousQuestionText}\n\nReturn only the next interview question text.`,
        },
      ],
      { temperature: 0.8 }
    );

    return content.replace(/^[-\d.)\s]+/, '').trim();
  } catch (error) {
    console.error('generateQuestion failed:', error);
    throw error;
  }
};

export const evaluateAnswer = async (
  question,
  answer,
  jobTitle,
  company,
  interviewType
) => {
  const wordCount = countWords(answer);

  if (wordCount < 15) {
    return {
      score: 1,
      strength: null,
      improve:
        'Your answer was too short to evaluate. Please provide a detailed response of at least 2-3 sentences.',
    };
  }

  const evaluationInstruction = getEvaluationInstruction(interviewType);

  return runWithParseRetry(async () => {
    try {
      const content = await callOpenAI(
        [
          {
            role: 'system',
            content:
              'You are a tough but fair interviewer. Score answers honestly and strictly. A vague, one-sentence, or off-topic answer must score 1-3. Only award 8+ if the answer includes specific details, examples, and genuine technical or behavioral depth. Never invent strengths that are not clearly present in the answer. If the answer is nonsensical or a single word, score it 1.',
          },
          {
            role: 'user',
            content: `Question: ${question}\nAnswer: ${answer}\nJob: ${jobTitle} at ${company}\nInterview type: ${interviewType}\nEvaluation lens: ${evaluationInstruction}\n\nReturn JSON only in this exact format: {"score": 7, "strength": "...", "improve": "..."}`,
          },
        ],
        {
          temperature: 0.3,
          responseFormat: { type: 'json_object' },
        }
      );

      const parsed = extractJson(content);

      return {
        score: normalizeScore(parsed.score),
        strength: `${parsed.strength || ''}`.trim() || null,
        improve:
          `${parsed.improve || ''}`.trim() ||
          'Add specific examples and measurable impact to make your answer stronger.',
      };
    } catch (error) {
      console.error('evaluateAnswer failed:', error);
      throw error;
    }
  }, 'evaluateAnswer');
};

export const generateSummary = async (jobTitle, company, questionsAndAnswers) => {
  const interviewTranscript = questionsAndAnswers
    .map(
      (entry, index) =>
        `${index + 1}. Question: ${entry.question}\nAnswer: ${entry.answer}\nScore: ${entry.score}/10`
    )
    .join('\n\n');

  return runWithParseRetry(async () => {
    try {
      const content = await callOpenAI(
        [
          {
            role: 'system',
            content:
              "You are an honest interview coach writing a post-interview report. Base every strength and focus area strictly on what the candidate actually said. Do not invent positive qualities. If most answers were short or vague, the strengths should reflect limited evidence and the focus areas should be direct and constructive. Never use placeholder text like 'readiness point 3'.",
          },
          {
            role: 'user',
            content: `Role: ${jobTitle} at ${company}\n\nInterview transcript:\n${interviewTranscript}\n\nReturn JSON only in this format: {"strengths": ["...", "...", "..."], "improvements": ["...", "...", "..."], "closing": "..."}`,
          },
        ],
        {
          temperature: 0.4,
          responseFormat: { type: 'json_object' },
        }
      );

      const parsed = extractJson(content);
      const strengths = ensureLength(
        cleanListItems(parsed.strengths),
        buildStrengthFallbacks(questionsAndAnswers)
      );
      const improvements = ensureLength(
        cleanListItems(parsed.improvements),
        buildImprovementFallbacks(questionsAndAnswers)
      );

      return {
        strengths,
        improvements,
        closing:
          `${parsed.closing || ''}`.trim() ||
          'Keep practicing with deeper examples and your interview clarity will improve quickly.',
      };
    } catch (error) {
      console.error('generateSummary failed:', error);
      throw error;
    }
  }, 'generateSummary');
};
