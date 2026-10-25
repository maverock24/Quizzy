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

// An ordered pair is distinct from its mirror image, so key on both factors.
const pairKey = ({ a, b }) => `${a}x${b}`;

describe('generateMultiplicationProblems', () => {
  it('generates the default number of distinct ordered pairs by default', () => {
    const problems = generateMultiplicationProblems({ rng: seededRng(1) });

    expect(problems).toHaveLength(MULTIPLICATION_QUESTION_COUNT);

    const pairs = problems.map(pairKey);
    expect(new Set(pairs).size).toBe(pairs.length);

    for (const { a, b, product } of problems) {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(MAX_MULTIPLICATION_FACTOR);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(MAX_MULTIPLICATION_FACTOR);
      expect(product).toBe(a * b);
    }
  });

  it('does not repeat an ordered pair within a round when the span is larger than the round', () => {
    const problems = generateMultiplicationProblems({
      count: 50,
      rng: seededRng(7),
    });
    const pairs = problems.map(pairKey);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('keeps both factors inside a custom minFactor..maxFactor', () => {
    const problems = generateMultiplicationProblems({
      minFactor: 5,
      maxFactor: 9,
      rng: seededRng(42),
    });

    expect(problems).toHaveLength(MULTIPLICATION_QUESTION_COUNT);

    for (const { a, b, product } of problems) {
      expect(a).toBeGreaterThanOrEqual(5);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(5);
      expect(b).toBeLessThanOrEqual(9);
      expect(product).toBe(a * b);
    }
  });

  it('treats an inverted range like the normalised one', () => {
    const inverted = generateMultiplicationProblems({
      minFactor: 9,
      maxFactor: 5,
      rng: seededRng(11),
    });
    const normalised = generateMultiplicationProblems({
      minFactor: 5,
      maxFactor: 9,
      rng: seededRng(11),
    });

    expect(inverted).toEqual(normalised);

    for (const { a, b } of inverted) {
      expect(a).toBeGreaterThanOrEqual(5);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(5);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it('cycles the available pairs once a small range is exhausted', () => {
    const problems = generateMultiplicationProblems({
      count: 20,
      minFactor: 5,
      maxFactor: 6,
      rng: seededRng(13),
    });

    expect(problems).toHaveLength(20);

    const available = new Set(['5x5', '5x6', '6x5', '6x6']);
    for (const problem of problems) {
      expect(available.has(pairKey(problem))).toBe(true);
    }

    // The first four are the four pairs, so repeats start only after exhaustion.
    const firstFour = problems.slice(0, 4).map(pairKey);
    expect(new Set(firstFour)).toEqual(available);

    // And the repeats keep cycling through them in that same order.
    expect(problems.map(pairKey)).toEqual(
      problems.map((_, i) => firstFour[i % 4]),
    );
  });

  it('returns the requested count beyond the size of a single round', () => {
    const problems = generateMultiplicationProblems({
      count: 500,
      rng: seededRng(3),
    });

    expect(problems).toHaveLength(500);

    for (const { a, b } of problems) {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(MAX_MULTIPLICATION_FACTOR);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(MAX_MULTIPLICATION_FACTOR);
    }
  });
});

describe('generateMultiplicationQuestions', () => {
  it('produces typed-answer questions with the product as the answer', () => {
    const questions = generateMultiplicationQuestions({
      count: 5,
      rng: seededRng(21),
    });

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
