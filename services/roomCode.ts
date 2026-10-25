export const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export const ROOM_CODE_LENGTH = 6;

/**
 * Draws exactly ROOM_CODE_LENGTH characters, so a code can never come back
 * short. The index is clamped so a random function that returns 1 is safe.
 */
export function generateRoomCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const index = Math.min(
      ROOM_CODE_ALPHABET.length - 1,
      Math.floor(random() * ROOM_CODE_ALPHABET.length),
    );
    code += ROOM_CODE_ALPHABET[index];
  }
  return code;
}

/** Strips all whitespace and upper-cases, so input is case-insensitive. */
export function normalizeRoomCode(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

export function isRoomCode(value: string): boolean {
  const code = normalizeRoomCode(value);
  if (code.length !== ROOM_CODE_LENGTH) {
    return false;
  }
  for (const char of code) {
    if (!ROOM_CODE_ALPHABET.includes(char)) {
      return false;
    }
  }
  return true;
}
