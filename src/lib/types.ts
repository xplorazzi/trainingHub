export type Role = "employee" | "manager" | "admin";

export type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "passed"
  | "failed";

export interface ModuleQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SeedModule {
  slug: string;
  title: string;
  description: string;
  videoUrl: string;
  passThreshold: number;
  durationMins: number;
  thumbnail: string;
  category: string;
  required: boolean;
  maxAttempts: number;
  objectives: string[];
  questions: ModuleQuestion[];
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number | null;
}

export interface GradedQuestion {
  questionId: string;
  text: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  explanation: string;
  isCorrect: boolean;
}

export interface SubmitResult {
  attemptId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  passThreshold: number;
  gradedQuestions: GradedQuestion[];
  canRetake: boolean;
  remainingAttempts: number;
}
