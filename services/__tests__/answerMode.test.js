import { isTypedAnswer } from '../answerMode';

describe('isTypedAnswer', () => {
  it('accepts a plain integer', () => {
    expect(isTypedAnswer('19')).toBe(true);
  });

  it('accepts a negative integer', () => {
    expect(isTypedAnswer('-4')).toBe(true);
  });

  it('accepts an integer with surrounding whitespace', () => {
    expect(isTypedAnswer(' 42 ')).toBe(true);
  });

  it('rejects a dot decimal', () => {
    expect(isTypedAnswer('3.5')).toBe(false);
  });

  it('rejects a comma decimal', () => {
    expect(isTypedAnswer('3,5')).toBe(false);
  });

  it('rejects a dot thousands separator', () => {
    expect(isTypedAnswer('1.000')).toBe(false);
  });

  it('rejects a comma thousands separator', () => {
    expect(isTypedAnswer('10,000')).toBe(false);
  });

  it('rejects a number with a unit', () => {
    expect(isTypedAnswer('120 Minuten')).toBe(false);
  });

  it('rejects a clock time', () => {
    expect(isTypedAnswer('12:15 Uhr')).toBe(false);
  });

  it('rejects a fraction', () => {
    expect(isTypedAnswer('3/4')).toBe(false);
  });

  it('rejects a word', () => {
    expect(isTypedAnswer('dreißig')).toBe(false);
  });

  it('rejects a trailing minus', () => {
    expect(isTypedAnswer('5-')).toBe(false);
  });

  it('rejects a doubled minus', () => {
    expect(isTypedAnswer('--5')).toBe(false);
  });

  it('rejects a bare minus', () => {
    expect(isTypedAnswer('-')).toBe(false);
  });

  it('rejects an empty answer', () => {
    expect(isTypedAnswer('')).toBe(false);
  });
});
