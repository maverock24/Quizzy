/**
 * A plain integer is the only numeric answer a child can type. A thousands
 * separator, a unit, a clock time and a fraction read better as buttons, and
 * `1000` for `1.000` would be marked wrong by the exact-match check.
 */
export function isTypedAnswer(answer: string): boolean {
  return /^-?\d+$/.test(answer.trim());
}
