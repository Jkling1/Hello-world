import { Question, ExamTemplate, DOMAIN_WEIGHTS } from '@/types';

/**
 * Assemble an exam based on template specifications
 * Ensures proper domain weight distribution
 */
export function assembleExam(
  allQuestions: Question[],
  template: ExamTemplate,
  includeUnscored: boolean = true
): {
  scoredQuestions: Question[];
  unscoredQuestions: Question[];
  distribution: Record<string, number>;
} {
  const scoredCount = template.totalItems - (includeUnscored ? template.unscoredItems : 0);
  const domainWeights = template.domainWeights as Record<string, number>;

  // Calculate target count per domain
  const targetCounts: Record<string, number> = {};
  Object.entries(domainWeights).forEach(([domain, weight]) => {
    targetCounts[domain] = Math.round((scoredCount * weight) / 100);
  });

  // Adjust for rounding errors
  const totalTargeted = Object.values(targetCounts).reduce((a, b) => a + b, 0);
  if (totalTargeted !== scoredCount) {
    // Add/subtract from the largest domain
    const largestDomain = Object.entries(targetCounts).reduce((a, b) =>
      b[1] > a[1] ? b : a
    )[0];
    targetCounts[largestDomain] += scoredCount - totalTargeted;
  }

  // Group questions by domain
  const questionsByDomain: Record<string, Question[]> = {};
  allQuestions.forEach((q) => {
    if (!questionsByDomain[q.domainId]) {
      questionsByDomain[q.domainId] = [];
    }
    questionsByDomain[q.domainId].push(q);
  });

  // Sample questions from each domain
  const scoredQuestions: Question[] = [];
  const distribution: Record<string, number> = {};

  Object.entries(targetCounts).forEach(([domain, count]) => {
    const available = questionsByDomain[domain] || [];
    const shuffled = shuffleArray([...available]);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    scoredQuestions.push(...selected);
    distribution[domain] = selected.length;
  });

  // Select unscored questions (if needed)
  let unscoredQuestions: Question[] = [];
  if (includeUnscored && template.unscoredItems > 0) {
    const remainingQuestions = allQuestions.filter(
      (q) => !scoredQuestions.find((sq) => sq.id === q.id)
    );
    const shuffled = shuffleArray(remainingQuestions);
    unscoredQuestions = shuffled.slice(0, template.unscoredItems);
  }

  // Shuffle the final question order
  const finalScored = shuffleArray(scoredQuestions);

  return {
    scoredQuestions: finalScored,
    unscoredQuestions,
    distribution,
  };
}

/**
 * Calculate exam score and performance metrics
 */
export function calculateExamScore(
  responses: Array<{ qId: string; selectedIdx: number; isCorrect: boolean }>,
  questions: Question[]
): {
  scorePct: number;
  correctCount: number;
  totalCount: number;
  domainScores: Record<string, { correct: number; total: number; pct: number }>;
} {
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const totalCount = responses.length;
  const scorePct = (correctCount / totalCount) * 100;

  // Calculate per-domain scores
  const domainScores: Record<string, { correct: number; total: number; pct: number }> = {};

  responses.forEach((response) => {
    const question = questions.find((q) => q.id === response.qId);
    if (!question) return;

    if (!domainScores[question.domainId]) {
      domainScores[question.domainId] = { correct: 0, total: 0, pct: 0 };
    }

    domainScores[question.domainId].total += 1;
    if (response.isCorrect) {
      domainScores[question.domainId].correct += 1;
    }
  });

  // Calculate percentages
  Object.keys(domainScores).forEach((domain) => {
    const { correct, total } = domainScores[domain];
    domainScores[domain].pct = (correct / total) * 100;
  });

  return { scorePct, correctCount, totalCount, domainScores };
}

/**
 * Identify weak areas based on attempt history
 */
export function identifyWeakAreas(
  domainScores: Record<string, { correct: number; total: number; pct: number }>,
  threshold: number = 70
): string[] {
  return Object.entries(domainScores)
    .filter(([_, score]) => score.pct < threshold)
    .map(([domain, _]) => domain)
    .sort((a, b) => domainScores[a].pct - domainScores[b].pct);
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate exam distribution matches template weights
 */
export function validateDistribution(
  distribution: Record<string, number>,
  template: ExamTemplate,
  tolerance: number = 1
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const scoredTotal = template.totalItems - template.unscoredItems;
  const domainWeights = template.domainWeights as Record<string, number>;

  Object.entries(domainWeights).forEach(([domain, weightPct]) => {
    const targetCount = Math.round((scoredTotal * weightPct) / 100);
    const actualCount = distribution[domain] || 0;
    const diff = Math.abs(actualCount - targetCount);

    if (diff > tolerance) {
      errors.push(
        `Domain ${domain}: expected ~${targetCount} questions (±${tolerance}), got ${actualCount}`
      );
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Create a default exam template
 */
export function createDefaultTemplate(): ExamTemplate {
  return {
    id: 'default',
    name: 'CPT-7 Full Exam',
    totalItems: 120,
    unscoredItems: 20,
    timeLimitMin: 120,
    domainWeights: DOMAIN_WEIGHTS,
  };
}
