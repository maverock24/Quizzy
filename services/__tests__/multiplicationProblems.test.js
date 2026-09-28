import {
  generateMultiplicationProblems,
  generateMultiplicationQuestions,
  MAX_MULTIPLICATION_FACTOR,
  MULTIPLICATION_QUESTION_COUNT,
} from '../multiplicationProblems';

// Deterministic linear-congruential rng so the tests are reproducible.
const seededRng = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

describe('generateMultiplicationProblems', () => {
  it('generates the requested number of problems', () => {
    const problems = generateMultiplicationProblems(20, 10, seededRng(1));
    expect(problems).toHaveLength(20);
  });

  it('keeps factors within 1..maxFactor and computes the product', () => {
    const problems = generateMultiplicationProblems(
      MULTIPLICATION_QUESTION_COUNT,
      MAX_MULTIPLICATION_FACTOR,
      seededRng(42),
    );

    for (const { a, b, product } of problems) {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(MAX_MULTIPLICATION_FACTOR);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(MAX_MULTIPLICATION_FACTOR);
      expect(product).toBe(a * b);
    }
  });

  it('does not repeat an ordered pair within a round', () => {
    const problems = generateMultiplicationProblems(50, 10, seededRng(7));
    const pairs = problems.map(({ a, b }) => `${a}x${b}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('never produces more problems than there are unique pairs', () => {
    const problems = generateMultiplicationProblems(500, 10, seededRng(3));
    expect(problems).toHaveLength(MAX_MULTIPLICATION_FACTOR ** 2);
  });

  it('honours a smaller multiplication table', () => {
    const problems = generateMultiplicationProblems(10, 5, seededRng(9));
    for (const { a, b } of problems) {
      expect(a).toBeLessThanOrEqual(5);
      expect(b).toBeLessThanOrEqual(5);
    }
  });
});

describe('generateMultiplicationQuestions', () => {
  it('produces typed-answer questions with the product as the answer', () => {
    const questions = generateMultiplicationQuestions(5, 10);

    expect(questions).toHaveLength(5);
    for (const q of questions) {
      // "7 × 8 = ?"
      const match = /^(\d+) × (\d+) = \?$/.exec(q.question);
      expect(match).not.toBeNull();

      const a = Number(match[1]);
      const b = Number(match[2]);
      expect(q.answer).toBe(String(a * b));
      expect(q.answers).toEqual([]);
      expect(q.explanation).toBe(`${a} × ${b} = ${a * b}`);
    }
  });
});
