import Peer, { DataConnection } from 'peerjs';

export interface Player {
    id: string;
    name: string;
    score: number;
    isHost: boolean;
    joinedAt: string;
    progress: number;      // current question index
    totalQuestions: number; // total questions in quiz
    finished: boolean;
    finishTime?: number;   // ms elapsed from game start
}

export interface GameState {
    status: 'waiting' | 'playing' | 'finished';
    currentQuestionIndex: number;
    quizId?: string;
    startTime?: number; // timestamp when game started
}

// Message Types
type Message =
    | { type: 'JOIN'; player: Player }
    | { type: 'GAME_STATE'; state: GameState }
    | { type: 'SCORE_UPDATE'; playerId: string; score: number }
    | { type: 'WELCOME'; players: Player[]; state: GameState; quizId?: string }
    | { type: 'QUIZ_SELECT'; quizId: string }
    | { type: 'PLAYER_PROGRESS'; playerId: string; progress: number; totalQuestions: number }
    | { type: 'PLAYER_FINISH'; playerId: string; score: number; finishTime: number }
    | { type: 'PLAYER_LEFT'; playerId: string };

class MultiplayerService {
    private peer: Peer | null = null;
    private connections: DataConnection[] = [];
    private hostConnection: DataConnection | null = null;

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
    private onQuizSelectCallbacks: ((quizId: string) => void)[] = [];
    private onPlayerProgressCallbacks: ((playerId: string, progress: number, totalQuestions: number) => void)[] = [];
    private onPlayerFinishCallbacks: ((playerId: string, score: number, finishTime: number) => void)[] = [];
    private onPlayerLeftCallbacks: ((playerId: string) => void)[] = [];

    constructor() { }

    /** Clean up all peer connections and reset state */
    destroy() {
        if (this.hostConnection) {
            this.hostConnection.close();
            this.hostConnection = null;
        }
        this.connections.forEach(conn => {
            try { conn.close(); } catch (e) { /* ignore */ }
        });
        this.connections = [];
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) { /* ignore */ }
            this.peer = null;
        }
        this.players = [];
        this.gameState = { status: 'waiting', currentQuestionIndex: 0 };
        this.isHost = false;
        this.playerId = null;
        this.playerName = null;
        this.roomId = null;
        this.removeAllListeners();
    }

    /** Remove all registered callbacks to prevent leaks */
    removeAllListeners() {
        this.onPlayerJoinCallbacks = [];
        this.onGameStateChangeCallbacks = [];
        this.onScoreUpdateCallbacks = [];
        this.onQuizSelectCallbacks = [];
        this.onPlayerProgressCallbacks = [];
        this.onPlayerFinishCallbacks = [];
        this.onPlayerLeftCallbacks = [];
    }

    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // HOST: Create a room
    createRoom(name: string): Promise<string | null> {
        return new Promise((resolve) => {
            // Clean up any previous session
            this.destroy();

            this.isHost = true;
            this.playerName = name;
            this.roomId = this.generateRoomId();
            const peerId = `quizzy-${this.roomId}`;

            this.peer = new Peer(peerId);

            this.peer.on('open', (id) => {
                console.log('Host initialized with ID:', id);
                this.playerId = id;

                this.players = [{
                    id: 'host',
                    name: name,
                    score: 0,
                    isHost: true,
                    joinedAt: new Date().toISOString(),
                    progress: 0,
                    totalQuestions: 0,
                    finished: false,
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

    // CLIENT: Join a room — waits for actual WELCOME message
    joinRoom(roomId: string, name: string): Promise<{ success: boolean; players?: Player[]; gameState?: GameState; quizId?: string }> {
        return new Promise((resolve) => {
            // Clean up any previous session
            this.destroy();

            this.isHost = false;
            this.playerName = name;
            this.roomId = roomId;
            this.peer = new Peer();

            let resolved = false;

            this.peer.on('open', (id) => {
                this.playerId = id;
                const hostPeerId = `quizzy-${roomId}`;
                const conn = this.peer!.connect(hostPeerId);

                conn.on('open', () => {
                    this.hostConnection = conn;

                    const myPlayer: Player = {
                        id: id,
                        name: name,
                        score: 0,
                        isHost: false,
                        joinedAt: new Date().toISOString(),
                        progress: 0,
                        totalQuestions: 0,
                        finished: false,
                    };
                    conn.send({ type: 'JOIN', player: myPlayer });

                    // Handle incoming data — resolve on WELCOME
                    conn.on('data', (data) => {
                        const msg = data as Message;
                        if (msg.type === 'WELCOME' && !resolved) {
                            resolved = true;
                            this.players = msg.players;
                            this.gameState = msg.state;
                            resolve({
                                success: true,
                                players: msg.players,
                                gameState: msg.state,
                                quizId: msg.quizId,
                            });
                        }
                        this.handleClientData(msg);
                    });

                    conn.on('close', () => {
                        console.log('Connection to host lost');
                        this.onPlayerLeftCallbacks.forEach(cb => cb('host'));
                    });
                });

                conn.on('error', (err) => {
                    console.error('Connection error:', err);
                    if (!resolved) {
                        resolved = true;
                        resolve({ success: false });
                    }
                });

                // Timeout fallback
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve({ success: false });
                    }
                }, 8000);
            });

            this.peer.on('error', (err) => {
                console.error('Join error:', err);
                if (!resolved) {
                    resolved = true;
                    resolve({ success: false });
                }
            });
        });
    }

    // HOST Logic
    private handleHostConnection(conn: DataConnection) {
        this.connections.push(conn);

        conn.on('data', (data: any) => {
            const msg = data as Message;
            if (msg.type === 'JOIN') {
                const newPlayer = { ...msg.player, isHost: false };
                if (!this.players.find(p => p.id === newPlayer.id)) {
                    this.players.push(newPlayer);
                    this.notifyPlayerJoin(newPlayer);

                    // Send WELCOME to new player
                    conn.send({
                        type: 'WELCOME',
                        players: this.players,
                        state: this.gameState,
                        quizId: this.gameState.quizId,
                    });

                    // Broadcast new player to others
                    this.broadcast({ type: 'JOIN', player: newPlayer }, conn.peer);
                }
            } else if (msg.type === 'SCORE_UPDATE') {
                this.players = this.players.map(p => p.id === msg.playerId ? { ...p, score: msg.score } : p);
                this.notifyScoreUpdate(msg.playerId, msg.score);
                this.broadcast({ type: 'SCORE_UPDATE', playerId: msg.playerId, score: msg.score });
            } else if (msg.type === 'PLAYER_PROGRESS') {
                this.players = this.players.map(p =>
                    p.id === msg.playerId ? { ...p, progress: msg.progress, totalQuestions: msg.totalQuestions } : p
                );
                this.onPlayerProgressCallbacks.forEach(cb => cb(msg.playerId, msg.progress, msg.totalQuestions));
                this.broadcast(msg, conn.peer);
            } else if (msg.type === 'PLAYER_FINISH') {
                this.players = this.players.map(p =>
                    p.id === msg.playerId ? { ...p, finished: true, score: msg.score, finishTime: msg.finishTime } : p
                );
                this.onPlayerFinishCallbacks.forEach(cb => cb(msg.playerId, msg.score, msg.finishTime));
                this.broadcast(msg, conn.peer);
            }
        });

        conn.on('close', () => {
            this.connections = this.connections.filter(c => c.peer !== conn.peer);
            const leftPlayer = this.players.find(p => p.id === conn.peer || (!p.isHost && this.connections.every(c => c.peer !== p.id)));
            if (leftPlayer) {
                this.onPlayerLeftCallbacks.forEach(cb => cb(leftPlayer.id));
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
        switch (msg.type) {
            case 'WELCOME':
                // Already handled in joinRoom resolve — but update state in case of reconnect
                this.players = msg.players;
                this.gameState = msg.state;
                msg.players.forEach(p => this.notifyPlayerJoin(p));
                this.notifyGameStateChange(msg.state);
                break;
            case 'JOIN':
                if (!this.players.find(p => p.id === msg.player.id)) {
                    this.players.push(msg.player);
                }
                this.notifyPlayerJoin(msg.player);
                break;
            case 'GAME_STATE':
                this.gameState = msg.state;
                this.notifyGameStateChange(msg.state);
                break;
            case 'SCORE_UPDATE':
                this.players = this.players.map(p => p.id === msg.playerId ? { ...p, score: msg.score } : p);
                this.notifyScoreUpdate(msg.playerId, msg.score);
                break;
            case 'QUIZ_SELECT':
                this.onQuizSelectCallbacks.forEach(cb => cb(msg.quizId));
                break;
            case 'PLAYER_PROGRESS':
                this.players = this.players.map(p =>
                    p.id === msg.playerId ? { ...p, progress: msg.progress, totalQuestions: msg.totalQuestions } : p
                );
                this.onPlayerProgressCallbacks.forEach(cb => cb(msg.playerId, msg.progress, msg.totalQuestions));
                break;
            case 'PLAYER_FINISH':
                this.players = this.players.map(p =>
                    p.id === msg.playerId ? { ...p, finished: true, score: msg.score, finishTime: msg.finishTime } : p
                );
                this.onPlayerFinishCallbacks.forEach(cb => cb(msg.playerId, msg.score, msg.finishTime));
                break;
            case 'PLAYER_LEFT':
                this.onPlayerLeftCallbacks.forEach(cb => cb(msg.playerId));
                break;
        }
    }

    // PUBLIC METHODS

    startGame(quizId?: string) {
        if (this.isHost) {
            const startTime = Date.now();
            this.gameState = { ...this.gameState, status: 'playing', quizId, startTime };
            this.notifyGameStateChange(this.gameState);
            this.broadcast({ type: 'GAME_STATE', state: this.gameState });
        }
    }

    selectQuiz(quizId: string) {
        if (this.isHost) {
            this.gameState = { ...this.gameState, quizId };
            this.broadcast({ type: 'QUIZ_SELECT', quizId });
        }
    }

    updateScore(score: number) {
        if (this.isHost) {
            this.players = this.players.map(p => p.isHost ? { ...p, score } : p);
            this.notifyScoreUpdate('host', score);
            this.broadcast({ type: 'SCORE_UPDATE', playerId: 'host', score });
        } else if (this.hostConnection?.open) {
            this.hostConnection.send({ type: 'SCORE_UPDATE', playerId: this.playerId!, score });
        }
    }

    updateProgress(progress: number, totalQuestions: number) {
        const playerId = this.isHost ? 'host' : this.playerId!;
        if (this.isHost) {
            this.players = this.players.map(p => p.isHost ? { ...p, progress, totalQuestions } : p);
            this.onPlayerProgressCallbacks.forEach(cb => cb('host', progress, totalQuestions));
            this.broadcast({ type: 'PLAYER_PROGRESS', playerId: 'host', progress, totalQuestions });
        } else if (this.hostConnection?.open) {
            this.hostConnection.send({ type: 'PLAYER_PROGRESS', playerId: this.playerId!, progress, totalQuestions });
        }
    }

    finishGame(score: number) {
        const playerId = this.isHost ? 'host' : this.playerId!;
        const finishTime = this.gameState.startTime ? Date.now() - this.gameState.startTime : 0;

        if (this.isHost) {
            this.players = this.players.map(p =>
                p.isHost ? { ...p, finished: true, score, finishTime } : p
            );
            this.onPlayerFinishCallbacks.forEach(cb => cb('host', score, finishTime));
            this.broadcast({ type: 'PLAYER_FINISH', playerId: 'host', score, finishTime });
        } else if (this.hostConnection?.open) {
            this.hostConnection.send({ type: 'PLAYER_FINISH', playerId: this.playerId!, score, finishTime });
        }
    }

    // State Getters
    getPlayers(): Player[] { return this.players; }
    getGameState(): GameState { return this.gameState; }
    getIsHost(): boolean { return this.isHost; }
    getPlayerId(): string | null { return this.isHost ? 'host' : this.playerId; }

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
    onQuizSelect(callback: (quizId: string) => void) {
        this.onQuizSelectCallbacks.push(callback);
    }
    onPlayerProgress(callback: (playerId: string, progress: number, totalQuestions: number) => void) {
        this.onPlayerProgressCallbacks.push(callback);
    }
    onPlayerFinish(callback: (playerId: string, score: number, finishTime: number) => void) {
        this.onPlayerFinishCallbacks.push(callback);
    }
    onPlayerLeft(callback: (playerId: string) => void) {
        this.onPlayerLeftCallbacks.push(callback);
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
