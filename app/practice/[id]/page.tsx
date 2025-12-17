'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Sample questions for demo
const SAMPLE_QUESTIONS = [
  {
    id: '1',
    stem: 'A client is performing a 400-meter sprint. Which energy system will contribute MOST to this activity?',
    choices: ['ATP-PC system', 'Glycolytic system', 'Oxidative system', 'Phosphagen system exclusively'],
    answerIdx: 1,
    domainCode: 'D1',
  },
  {
    id: '2',
    stem: 'How many calories per gram does protein provide?',
    choices: ['3 calories', '4 calories', '7 calories', '9 calories'],
    answerIdx: 1,
    domainCode: 'D1',
  },
  {
    id: '3',
    stem: 'A client states: "I know I should exercise, but I just can\'t seem to get started." This client is MOST likely in which stage of the Transtheoretical Model?',
    choices: ['Precontemplation', 'Contemplation', 'Preparation', 'Action'],
    answerIdx: 1,
    domainCode: 'D2',
  },
];

export default function PracticeTestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(120 * 60); // 120 minutes in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (choiceIdx: number) => {
    setResponses({ ...responses, [currentQuestion]: choiceIdx });
  };

  const handleNext = () => {
    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    // In production, submit to API
    router.push(`/results/${params.id}`);
  };

  const question = SAMPLE_QUESTIONS[currentQuestion];
  const selectedAnswer = responses[currentQuestion];
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / SAMPLE_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-mono text-lg font-semibold ${timeRemaining < 600 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Progress */}
            <div className="flex-1 max-w-md mx-8">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length}</span>
                <span>{answeredCount} answered</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-semibold"
            >
              Submit Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-28 pb-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Domain Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
            Domain {question.domainCode}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {question.stem}
          </h2>

          {/* Choices */}
          <div className="space-y-3">
            {question.choices.map((choice, idx) => (
              <label
                key={idx}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedAnswer === idx
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                }`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={idx}
                  checked={selectedAnswer === idx}
                  onChange={() => handleAnswer(idx)}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <span className="inline-block w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-center font-semibold mr-3">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-gray-900 dark:text-white">{choice}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedAnswer !== undefined ? (
              <span className="text-green-600 dark:text-green-400 font-medium">✓ Answered</span>
            ) : (
              <span>Not answered</span>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentQuestion === SAMPLE_QUESTIONS.length - 1}
            className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Question Navigator */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Question Navigator
          </h3>
          <div className="grid grid-cols-10 gap-2">
            {SAMPLE_QUESTIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-md font-semibold transition-colors ${
                  idx === currentQuestion
                    ? 'bg-primary-600 text-white'
                    : responses[idx] !== undefined
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Submit Test?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              You have answered {answeredCount} of {SAMPLE_QUESTIONS.length} questions.
            </p>
            {answeredCount < SAMPLE_QUESTIONS.length && (
              <p className="text-orange-600 dark:text-orange-400 mb-4">
                Warning: {SAMPLE_QUESTIONS.length - answeredCount} questions are unanswered.
              </p>
            )}
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to submit your test? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
