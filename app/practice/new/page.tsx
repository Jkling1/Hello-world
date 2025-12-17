'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewPracticeTestPage() {
  const router = useRouter();
  const [testType, setTestType] = useState<'full' | 'quick' | 'custom'>('full');
  const [includeUnscored, setIncludeUnscored] = useState(true);
  const [customQuestions, setCustomQuestions] = useState(60);

  const handleStartTest = () => {
    // In production, create attempt via API
    const attemptId = 'demo-attempt-' + Date.now();
    router.push(`/practice/${attemptId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
              ← Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              New Practice Test
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Choose Your Test Format
          </h2>

          {/* Test Type Selection */}
          <div className="space-y-4 mb-8">
            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="testType"
                value="full"
                checked={testType === 'full'}
                onChange={(e) => setTestType(e.target.value as any)}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Full Exam (120 Questions)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Complete CPT-7 exam simulation with 2-hour time limit
                  {includeUnscored && ' (includes 20 unscored research items)'}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Domain distribution: D1(15%), D2(15%), D3(16%), D4(24%), D5(20%), D6(10%)
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="testType"
                value="quick"
                checked={testType === 'quick'}
                onChange={(e) => setTestType(e.target.value as any)}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Quick Quiz (30 Questions)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  30-minute practice quiz with proportional domain weighting
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="radio"
                name="testType"
                value="custom"
                checked={testType === 'custom'}
                onChange={(e) => setTestType(e.target.value as any)}
                className="mt-1 mr-4"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Custom Test
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Choose your own number of questions
                </div>
                {testType === 'custom' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Questions: {customQuestions}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      step="10"
                      value={customQuestions}
                      onChange={(e) => setCustomQuestions(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Options */}
          {testType === 'full' && (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUnscored}
                  onChange={(e) => setIncludeUnscored(e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Include Unscored Research Items
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Simulate real exam with 20 unscored items (not identified during test)
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Exam Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              About the CPT-7 Exam
            </h3>
            <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <li>• 120 total questions (100 scored + 20 unscored research items)</li>
              <li>• 2-hour time limit</li>
              <li>• Scaled passing score of 70%</li>
              <li>• Questions weighted by domain importance</li>
              <li>• No penalty for guessing</li>
            </ul>
          </div>

          {/* Start Button */}
          <div className="flex justify-center">
            <button
              onClick={handleStartTest}
              className="px-8 py-4 bg-primary-600 dark:bg-primary-500 text-white rounded-lg shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors text-lg font-semibold"
            >
              Start{' '}
              {testType === 'full'
                ? 'Full Exam'
                : testType === 'quick'
                ? 'Quick Quiz'
                : `${customQuestions}-Question Test`}
            </button>
          </div>

          {/* Warning */}
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              <strong>Note:</strong> Once started, the timer cannot be paused (just like the real exam).
              Make sure you have enough uninterrupted time before beginning.
            </p>
          </div>
        </div>

        {/* Study Tips */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Test-Taking Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>• Read each question carefully - watch for qualifiers like "MOST," "BEST," "EXCEPT"</li>
            <li>• Eliminate obviously wrong answers first</li>
            <li>• Trust your first instinct if you're unsure</li>
            <li>• Manage your time - about 1 minute per question</li>
            <li>• Answer every question - no penalty for guessing</li>
            <li>• Use the OPT model and acute variables as your framework</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
