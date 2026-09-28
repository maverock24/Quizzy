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

/**
 * Build up to `count` distinct multiplication problems with factors in
 * `1..maxFactor`.
 *
 * Pure: pass a seeded `rng` to get a deterministic result (used by tests).
 * Ordered pairs are unique within a round, so a×b and b×a both count as
 * separate practice problems.
 */
export const generateMultiplicationProblems = (
  count: number = MULTIPLICATION_QUESTION_COUNT,
  maxFactor: number = MAX_MULTIPLICATION_FACTOR,
  rng: () => number = Math.random,
): MultiplicationProblem[] => {
  const target = Math.min(count, maxFactor * maxFactor);
  const seen = new Set<string>();
  const problems: MultiplicationProblem[] = [];
  // Guards against a degenerate rng that keeps producing the same pair.
  const maxAttempts = target * 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (problems.length >= target) break;

    const a = Math.floor(rng() * maxFactor) + 1;
    const b = Math.floor(rng() * maxFactor) + 1;
    const key = `${a}x${b}`;
    if (seen.has(key)) continue;

    seen.add(key);
    problems.push({ a, b, product: a * b });
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
  count?: number,
  maxFactor?: number,
): QuizQuestion[] =>
  generateMultiplicationProblems(count, maxFactor).map(toQuizQuestion);
