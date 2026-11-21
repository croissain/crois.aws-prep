/** AI audit of a question's answer key and explanation, loaded from data/reviews.json. */
export type QuestionReview = {
  /** disputed: AI disagrees with the key. uncertain: key defensible but the question is outdated, ambiguous or broken. */
  flag: "disputed" | "uncertain";
  aiAnswer: string[];
  confidence: "high" | "medium" | "low";
  note: string;
  aiExplanation: string;
};
export type Choice = { id: string; text: string };
export type Question = {
  id: string;
  examId: string;
  prompt: string;
  choices: Choice[];
  correctChoiceIds: string[];
  explanation: string;
  tags: string[];
  multiple: boolean;
  review?: QuestionReview;
};
export type Exam = {
  id: string;
  code: string;
  name: string;
  provider: string;
  durationMinutes: number;
  questionCount: number;
  passingScore: number;
  /** Domain weighting for generated mock exams; `tag` matches a question's first tag. */
  domains?: Array<{ tag: string; label: string; weight: number }>;
};
export type Preset = {
  id: string;
  examId: string;
  name: string;
  source: string;
  questions: Question[];
};
export type ExamResult = {
  id: string;
  examId: string;
  completedAt: string;
  score: number;
  correct: number;
  total: number;
  elapsedSeconds: number;
  tagStats: Record<string, { correct: number; total: number }>;
  answers: Record<string, string[]>;
};
