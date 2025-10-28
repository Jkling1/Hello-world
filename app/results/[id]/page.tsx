'use client';

import Link from 'next/link';
import { DOMAIN_NAMES } from '@/types';

export default function ResultsPage({ params }: { params: { id: string } }) {
  // Sample data (in production, fetch from API)
  const results = {
    scorePct: 78,
    correctCount: 78,
    totalCount: 100,
    passed: true,
    timeSpent: '1h 45m',
    domainScores: {
      D1: { correct: 12, total: 15, pct: 80 },
      D2: { correct: 10, total: 15, pct: 67 },
      D3: { correct: 14, total: 16, pct: 88 },
      D4: { correct: 18, total: 24, pct: 75 },
      D5: { correct: 16, total: 20, pct: 80 },
      D6: { correct: 8, total: 10, pct: 80 },
    },
  };

  const weakAreas = Object.entries(results.domainScores)
    .filter(([_, score]) => score.pct < 70)
    .sort((a, b) => a[1].pct - b[1].pct)
    .map(([domain]) => domain);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
              ← Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Test Results
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8 text-center">
          {results.passed ? (
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                Congratulations! You Passed!
              </h2>
            </div>
          ) : (
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900 mb-4">
                <svg className="w-12 h-12 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                Keep Practicing!
              </h2>
            </div>
          )}

          <div className="flex justify-center items-baseline gap-2 mb-4">
            <span className="text-6xl font-bold text-gray-900 dark:text-white">
              {results.scorePct}%
            </span>
            <span className="text-xl text-gray-600 dark:text-gray-400">
              ({results.correctCount}/{results.totalCount})
            </span>
          </div>

          <div className="flex justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-semibold">Passing Score:</span> 70%
            </div>
            <div>
              <span className="font-semibold">Time:</span> {results.timeSpent}
            </div>
          </div>
        </div>

        {/* Domain Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Performance by Domain
          </h3>
          <div className="space-y-4">
            {Object.entries(results.domainScores).map(([domain, score]) => (
              <div key={domain}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 font-bold text-sm">
                      {domain}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {DOMAIN_NAMES[domain as keyof typeof DOMAIN_NAMES]}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {score.correct}/{score.total} correct
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      score.pct >= 70
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {score.pct}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      score.pct >= 70
                        ? 'bg-green-600 dark:bg-green-500'
                        : 'bg-orange-600 dark:bg-orange-500'
                    }`}
                    style={{ width: `${score.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas */}
        {weakAreas.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-4">
              Areas to Focus On
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
              The following domains scored below 70%. We recommend additional study in these areas:
            </p>
            <ul className="space-y-2">
              {weakAreas.map((domain) => (
                <li key={domain} className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{domain}:</span>
                  <span>{DOMAIN_NAMES[domain as keyof typeof DOMAIN_NAMES]}</span>
                  <span className="ml-auto font-semibold">
                    {results.domainScores[domain as keyof typeof results.domainScores].pct}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recommended Next Steps
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/flashcards"
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Review Flashcards
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Strengthen weak areas with targeted review
              </p>
            </Link>

            <Link
              href="/practice/new"
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Take Another Test
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Practice makes perfect
              </p>
            </Link>

            <Link
              href="/"
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                View Progress
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your improvement over time
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
