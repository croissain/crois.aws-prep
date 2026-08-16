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
};
export type Exam = {
  id: string;
  code: string;
  name: string;
  provider: string;
  durationMinutes: number;
  questionCount: number;
  passingScore: number;
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
