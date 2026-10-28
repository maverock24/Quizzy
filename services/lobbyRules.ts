/**
 * The lobby's decisions, kept out of the Netlify handler so they can be tested
 * without a blob store. This module has no imports on purpose: the function is
 * bundled by esbuild, which resolves a relative path but not the `@/` alias.
 */

/** The only pages allowed to call the lobby, and nothing else. */
export const ALLOWED_ORIGINS = [
  'https://quizzy-2504.netlify.app',
  'http://localhost:8081',
];

export interface LobbyUser {
  peerId: string;
  name: string;
  lastSeen: number;
  roomCode?: string;
  /** Minted by the server, returned only to the caller that owns the id. */
  secret?: string;
}

/** The fields of a user that every other caller may see. */
export interface PublicUser {
  peerId: string;
  name: string;
  lastSeen: number;
}

export const MAX_NAME_LENGTH = 24;
export const MAX_USERS = 200;
export const MAX_PEER_ID_LENGTH = 128;

/** The alphabet `generateRoomCode` draws from, so a code has no look-alikes. */
const ROOM_CODE_PATTERN = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;

/**
 * An allow-list, not a wildcard: a page somebody else controls must not be
 * able to read the lobby, so an origin that is not on the list gets no CORS
 * header at all. `Vary` keeps a cache from serving one origin's answer to
 * another.
 */
export function resolveCors(origin: unknown): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

/**
 * 32 hex characters of randomness. `crypto` is the source where the runtime
 * has one; the fallback keeps a local `netlify dev` without it working.
 */
export function mintSecret(): string {
  const bytes = new Uint8Array(16);
  const webcrypto = globalThis.crypto;
  if (webcrypto && typeof webcrypto.getRandomValues === 'function') {
    webcrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * A request may only act for a peer it can prove it owns. A peer with no
 * stored secret, or no secret at all, is refused.
 */
export function isAuthorised(
  user: LobbyUser | undefined | null,
  secret: unknown,
): boolean {
  if (!user || typeof user.secret !== 'string' || user.secret === '') {
    return false;
  }
  if (typeof secret !== 'string' || secret === '') {
    return false;
  }
  return user.secret === secret;
}

/** A name is capped and trimmed, and a value that is not a name is refused. */
export function sanitiseName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  return trimmed.slice(0, MAX_NAME_LENGTH);
}

/** A peer id is an opaque key, so it is only required to be a sane string. */
export function isPeerId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_PEER_ID_LENGTH
  );
}

/** A room id is the six-character code the host registers, nothing else. */
export function isRoomCode(value: unknown): value is string {
  return typeof value === 'string' && ROOM_CODE_PATTERN.test(value);
}

/**
 * What the lobby hands to everybody else: never a room code, because that
 * would let any caller join a waiting room without an invite, and never a
 * secret, because that would let any caller act as its owner.
 */
export function publicUsers(
  users: Record<string, LobbyUser>,
  exceptPeerId?: string,
): PublicUser[] {
  return Object.values(users)
    .filter((user) => user.peerId !== exceptPeerId)
    .map((user) => ({
      peerId: user.peerId,
      name: user.name,
      lastSeen: user.lastSeen,
    }));
}
