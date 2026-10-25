/** How a multiplication round decides when it is over. */
export type RoundMode = 'count' | 'timed';

/** Minutes a timed round runs for when the player has not picked a duration. */
export const DEFAULT_ROUND_MINUTES = 3;

/**
 * Turn a duration in minutes into an absolute deadline in milliseconds.
 *
 * `now` is passed in rather than read from `Date.now()` so the result is
 * deterministic and the caller stays in charge of the clock.
 */
export const roundDeadline = (minutes: number, now: number): number =>
  now + minutes * 60000;

/**
 * Whole seconds left until `deadline`, rounded up so the last second is shown
 * in full, and clamped at 0 so an expired round reads as finished, not negative.
 */
export const remainingSeconds = (deadline: number, now: number): number =>
  Math.max(0, Math.ceil((deadline - now) / 1000));

/**
 * Number of problems answered in a round: correct answers plus wrong ones.
 *
 * The floor of 1 keeps the score screen from dividing by zero, since `0 / 0`
 * renders as `NaN%`.
 */
export const answeredCount = (score: number, wrongCount: number): number =>
  Math.max(score + wrongCount, 1);
