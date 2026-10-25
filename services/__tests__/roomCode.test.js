import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  generateRoomCode,
  isRoomCode,
  normalizeRoomCode,
} from '../roomCode';

describe('ROOM_CODE_ALPHABET', () => {
  it('leaves out the characters that look alike', () => {
    expect(ROOM_CODE_ALPHABET).not.toContain('0');
    expect(ROOM_CODE_ALPHABET).not.toContain('O');
    expect(ROOM_CODE_ALPHABET).not.toContain('1');
    expect(ROOM_CODE_ALPHABET).not.toContain('I');
  });
});

describe('generateRoomCode', () => {
  it('draws the first character when the random function returns zero', () => {
    expect(generateRoomCode(() => 0)).toBe('222222');
  });

  it('draws the last character when the random function nearly returns one', () => {
    expect(generateRoomCode(() => 0.999999)).toBe('ZZZZZZ');
  });

  it('returns six characters for a middling draw', () => {
    expect(generateRoomCode(() => 0.5)).toHaveLength(ROOM_CODE_LENGTH);
  });
});

describe('normalizeRoomCode', () => {
  it('upper-cases a lower-case code', () => {
    expect(normalizeRoomCode('abc234')).toBe('ABC234');
  });

  it('strips whitespace around the code', () => {
    expect(normalizeRoomCode('  ABC234 ')).toBe('ABC234');
  });

  it('strips whitespace inside the code', () => {
    expect(normalizeRoomCode('ABC 234')).toBe('ABC234');
  });
});

describe('isRoomCode', () => {
  it('accepts a generated code', () => {
    expect(isRoomCode(generateRoomCode())).toBe(true);
  });

  it('accepts a lower-case code', () => {
    expect(isRoomCode('abc234')).toBe(true);
  });

  it('rejects a code that is too short', () => {
    expect(isRoomCode('ABC23')).toBe(false);
  });

  it('rejects a code that is too long', () => {
    expect(isRoomCode('ABC2345')).toBe(false);
  });

  it('rejects a code with a look-alike character', () => {
    expect(isRoomCode('ABC23O')).toBe(false);
  });
});
