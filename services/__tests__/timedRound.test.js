import { answeredCount, remainingSeconds, roundDeadline } from '../timedRound';

describe('roundDeadline', () => {
  it('places the deadline the given number of minutes after now', () => {
    expect(roundDeadline(3, 1000)).toBe(181000);
  });

  it('leaves the deadline at now for a zero duration', () => {
    expect(roundDeadline(0, 1000)).toBe(1000);
  });
});

describe('remainingSeconds', () => {
  it('reports nothing left at the deadline itself', () => {
    expect(remainingSeconds(181000, 181000)).toBe(0);
  });

  it('never reports a negative countdown', () => {
    expect(remainingSeconds(181000, 181500)).toBe(0);
  });

  it('keeps the last second visible until it has fully elapsed', () => {
    expect(remainingSeconds(181000, 180000)).toBe(1);
  });

  it('rounds the remaining time up to whole seconds', () => {
    expect(remainingSeconds(181000, 61000)).toBe(120);
  });
});

describe('answeredCount', () => {
  it('floors the denominator at one so the score screen cannot divide by zero', () => {
    expect(answeredCount(0, 0)).toBe(1);
  });

  it('counts the correct answers when none were wrong', () => {
    expect(answeredCount(3, 0)).toBe(3);
  });

  it('counts the wrong answers when none were correct', () => {
    expect(answeredCount(0, 2)).toBe(2);
  });

  it('adds the correct and the wrong answers together', () => {
    expect(answeredCount(5, 1)).toBe(6);
  });
});
