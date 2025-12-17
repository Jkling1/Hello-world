'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FlashcardsPage() {
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample flashcards (in production, fetch from API)
  const sampleCards = [
    {
      front: 'Type I muscle fibers',
      back: 'Slow-twitch fibers; high oxidative capacity, fatigue-resistant, recruited for endurance activities and low-intensity contractions.',
      difficulty: 'Easy',
    },
    {
      front: 'ATP-PC System',
      back: 'Phosphagen system; provides immediate energy (0-10 seconds); uses stored ATP and creatine phosphate; no oxygen required; used for maximal-effort, short-duration activities.',
      difficulty: 'Easy',
    },
    {
      front: 'SMART Goals',
      back: 'Specific, Measurable, Achievable, Relevant, Time-bound - framework for effective goal setting that increases adherence and success.',
      difficulty: 'Easy',
    },
  ];

  const currentCard = sampleCards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % sampleCards.length);
  };

  const handlePrevious = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + sampleCards.length) % sampleCards.length);
  };

  const handleQualityRating = (quality: number) => {
    // In production, update spaced repetition schedule via API
    console.log(`Rated with quality: ${quality}`);
    handleNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline">
              ← Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Flashcards
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Card {currentIndex + 1} of {sampleCards.length}</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">
              {currentCard.difficulty}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / sampleCards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div
          className="relative w-full h-96 mb-8 cursor-pointer perspective-1000"
          onClick={() => setFlipped(!flipped)}
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute w-full h-full backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center text-center border-4 border-purple-500">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
                  Question
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {currentCard.front}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
                  Click to flip
                </p>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute w-full h-full backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 flex flex-col items-center justify-center text-center border-4 border-pink-500">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
                  Answer
                </p>
                <p className="text-lg text-gray-800 dark:text-gray-200">
                  {currentCard.back}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-8">
                  Click to flip
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handlePrevious}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-300 dark:border-gray-600"
          >
            ← Previous
          </button>
          <button
            onClick={() => setFlipped(!flipped)}
            className="px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            Flip Card
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-300 dark:border-gray-600"
          >
            Next →
          </button>
        </div>

        {/* Spaced Repetition Rating */}
        {flipped && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-4">
              How well did you know this?
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleQualityRating(1)}
                className="px-4 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                <div className="font-semibold">Again</div>
                <div className="text-xs mt-1">&lt;1 day</div>
              </button>
              <button
                onClick={() => handleQualityRating(3)}
                className="px-4 py-3 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
              >
                <div className="font-semibold">Hard</div>
                <div className="text-xs mt-1">1-3 days</div>
              </button>
              <button
                onClick={() => handleQualityRating(5)}
                className="px-4 py-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <div className="font-semibold">Easy</div>
                <div className="text-xs mt-1">4+ days</div>
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Spaced Repetition:</strong> Rate each card to optimize your review schedule.
            Cards you struggle with will appear more frequently, while mastered cards appear less often.
          </p>
        </div>
      </div>
    </div>
  );
}
