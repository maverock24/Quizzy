import { QuizQuestion } from '@/components/types';

/** Marker stored on a quiz so the app knows to regenerate its problems. */
export const MULTIPLICATION_GENERATOR = 'multiplication';

/** Multiplication tables run from 1 up to and including this factor. */
export const MAX_MULTIPLICATION_FACTOR = 10;

/** Number of problems in a single practice round. */
export const MULTIPLICATION_QUESTION_COUNT = 20;

export type MultiplicationProblem = {
  a: number;
  b: number;
  product: number;
};

export type MultiplicationProblemOptions = {
  count?: number;
  minFactor?: number;
  maxFactor?: number;
  rng?: () => number;
};

/**
 * Build `count` multiplication problems with both factors inside
 * `minFactor..maxFactor`.
 *
 * Every ordered pair in the range is enumerated and shuffled with `rng`, so
 * a×b and b×a both count as separate practice problems. Once the pair list is
 * exhausted the problems repeat from the top of the shuffle. Pure: pass a
 * seeded `rng` to get a deterministic result (used by tests).
 */
export const generateMultiplicationProblems = ({
  count = MULTIPLICATION_QUESTION_COUNT,
  minFactor = 1,
  maxFactor = MAX_MULTIPLICATION_FACTOR,
  rng = Math.random,
}: MultiplicationProblemOptions = {}): MultiplicationProblem[] => {
  const lo = Math.min(minFactor, maxFactor);
  const hi = Math.max(minFactor, maxFactor);

  const pairs: MultiplicationProblem[] = [];
  for (let a = lo; a <= hi; a++) {
    for (let b = lo; b <= hi; b++) {
      pairs.push({ a, b, product: a * b });
    }
  }

  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  const problems: MultiplicationProblem[] = [];
  for (let i = 0; i < count; i++) {
    problems.push(pairs[i % pairs.length]);
  }

  return problems;
};

const toQuizQuestion = ({
  a,
  b,
  product,
}: MultiplicationProblem): QuizQuestion => ({
  question: `${a} × ${b} = ?`,
  answers: [],
  answer: String(product),
  explanation: `${a} × ${b} = ${product}`,
});

/** Turn freshly generated problems into quiz questions with typed answers. */
export const generateMultiplicationQuestions = (
  options: MultiplicationProblemOptions = {},
): QuizQuestion[] =>
  generateMultiplicationProblems(options).map(toQuizQuestion);
