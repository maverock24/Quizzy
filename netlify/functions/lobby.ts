import { getStore } from '@netlify/blobs';
import {
  MAX_USERS,
  isAuthorised,
  isPeerId,
  isRoomCode,
  mintSecret,
  publicUsers,
  resolveCors,
  sanitiseName,
  type LobbyUser,
} from '../../services/lobbyRules';

// Types
interface IncomingInvite {
  fromPeerId: string;
  fromName: string;
  roomId: string; // The PeerJS room ID created by the host
  timestamp: number;
}

interface LobbyState {
  users: Record<string, LobbyUser>;
  invites: Record<string, IncomingInvite[]>; // Target PeerId -> Array of invites
}

const LOBBY_BLOB_KEY = 'global-lobby-state';
const TIMEOUT_MS = 20000; // Drop users hasn't pinged in 20s

// Fallback for local testing without `netlify link`
let localDevState: LobbyState | null = null;

/** A response body that the client reads, so it is always JSON. */
type Json = Record<string, unknown>;

export const handler = async (event: {
  httpMethod?: string;
  body?: string | null;
  headers?: Record<string, string | undefined>;
}) => {
  // CORS: the allowed pages only, and no header at all for anybody else.
  const headers = resolveCors(
    event.headers?.origin ?? event.headers?.Origin ?? undefined,
  );

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  // A body that is not JSON is the caller's mistake, not the server's, so it
  // is a 400 and never reaches the catch that answers 500.
  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid body' }),
    };
  }

  const { action, peerId, name, targetPeerId, roomId, roomCode, secret } =
    body as Json;

  try {
    let store: ReturnType<typeof getStore> | null = null;
    let isLocalConfigured = false;

    try {
      store = getStore('quizzy-multiplayer');
      isLocalConfigured = true;
    } catch {
      console.warn('Using local in-memory fallback for Netlify Blobs.');
    }

    let state: LobbyState;

    if (isLocalConfigured) {
      const stateRaw = await store!.get(LOBBY_BLOB_KEY);
      let stateString: string | null = null;

      if (stateRaw) {
        if (typeof stateRaw === 'string') {
          stateString = stateRaw;
        } else if (stateRaw instanceof ArrayBuffer) {
          stateString = new TextDecoder().decode(stateRaw);
        }
      }
      state = stateString
        ? JSON.parse(stateString)
        : { users: {}, invites: {} };
    } else {
      state = localDevState || { users: {}, invites: {} };
    }

    const now = Date.now();
    let stateChanged = false;

    // 1. Cleanup old users
    for (const [key, user] of Object.entries(state.users)) {
      if (now - user.lastSeen > TIMEOUT_MS) {
        delete state.users[key];
        // also cleanup their invites if they drop
        delete state.invites[key];
        stateChanged = true;
      }
    }

    // 2. Cleanup expired invites (older than 60 seconds)
    for (const [tPeerId, userInvites] of Object.entries(state.invites)) {
      const validInvites = userInvites.filter(
        (inv) => now - inv.timestamp < 60000,
      );
      if (validInvites.length !== userInvites.length) {
        state.invites[tPeerId] = validInvites;
        stateChanged = true;
      }
    }

    if (!isPeerId(peerId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing peer id' }),
      };
    }

    const stored = state.users[peerId];

    // A heartbeat with no stored user is how a peer registers: the secret is
    // minted now and returned only in this caller's response. Everything else
    // has to prove it owns the peer id it names.
    if (action !== 'heartbeat' && !isAuthorised(stored, secret)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Not authorised' }),
      };
    }

    let mintedSecret: string | undefined;

    // Process actions
    switch (action) {
      case 'heartbeat': {
        const cleanName = sanitiseName(name);
        if (cleanName === null) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid name' }),
          };
        }
        if (stored) {
          if (!isAuthorised(stored, secret)) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Not authorised' }),
            };
          }
        } else if (Object.keys(state.users).length >= MAX_USERS) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Lobby is full' }),
          };
        } else {
          mintedSecret = mintSecret();
        }
        state.users[peerId] = {
          peerId,
          name: cleanName,
          lastSeen: now,
          roomCode: isRoomCode(roomCode) ? roomCode : undefined,
          secret: stored?.secret ?? mintedSecret ?? '',
        };
        stateChanged = true;
        break;
      }

      case 'invite': {
        const cleanName = sanitiseName(name);
        if (cleanName === null || !isPeerId(targetPeerId)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid invite' }),
          };
        }
        if (!isRoomCode(roomId)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid room code' }),
          };
        }
        if (!state.invites[targetPeerId]) {
          state.invites[targetPeerId] = [];
        }
        // Prevent duplicate invites from same person within short window
        const existing = state.invites[targetPeerId].find(
          (i) => i.fromPeerId === peerId,
        );
        if (!existing) {
          state.invites[targetPeerId].push({
            fromPeerId: peerId,
            fromName: cleanName,
            roomId,
            timestamp: now,
          });
          stateChanged = true;
        }
        break;
      }

      case 'remove_invite': {
        if (!isRoomCode(roomId)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Invalid room code' }),
          };
        }
        if (state.invites[peerId]) {
          const oldLen = state.invites[peerId].length;
          state.invites[peerId] = state.invites[peerId].filter(
            (i) => i.roomId !== roomId,
          );
          if (state.invites[peerId].length !== oldLen) {
            stateChanged = true;
          }
        }
        break;
      }

      case 'leave': {
        delete state.users[peerId];
        delete state.invites[peerId];
        stateChanged = true;
        break;
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' }),
        };
    }

    // 3. Save state back if changed
    if (stateChanged) {
      if (isLocalConfigured) {
        await store!.setJSON(LOBBY_BLOB_KEY, state);
      } else {
        localDevState = state;
      }
    }

    // 4. Return the data the client needs. The users list is public, so it
    // carries no room code and no secret. The secret is only ever echoed to
    // the caller that owns the peer id.
    const myInvites = state.invites[peerId] || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        users: publicUsers(state.users, peerId),
        invites: myInvites,
        ...(mintedSecret ? { secret: mintedSecret } : {}),
      }),
    };
  } catch (error: unknown) {
    console.error('Lobby API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
