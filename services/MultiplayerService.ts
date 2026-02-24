import Peer, { DataConnection } from 'peerjs';

export interface Player {
    id: string;
    name: string;
    score: number;
    isHost: boolean;
    joinedAt: string;
}

export interface GameState {
    status: 'waiting' | 'playing' | 'finished';
    currentQuestionIndex: number;
    quizId?: string;
}

// Message Types
type Message =
    | { type: 'JOIN'; player: Player }
    | { type: 'GAME_STATE'; state: GameState }
    | { type: 'SCORE_UPDATE'; playerId: string; score: number }
    | { type: 'WELCOME'; players: Player[]; state: GameState; quizId?: string };

class MultiplayerService {
    private peer: Peer | null = null;
    private connections: DataConnection[] = []; // For Host: list of connected players
    private hostConnection: DataConnection | null = null; // For Client: connection to Host

    private isHost: boolean = false;
    private playerId: string | null = null;
    private playerName: string | null = null;
    private roomId: string | null = null;

    // Game State (Host Authority)
    private players: Player[] = [];
    private gameState: GameState = { status: 'waiting', currentQuestionIndex: 0 };

    // Callbacks
    private onPlayerJoinCallbacks: ((player: Player) => void)[] = [];
    private onGameStateChangeCallbacks: ((state: GameState) => void)[] = [];
    private onScoreUpdateCallbacks: ((playerId: string, score: number) => void)[] = [];

    constructor() { }



    // Generate a random Short ID for the room
    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // HOST: Create a room
    createRoom(name: string): Promise<string | null> {
        return new Promise((resolve) => {
            this.isHost = true;
            this.playerName = name;
            this.roomId = this.generateRoomId();
            // Try to request a specific ID from PeerJS (might be taken, but chance is low for random 6 chars)
            // Prefixing to avoid collisions with other random peers
            const peerId = `quizzy-${this.roomId}`;

            this.peer = new Peer(peerId);

            this.peer.on('open', (id) => {
                console.log('Host initialized with ID:', id);
                this.playerId = id;

                // Add self to players
                this.players = [{
                    id: 'host', // Use 'host' or local ID
                    name: name,
                    score: 0,
                    isHost: true,
                    joinedAt: new Date().toISOString()
                }];

                resolve(this.roomId);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                resolve(null);
            });

            this.peer.on('connection', (conn) => {
                this.handleHostConnection(conn);
            });
        });
    }

    // CLIENT: Join a room
    joinRoom(roomId: string, name: string): Promise<{ success: boolean; players?: Player[], gameState?: GameState, quizId?: string }> {
        return new Promise((resolve) => {
            this.isHost = false;
            this.playerName = name;
            this.roomId = roomId;
            this.peer = new Peer(); // Auto-generated ID for client

            this.peer.on('open', (id) => {
                this.playerId = id;
                const hostPeerId = `quizzy-${roomId}`;
                const conn = this.peer!.connect(hostPeerId);

                conn.on('open', () => {
                    this.hostConnection = conn;
                    // Send JOIN message
                    const myPlayer: Player = {
                        id: id,
                        name: name,
                        score: 0,
                        isHost: false,
                        joinedAt: new Date().toISOString()
                    };
                    conn.send({ type: 'JOIN', player: myPlayer });

                    // Handle incoming data
                    conn.on('data', (data) => this.handleClientData(data as Message));
                });

                // Wait for WELCOME message to confirm join
                this.peer!.on('connection', () => { }); // ignore incoming on client?

                // We need a timeout or a way to intercept the first WELCOME
                // For simplicity, we resolve true here and let the callback handle state updates
                // But strictly we should wait.

                // Hack: wait for welcome in data handler below, but resolving true for UI nav
                setTimeout(() => {
                    if (this.hostConnection?.open) resolve({ success: true, quizId: '' }); // quizId will come in update
                    else resolve({ success: false });
                }, 2000);
            });

            this.peer.on('error', (err) => {
                console.error('Join error:', err);
                resolve({ success: false });
            });
        });
    }

    // HOST Logic
    private handleHostConnection(conn: DataConnection) {
        this.connections.push(conn);

        conn.on('data', (data: any) => {
            const msg = data as Message;
            if (msg.type === 'JOIN') {
                // New player
                const newPlayer = { ...msg.player, isHost: false };
                // Avoid duplicates
                if (!this.players.find(p => p.id === newPlayer.id)) {
                    this.players.push(newPlayer);
                    this.notifyPlayerJoin(newPlayer);

                    // Send WELCOME to new player
                    conn.send({
                        type: 'WELCOME',
                        players: this.players,
                        state: this.gameState,
                        quizId: this.gameState.quizId
                    });

                    // Broadcast to others
                    this.broadcast({ type: 'JOIN', player: newPlayer }, conn.peer);
                }
            } else if (msg.type === 'SCORE_UPDATE') {
                // Update player score
                this.players = this.players.map(p => p.id === msg.playerId ? { ...p, score: msg.score } : p);
                this.notifyScoreUpdate(msg.playerId, msg.score);
                this.broadcast({ type: 'SCORE_UPDATE', playerId: msg.playerId, score: msg.score });
            }
        });
    }

    private broadcast(msg: Message, excludePeerId?: string) {
        this.connections.forEach(conn => {
            if (conn.peer !== excludePeerId && conn.open) {
                conn.send(msg);
            }
        });
    }

    // CLIENT Logic
    private handleClientData(msg: Message) {
        if (msg.type === 'WELCOME') {
            // Initial sync
            this.players = msg.players;
            this.gameState = msg.state;
            msg.players.forEach(p => this.notifyPlayerJoin(p)); // Just to update UI ? or setAll
            this.notifyGameStateChange(msg.state);
        } else if (msg.type === 'JOIN') {
            this.notifyPlayerJoin(msg.player);
        } else if (msg.type === 'GAME_STATE') {
            this.notifyGameStateChange(msg.state);
        } else if (msg.type === 'SCORE_UPDATE') {
            this.notifyScoreUpdate(msg.playerId, msg.score);
        }
    }

    // PUBLIC METHODS

    startGame(quizId?: string) {
        if (this.isHost) {
            this.gameState = { ...this.gameState, status: 'playing', quizId };
            this.notifyGameStateChange(this.gameState);
            this.broadcast({ type: 'GAME_STATE', state: this.gameState });
        }
    }

    updateScore(score: number) {
        if (this.isHost) {
            // Host updates own score
            this.players = this.players.map(p => p.isHost ? { ...p, score } : p);
            this.notifyScoreUpdate('host', score);
            this.broadcast({ type: 'SCORE_UPDATE', playerId: 'host', score });
        } else {
            // Client sends update to host
            if (this.hostConnection?.open) {
                this.hostConnection.send({ type: 'SCORE_UPDATE', playerId: this.playerId!, score });
            }
        }
    }



    // State Getters
    getPlayers(): Player[] {
        return this.players;
    }

    getGameState(): GameState {
        return this.gameState;
    }

    // Listener management
    onPlayerJoin(callback: (player: Player) => void) {
        this.onPlayerJoinCallbacks.push(callback);
    }

    onGameStateChange(callback: (state: GameState) => void) {
        this.onGameStateChangeCallbacks.push(callback);
    }

    onScoreUpdate(callback: (playerId: string, score: number) => void) {
        this.onScoreUpdateCallbacks.push(callback);
    }

    private notifyPlayerJoin(player: Player) {
        this.onPlayerJoinCallbacks.forEach(cb => cb(player));
    }

    private notifyGameStateChange(state: GameState) {
        this.onGameStateChangeCallbacks.forEach(cb => cb(state));
    }

    private notifyScoreUpdate(playerId: string, score: number) {
        this.onScoreUpdateCallbacks.forEach(cb => cb(playerId, score));
    }
}

export const multiplayerService = new MultiplayerService();
