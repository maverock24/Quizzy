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
