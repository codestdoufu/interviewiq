import { useMemo, useState } from 'react';
import LandingPage from './components/LandingPage';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import ResultsScreen from './components/ResultsScreen';
import { APP_SCREENS, INTERVIEW_TYPES, QUESTION_COUNT } from './constants';
import {
  evaluateAnswer,
  generateQuestion,
  generateSummary,
} from './services/openai';
import './App.css';

const createInitialInterviewState = () => ({
  currentQuestionNumber: 1,
  currentQuestion: '',
  currentAnswer: '',
  currentFeedback: null,
  history: [],
  summary: null,
  isSubmittingAnswer: false,
  isGeneratingQuestion: false,
  isGeneratingSummary: false,
});

function App() {
  const [screen, setScreen] = useState(APP_SCREENS.LANDING);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [interviewType, setInterviewType] = useState(INTERVIEW_TYPES.TECHNICAL);
  const [activeInterview, setActiveInterview] = useState(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [interview, setInterview] = useState(createInitialInterviewState);
  const [errorMessage, setErrorMessage] = useState('');
  const [retryAction, setRetryAction] = useState(null);

  const clearError = () => {
    setErrorMessage('');
    setRetryAction(null);
  };

  const goToSetup = () => {
    clearError();
    setScreen(APP_SCREENS.SETUP);
  };

  const setFriendlyError = (message, retryFn) => {
    setErrorMessage(message);
    setRetryAction(() => retryFn);
  };

  const startInterview = async () => {
    clearError();

    const trimmedJobTitle = jobTitle.trim();
    const trimmedCompany = company.trim();

    if (!trimmedJobTitle || !trimmedCompany) {
      return;
    }

    setIsStartingInterview(true);

    try {
      const firstQuestion = await generateQuestion(
        trimmedJobTitle,
        trimmedCompany,
        interviewType,
        1,
        []
      );

      setActiveInterview({
        jobTitle: trimmedJobTitle,
        company: trimmedCompany,
        interviewType,
      });

      setInterview({
        ...createInitialInterviewState(),
        currentQuestionNumber: 1,
        currentQuestion: firstQuestion,
      });

      setScreen(APP_SCREENS.INTERVIEW);
    } catch (error) {
      console.error('Failed to start interview:', error);
      setFriendlyError(
        'We hit a connection issue while starting your interview. Please try again.',
        () => startInterview()
      );
    } finally {
      setIsStartingInterview(false);
    }
  };

  const submitAnswer = async () => {
    if (!activeInterview) {
      return;
    }

    const trimmedAnswer = interview.currentAnswer.trim();
    if (!trimmedAnswer || interview.isSubmittingAnswer) {
      return;
    }

    clearError();
    setInterview((prev) => ({ ...prev, isSubmittingAnswer: true }));

    try {
      const feedback = await evaluateAnswer(
        interview.currentQuestion,
        trimmedAnswer,
        activeInterview.jobTitle,
        activeInterview.company,
        activeInterview.interviewType
      );

      setInterview((prev) => ({
        ...prev,
        currentFeedback: feedback,
        history: [
          ...prev.history,
          {
            questionNumber: prev.currentQuestionNumber,
            question: prev.currentQuestion,
            answer: trimmedAnswer,
            score: feedback.score,
            strength: feedback.strength,
            improve: feedback.improve,
          },
        ],
      }));
    } catch (error) {
      console.error('Failed to evaluate answer:', error);
      setFriendlyError(
        'We could not evaluate that answer right now. Please try again.',
        () => submitAnswer()
      );
    } finally {
      setInterview((prev) => ({ ...prev, isSubmittingAnswer: false }));
    }
  };

  const loadNextQuestion = async () => {
    if (!activeInterview || interview.currentQuestionNumber >= QUESTION_COUNT) {
      return;
    }

    clearError();
    setInterview((prev) => ({ ...prev, isGeneratingQuestion: true }));

    const nextQuestionNumber = interview.currentQuestionNumber + 1;
    const previousQuestions = interview.history.map((entry) => entry.question);

    try {
      const nextQuestion = await generateQuestion(
        activeInterview.jobTitle,
        activeInterview.company,
        activeInterview.interviewType,
        nextQuestionNumber,
        previousQuestions
      );

      setInterview((prev) => ({
        ...prev,
        currentQuestionNumber: nextQuestionNumber,
        currentQuestion: nextQuestion,
        currentAnswer: '',
        currentFeedback: null,
      }));
    } catch (error) {
      console.error('Failed to load next question:', error);
      setFriendlyError(
        'We could not fetch the next question. Please try again.',
        () => loadNextQuestion()
      );
    } finally {
      setInterview((prev) => ({ ...prev, isGeneratingQuestion: false }));
    }
  };

  const openResults = async () => {
    if (!activeInterview || interview.history.length < QUESTION_COUNT) {
      return;
    }

    clearError();
    setInterview((prev) => ({ ...prev, isGeneratingSummary: true }));

    try {
      const summary = await generateSummary(
        activeInterview.jobTitle,
        activeInterview.company,
        interview.history
      );

      setInterview((prev) => ({ ...prev, summary }));
      setScreen(APP_SCREENS.RESULTS);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setFriendlyError(
        'We could not generate your report just yet. Please try again.',
        () => openResults()
      );
    } finally {
      setInterview((prev) => ({ ...prev, isGeneratingSummary: false }));
    }
  };

  const startNewInterview = () => {
    clearError();
    setScreen(APP_SCREENS.SETUP);
    setActiveInterview(null);
    setInterview(createInitialInterviewState());
  };

  const overallScore = useMemo(() => {
    if (interview.history.length === 0) {
      return 0;
    }

    const total = interview.history.reduce((sum, entry) => sum + entry.score, 0);
    return Number((total / interview.history.length).toFixed(1));
  }, [interview.history]);

  const currentScreen = (() => {
    if (screen === APP_SCREENS.LANDING) {
      return <LandingPage onLaunchApp={goToSetup} />;
    }

    if (screen === APP_SCREENS.SETUP) {
      return (
        <SetupScreen
          jobTitle={jobTitle}
          company={company}
          interviewType={interviewType}
          onJobTitleChange={setJobTitle}
          onCompanyChange={setCompany}
          onInterviewTypeChange={setInterviewType}
          onStartInterview={startInterview}
          isLoading={isStartingInterview}
          errorMessage={errorMessage}
          onRetry={retryAction}
        />
      );
    }

    if (screen === APP_SCREENS.INTERVIEW) {
      return (
        <InterviewScreen
          questionNumber={interview.currentQuestionNumber}
          totalQuestions={QUESTION_COUNT}
          question={interview.currentQuestion}
          answer={interview.currentAnswer}
          feedback={interview.currentFeedback}
          history={interview.history}
          isLoadingQuestion={interview.isGeneratingQuestion}
          isSubmitting={interview.isSubmittingAnswer}
          isGeneratingSummary={interview.isGeneratingSummary}
          onAnswerChange={(value) =>
            setInterview((prev) => ({ ...prev, currentAnswer: value }))
          }
          onSubmitAnswer={submitAnswer}
          onNextQuestion={loadNextQuestion}
          onSeeResults={openResults}
          errorMessage={errorMessage}
          onRetry={retryAction}
        />
      );
    }

    return (
      <ResultsScreen
        overallScore={overallScore}
        summary={interview.summary}
        jobTitle={activeInterview?.jobTitle || jobTitle}
        company={activeInterview?.company || company}
        onStartNewInterview={startNewInterview}
        errorMessage={errorMessage}
        onRetry={retryAction}
      />
    );
  })();

  return (
    <main className={`app-shell ${screen === APP_SCREENS.LANDING ? 'app-shell-landing' : ''}`}>
      <div key={screen} className="screen-transition">
        {currentScreen}
      </div>
    </main>
  );
}

export default App;
