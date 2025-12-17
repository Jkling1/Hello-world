import Link from 'next/link';
import { DOMAIN_NAMES, DOMAIN_WEIGHTS } from '@/types';

export default function DomainDetailPage({ params }: { params: { id: string } }) {
  const domainCode = params.id;
  const domainName = DOMAIN_NAMES[domainCode as keyof typeof DOMAIN_NAMES];
  const domainWeight = DOMAIN_WEIGHTS[domainCode as keyof typeof DOMAIN_WEIGHTS];

  // Sample subtopics (in production, fetch from API)
  const subtopics = [
    { id: '1', title: 'Sample Subtopic 1', summary: 'This is a sample subtopic description.' },
    { id: '2', title: 'Sample Subtopic 2', summary: 'This is another sample subtopic.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Domain Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold text-xl">
                {domainCode}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {domainName}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {domainWeight}% of exam questions
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-primary-600 dark:bg-primary-500 h-3 rounded-full"
                style={{ width: '0%' }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              0% mastery
            </p>
          </div>
        </div>

        {/* Subtopics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Subtopics
          </h2>
          <div className="space-y-4">
            {subtopics.map((subtopic) => (
              <div key={subtopic.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {subtopic.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtopic.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Study Resources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Study Resources for This Domain
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href={`/flashcards?domain=${domainCode}`}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Domain Flashcards
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review flashcards specific to this domain
              </p>
            </Link>

            <Link
              href={`/practice/new?domain=${domainCode}`}
              className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Domain Quiz
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Take a quiz focused on this domain
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
