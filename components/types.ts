export type Quiz = {
  name: string;
  questions: Question[];
};

export type Answer = {
  answer: string;
};

export type Question = {
  question: string;
  answers: Answer[];
  answer: string;
  explanation: string;
};
