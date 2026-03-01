import { getStore } from "@netlify/blobs";

// Types
interface PresenceUser {
    peerId: string;
    name: string;
    lastSeen: number;
    roomCode?: string;
}

interface IncomingInvite {
    fromPeerId: string;
    fromName: string;
    roomId: string; // The PeerJS room ID created by the host
    timestamp: number;
}

interface LobbyState {
    users: Record<string, PresenceUser>;
    invites: Record<string, IncomingInvite[]>; // Target PeerId -> Array of invites
}

const LOBBY_BLOB_KEY = "global-lobby-state";
const TIMEOUT_MS = 20000; // Drop users hasn't pinged in 20s

// Fallback for local testing without `netlify link`
let localDevState: LobbyState | null = null;

export const handler = async (event: any, context: any) => {
    // CORS Headers for local dev and Netlify
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    try {
        let store: any = null;
        let isLocalConfigured = false;

        try {
            store = getStore("quizzy-multiplayer");
            isLocalConfigured = true;
        } catch (e: any) {
            console.warn("Using local in-memory fallback for Netlify Blobs.");
        }

        // Parse request
        const body = JSON.parse(event.body || "{}");
        const { action, peerId, name, targetPeerId, roomId, roomCode } = body;

        let state: LobbyState;

        if (isLocalConfigured) {
            let stateRaw = await store.get(LOBBY_BLOB_KEY);
            let stateString: string | null = null;

            if (stateRaw) {
                if (typeof stateRaw === 'string') {
                    stateString = stateRaw;
                } else if (stateRaw instanceof ArrayBuffer) {
                    stateString = new TextDecoder().decode(stateRaw);
                }
            }
            state = stateString ? JSON.parse(stateString) : { users: {}, invites: {} };
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
            const validInvites = userInvites.filter((inv) => now - inv.timestamp < 60000);
            if (validInvites.length !== userInvites.length) {
                state.invites[tPeerId] = validInvites;
                stateChanged = true;
            }
        }

        // Process actions
        switch (action) {
            case "heartbeat":
                if (peerId && name) {
                    state.users[peerId] = { peerId, name, lastSeen: now, roomCode };
                    stateChanged = true;
                }
                break;

            case "invite":
                if (peerId && name && targetPeerId && roomId) {
                    if (!state.invites[targetPeerId]) {
                        state.invites[targetPeerId] = [];
                    }
                    // Prevent duplicate invites from same person within short window
                    const existing = state.invites[targetPeerId].find(i => i.fromPeerId === peerId);
                    if (!existing) {
                        state.invites[targetPeerId].push({
                            fromPeerId: peerId,
                            fromName: name,
                            roomId,
                            timestamp: now
                        });
                        stateChanged = true;
                    }
                }
                break;

            case "remove_invite":
                if (peerId && roomId) {
                    if (state.invites[peerId]) {
                        const oldLen = state.invites[peerId].length;
                        state.invites[peerId] = state.invites[peerId].filter(i => i.roomId !== roomId);
                        if (state.invites[peerId].length !== oldLen) {
                            stateChanged = true;
                        }
                    }
                }
                break;

            case "leave":
                if (peerId) {
                    delete state.users[peerId];
                    delete state.invites[peerId];
                    stateChanged = true;
                }
                break;

            default:
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid action" }) };
        }

        // 3. Save state back if changed
        if (stateChanged) {
            if (isLocalConfigured) {
                await store.setJSON(LOBBY_BLOB_KEY, state);
            } else {
                localDevState = state;
            }
        }

        // 4. Return the data the client needs
        // Client wants to know: 1) Who is online (except them), 2) Do they have invites
        const activeUsers = Object.values(state.users).filter((u) => u.peerId !== peerId);
        const myInvites = state.invites[peerId] || [];

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                users: activeUsers,
                invites: myInvites,
            }),
        };

    } catch (error: any) {
        console.error("Lobby API Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};
