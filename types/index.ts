// Domain Types
export interface Domain {
  id: string;
  code: string;
  name: string;
  weightPct: number;
  subtopics?: Subtopic[];
}

export interface Subtopic {
  id: string;
  domainId: string;
  title: string;
  summary: string;
}

// Content Types
export interface Term {
  id: string;
  term: string;
  definition: string;
  subtopicId?: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  termId?: string;
  subtopicId?: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
}

export interface Question {
  id: string;
  stem: string;
  choices: string[];
  answerIdx: number;
  rationale: string;
  difficulty: string;
  subtopicId?: string;
  domainId: string;
  tags: string[];
}

// Exam Types
export interface ExamTemplate {
  id: string;
  name: string;
  totalItems: number;
  unscoredItems: number;
  timeLimitMin: number;
  domainWeights: Record<string, number>;
}

export interface Attempt {
  id: string;
  userId: string;
  templateId: string;
  startedAt: Date;
  finishedAt?: Date;
  scored: boolean;
  scorePct?: number;
  responses: QuestionResponse[];
}

export interface QuestionResponse {
  qId: string;
  selectedIdx: number;
  isCorrect: boolean;
}

// Progress Types
export interface Progress {
  id: string;
  userId: string;
  domainId: string;
  mastery0to1: number;
  lastSeen: Date;
}

export interface Review {
  id: string;
  userId: string;
  flashcardId: string;
  dueAt: Date;
  interval: number;
  ease: number;
  reps: number;
  qualityLast: number;
}

// Spaced Repetition Quality Ratings
export enum ReviewQuality {
  CompleteBlackout = 0,
  IncorrectButFamiliar = 1,
  IncorrectButEasy = 2,
  CorrectWithDifficulty = 3,
  CorrectWithHesitation = 4,
  Perfect = 5,
}

// Domain Constants
export const DOMAIN_WEIGHTS = {
  D1: 15, // Basic & Applied Sciences + Nutrition
  D2: 15, // Client Relations & Behavioral Coaching
  D3: 16, // Assessment
  D4: 24, // Exercise Technique & Training Instruction
  D5: 20, // Program Design
  D6: 10, // Professional Development & Responsibility
} as const;

export const DOMAIN_NAMES = {
  D1: 'Basic & Applied Sciences + Nutrition',
  D2: 'Client Relations & Behavioral Coaching',
  D3: 'Assessment',
  D4: 'Exercise Technique & Training Instruction',
  D5: 'Program Design',
  D6: 'Professional Development & Responsibility',
} as const;
