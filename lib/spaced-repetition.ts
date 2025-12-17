import { ReviewQuality } from '@/types';

export interface SM2Result {
  interval: number;
  ease: number;
  reps: number;
}

/**
 * SM-2 Algorithm Implementation
 * Based on SuperMemo 2 algorithm for spaced repetition
 *
 * @param quality - Rating from 0-5 (0=complete blackout, 5=perfect)
 * @param prevInterval - Previous interval in days
 * @param prevEase - Previous ease factor (default 2.5)
 * @param prevReps - Previous number of repetitions
 * @returns New interval, ease factor, and rep count
 */
export function calculateSM2(
  quality: ReviewQuality,
  prevInterval: number = 0,
  prevEase: number = 2.5,
  prevReps: number = 0
): SM2Result {
  let ease = prevEase;
  let interval = prevInterval;
  let reps = prevReps;

  // Update ease factor based on quality (min 1.3)
  ease = Math.max(
    1.3,
    ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  if (quality < 3) {
    // Failed recall - start over
    interval = 1;
    reps = 0;
  } else {
    // Successful recall
    reps += 1;

    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * ease);
    }
  }

  return { interval, ease, reps };
}

/**
 * Calculate due date for next review
 */
export function calculateDueDate(interval: number): Date {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  return dueDate;
}

/**
 * Check if a flashcard is due for review
 */
export function isDue(dueAt: Date): boolean {
  return new Date() >= new Date(dueAt);
}

/**
 * Get color coding for ease factor (for UI visualization)
 */
export function getEaseColor(ease: number): string {
  if (ease >= 2.5) return 'green';
  if (ease >= 2.0) return 'yellow';
  return 'red';
}

/**
 * Get recommended study batch size based on due cards
 */
export function getRecommendedBatchSize(totalDue: number): number {
  if (totalDue === 0) return 10; // Default for new cards
  if (totalDue < 20) return totalDue;
  if (totalDue < 50) return 20;
  return 30;
}
