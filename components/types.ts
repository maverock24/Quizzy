export type Quiz = {
  name: string;
  category?: string;
  questions: QuizQuestion[];
  noShuffle?: boolean; // If true, questions will be shown in order (useful for tutorials/experiments)
};

export type Answer = {
  answer: string;
};

export type QuizQuestion = {
  question: string;
  answers: Answer[];
  answer: string;
  explanation: string;
};

// ======== Enhanced Learning Types ========

// Parsons Problems - drag & drop code ordering
export type ParsonsLine = { id: string; code: string; indent: number };
export type ParsonsProblem = {
  id: string;
  title: string;
  description: string;
  scrambledLines: ParsonsLine[];
  correctOrder: string[]; // array of line IDs in correct sequence
};

// Code Tracing - "What will this output?"
export type CodeTracingQuestion = {
  id: string;
  code: string;
  question: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
};

// Faded Worked Examples - progressive scaffolding
export type FadedExampleStage = {
  description: string;
  code: string;
  blanks: { lineIndex: number; answer: string }[];
};
export type FadedExample = {
  id: string;
  title: string;
  description: string;
  stages: FadedExampleStage[];
};

// Debugging Exercises - find the bug
export type DebuggingExercise = {
  id: string;
  title: string;
  description: string;
  code: string;
  buggyLineIndex: number;
  explanation: string;
  fixedCode: string;
};

// Spaced Repetition System (SRS) data
export type SRSQuestionData = {
  questionId: string;
  quizName: string;
  nextReviewDate: number; // timestamp
  interval: number; // days
  easeFactor: number;
  repetitions: number;
};
