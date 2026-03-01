import { Platform } from 'react-native';
import { Player } from './MultiplayerService';

let LOBBY_API_URL = '/.netlify/functions/lobby';

if (__DEV__) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Route directly to Netlify dev server proxy on port 8888
        LOBBY_API_URL = `${window.location.protocol}//${window.location.hostname}:8888/.netlify/functions/lobby`;
    } else {
        LOBBY_API_URL = Platform.OS === 'android'
            ? 'http://10.0.2.2:8888/.netlify/functions/lobby'
            : 'http://localhost:8888/.netlify/functions/lobby';
    }
}

export interface PresenceUser {
    peerId: string;
    name: string;
    lastSeen: number;
    roomCode?: string;
}

export interface IncomingInvite {
    fromPeerId: string;
    fromName: string;
    roomId: string;
    timestamp: number;
}

class PresenceService {
    private currentUsers: PresenceUser[] = [];
    private currentInvites: IncomingInvite[] = [];

    private onUsersChangeCallbacks: ((users: PresenceUser[]) => void)[] = [];
    private onInviteReceivedCallbacks: ((invite: IncomingInvite) => void)[] = [];

    private myPeerId: string | null = null;
    private myName: string | null = null;
    private myRoomCode: string | null = null;

    private pollInterval: NodeJS.Timeout | null = null;
    private isPolling = false;

    connect(peerId: string, name: string) {
        this.myPeerId = peerId;
        this.myName = name;
        this.startPolling();
    }

    disconnect() {
        this.stopPolling();
        this.leaveLobby();

        this.myPeerId = null;
        this.myName = null;
        this.myRoomCode = null;
        this.currentUsers = [];
        this.currentInvites = [];
        this.notifyUsersChange();
    }

    updateName(name: string) {
        if (this.myName !== name) {
            this.myName = name;
            if (this.isPolling) {
                this.poll();
            }
        }
    }

    setRoomCode(roomCode: string | null) {
        if (this.myRoomCode !== roomCode) {
            this.myRoomCode = roomCode;
            if (this.isPolling) {
                this.poll();
            }
        }
    }

    startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;

        // Immediate first poll
        this.poll();

        // Poll every 10 seconds
        this.pollInterval = setInterval(() => {
            this.poll();
        }, 10000);
    }

    stopPolling() {
        this.isPolling = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    private async poll() {
        if (!this.myPeerId || !this.myName) return;

        try {
            const response = await fetch(LOBBY_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'heartbeat',
                    peerId: this.myPeerId,
                    name: this.myName,
                    roomCode: this.myRoomCode,
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            this.processIncomingData(data);
        } catch (error) {
            console.warn("Lobby poll failed:", error);
        }
    }

    async sendInvite(targetPeerId: string, roomId: string) {
        if (!this.myPeerId || !this.myName) return;

        try {
            const response = await fetch(LOBBY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'invite',
                    peerId: this.myPeerId,
                    name: this.myName,
                    targetPeerId,
                    roomId,
                }),
            });
            // Await success, optionally trigger local state
            if (response.ok) {
                console.log("Invite sent to", targetPeerId);
            }
        } catch (error) {
            console.error("Failed to send invite", error);
        }
    }

    async removeInvite(roomId: string) {
        if (!this.myPeerId) return;

        // Update local immediately for UX
        this.currentInvites = this.currentInvites.filter(i => i.roomId !== roomId);

        try {
            await fetch(LOBBY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'remove_invite',
                    peerId: this.myPeerId,
                    roomId,
                }),
            });
        } catch (error) {
            console.error("Failed to remove invite", error);
        }
    }

    private async leaveLobby() {
        if (!this.myPeerId) return;
        try {
            // Best effort fire-and-forget
            fetch(LOBBY_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    action: 'leave',
                    peerId: this.myPeerId,
                }),
            }).catch(() => { });
        } catch (e) { }
    }

    private processIncomingData(data: { users: PresenceUser[], invites: IncomingInvite[] }) {
        // 1. Update Users
        this.currentUsers = data.users || [];
        this.notifyUsersChange();

        // 2. Process new invites
        const incInvites = data.invites || [];
        const newInvites = incInvites.filter(
            inc => !this.currentInvites.some(cur => cur.roomId === inc.roomId)
        );

        this.currentInvites = incInvites;

        // Trigger callbacks for truly new invites
        for (const invite of newInvites) {
            this.notifyInviteReceived(invite);
        }
    }

    getUsers(): PresenceUser[] {
        return this.currentUsers;
    }

    // Listener management
    onUsersChange(callback: (users: PresenceUser[]) => void) {
        this.onUsersChangeCallbacks.push(callback);
        callback(this.getUsers());
    }

    offUsersChange(callback: (users: PresenceUser[]) => void) {
        this.onUsersChangeCallbacks = this.onUsersChangeCallbacks.filter(cb => cb !== callback);
    }

    onInviteReceived(callback: (invite: IncomingInvite) => void) {
        this.onInviteReceivedCallbacks.push(callback);
    }

    offInviteReceived(callback: (invite: IncomingInvite) => void) {
        this.onInviteReceivedCallbacks = this.onInviteReceivedCallbacks.filter(cb => cb !== callback);
    }

    private notifyUsersChange() {
        const users = this.getUsers();
        this.onUsersChangeCallbacks.forEach(cb => cb(users));
    }

    private notifyInviteReceived(invite: IncomingInvite) {
        this.onInviteReceivedCallbacks.forEach(cb => cb(invite));
    }
}

export const presenceService = new PresenceService();
