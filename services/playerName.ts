/** The name a multiplayer screen should show before the player types one. */

/** Trims a value and treats a missing one as absent. */
const normalize = (value?: string | null): string =>
  typeof value === 'string' ? value.trim() : '';

/**
 * What the name field starts with: the name last played with, else the profile
 * name, else empty. An all-space value counts as absent, so a stray blank can
 * never hide a real name behind it.
 */
export function resolveInitialName(
  remembered?: string | null,
  profileName?: string | null,
): string {
  return normalize(remembered) || normalize(profileName);
}

/**
 * A name is playable when it has at least one non-space character, matching
 * the guard the multiplayer screens use before creating or joining a room.
 */
export function isPlayableName(name: string): boolean {
  return normalize(name).length > 0;
}

/**
 * What to remember after a game action succeeded, or null when there is
 * nothing worth keeping. Returning null lets the caller skip the write, so a
 * blank name can never overwrite a good one.
 */
export function nameToRemember(name: string): string | null {
  const trimmed = normalize(name);
  return trimmed === '' ? null : trimmed;
}
