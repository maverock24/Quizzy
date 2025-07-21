export type Quiz = {
  name?: string;
  nimi?: string;
  questions: QuizQuestion[];
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
