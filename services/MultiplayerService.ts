import Peer, { DataConnection } from 'peerjs';
import { generateRoomCode, isRoomCode, normalizeRoomCode } from './roomCode';
import {
  MultiplayerFailure,
  failureFromPeerError,
} from './multiplayerFailures';
import {
  isSenderAllowed,
  occupiedCount,
  findJoinTarget,
} from './multiplayerRules';
import { getSessionToken } from './sessionToken';
import type { QuizQuestion } from '../components/types';

const JOIN_TIMEOUT_MS = 8000;
const CREATE_TIMEOUT_MS = 10000;
const MAX_ROOM_CODE_ATTEMPTS = 3;
const REJOIN_GRACE_MS = 60000;

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  joinedAt: string;
  progress: number; // current question index
  totalQuestions: number; // total questions in quiz
  finished: boolean;
  finishTime?: number; // ms elapsed from game start
  left: boolean; // departed; skipped by results and counted out of the room
  token: string; // stable per session; the host matches it before the peer id
}

export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  quizId?: string;
  startTime?: number; // timestamp when game started
  // The host's copy of the quiz, so a joiner renders it without its own (D7)
  quiz?: { name: string; questions: QuizQuestion[] };
}

type JoinResult =
  | { ok: true; players: Player[]; gameState: GameState; quizId?: string }
  | { ok: false; failure: MultiplayerFailure };

type CreateResult =
  | { ok: true; code: string }
  | { ok: false; failure: MultiplayerFailure };

// Message Types
type Message =
  | { type: 'JOIN'; player: Player }
  | { type: 'GAME_STATE'; state: GameState }
  | { type: 'SCORE_UPDATE'; playerId: string; score: number }
  | { type: 'WELCOME'; players: Player[]; state: GameState; quizId?: string }
  | { type: 'QUIZ_SELECT'; quizId: string }
  | {
      type: 'PLAYER_PROGRESS';
      playerId: string;
      progress: number;
      totalQuestions: number;
    }
  | {
      type: 'PLAYER_FINISH';
      playerId: string;
      score: number;
      finishTime: number;
    }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'ROOM_FULL' };

class MultiplayerService {
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];
  private hostConnection: DataConnection | null = null;

  private isHost: boolean = false;
  private playerId: string | null = null;
  private playerName: string | null = null;
  private roomId: string | null = null;

  // A departed slot is held open for a rejoin until its grace timer fires.
  private graceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // Game State (Host Authority)
  private players: Player[] = [];
  private gameState: GameState = { status: 'waiting', currentQuestionIndex: 0 };

  // Callbacks
  private onPlayerJoinCallbacks: ((player: Player) => void)[] = [];
  private onGameStateChangeCallbacks: ((state: GameState) => void)[] = [];
  private onScoreUpdateCallbacks: ((
    playerId: string,
    score: number,
  ) => void)[] = [];
  private onQuizSelectCallbacks: ((quizId: string) => void)[] = [];
  private onPlayerProgressCallbacks: ((
    playerId: string,
    progress: number,
    totalQuestions: number,
  ) => void)[] = [];
  private onPlayerFinishCallbacks: ((
    playerId: string,
    score: number,
    finishTime: number,
  ) => void)[] = [];
  private onPlayerLeftCallbacks: ((playerId: string) => void)[] = [];

  constructor() {}

  /** Clean up all peer connections and reset state */
  destroy() {
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    this.connections.forEach((conn) => {
      try {
        conn.close();
      } catch (e) {
        /* ignore */
      }
    });
    this.connections = [];
    this.graceTimers.forEach((timer) => clearTimeout(timer));
    this.graceTimers.clear();
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {
        /* ignore */
      }
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

  // HOST: Create a room — retries a code that is already taken
  createRoom(name: string): Promise<CreateResult> {
    return new Promise((resolve) => {
      const attempt = (attemptsLeft: number) => {
        // Clean up any previous session
        this.destroy();

        this.isHost = true;
        this.playerName = name;

        const code = generateRoomCode();
        this.roomId = code;

        let settled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        const settle = (result: CreateResult) => {
          if (settled) {
            return;
          }
          settled = true;
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          resolve(result);
        };

        // Armed before the peer exists, so each attempt is bounded.
        timer = setTimeout(
          () => settle({ ok: false, failure: 'timeout' }),
          CREATE_TIMEOUT_MS,
        );
        const peerId = `quizzy-${code}`;

        this.peer = new Peer(peerId);

        this.peer.on('open', (id) => {
          console.log('Host initialized with ID:', id);
          this.playerId = id;

          this.players = [
            {
              id: 'host',
              name: name,
              score: 0,
              isHost: true,
              joinedAt: new Date().toISOString(),
              progress: 0,
              totalQuestions: 0,
              finished: false,
              left: false,
              token: '',
            },
          ];

          settle({ ok: true, code });
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          if (err.type === 'unavailable-id' && attemptsLeft > 1) {
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            this.peer?.destroy();
            attempt(attemptsLeft - 1);
            return;
          }
          settle({ ok: false, failure: failureFromPeerError(err.type) });
        });

        this.peer.on('connection', (conn) => {
          this.handleHostConnection(conn);
        });
      };

      attempt(MAX_ROOM_CODE_ATTEMPTS);
    });
  }

  // CLIENT: Join a room — waits for actual WELCOME message
  joinRoom(roomId: string, name: string): Promise<JoinResult> {
    const code = normalizeRoomCode(roomId);
    if (!isRoomCode(code)) {
      return Promise.resolve({ ok: false, failure: 'bad-code' });
    }

    return new Promise((resolve) => {
      let resolved = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      // The peer this call opens, so a late failure cannot destroy a newer
      // session's peer.
      let sessionPeer: Peer | null = null;

      const settle = (result: JoinResult) => {
        if (resolved) {
          return;
        }
        resolved = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (!result.ok) {
          // A refused or unanswered join leaves no session behind: drop the
          // peer so it does not stay registered on the signalling server.
          try {
            sessionPeer?.destroy();
          } catch (e) {
            /* ignore */
          }
          if (this.peer === sessionPeer) {
            this.peer = null;
          }
        }
        resolve(result);
      };

      // Clean up any previous session
      this.destroy();

      this.isHost = false;
      this.playerName = name;
      this.roomId = code;
      // Armed before the peer exists, so the wait is bounded by the call.
      timer = setTimeout(
        () => settle({ ok: false, failure: 'timeout' }),
        JOIN_TIMEOUT_MS,
      );
      this.peer = new Peer();
      sessionPeer = this.peer;

      this.peer.on('open', (id) => {
        this.playerId = id;
        const hostPeerId = `quizzy-${code}`;
        const conn = this.peer!.connect(hostPeerId, { reliable: true });

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
            left: false,
            token: getSessionToken(),
          };
          conn.send({ type: 'JOIN', player: myPlayer });

          // Handle incoming data — resolve on WELCOME
          conn.on('data', (data) => {
            const msg = data as Message;
            if (msg.type === 'ROOM_FULL') {
              // Refused by the host: the room already holds two players.
              settle({ ok: false, failure: 'room-full' });
            }
            if (msg.type === 'WELCOME') {
              this.players = msg.players;
              this.gameState = msg.state;
              settle({
                ok: true,
                players: msg.players,
                gameState: msg.state,
                quizId: msg.quizId,
              });
            }
            this.handleClientData(msg);
          });

          conn.on('close', () => {
            console.log('Connection to host lost');
            this.players = this.players.map((p) =>
              p.isHost ? { ...p, left: true } : p,
            );
            this.onPlayerLeftCallbacks.forEach((cb) => cb('host'));
          });
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          settle({ ok: false, failure: 'connect-failed' });
        });
      });

      this.peer.on('error', (err) => {
        console.error('Join error:', err);
        settle({ ok: false, failure: failureFromPeerError(err.type) });
      });
    });
  }

  // HOST Logic
  private handleHostConnection(conn: DataConnection) {
    this.connections.push(conn);

    conn.on('data', (data: unknown) => {
      const msg = data as Message;
      if (msg.type === 'JOIN') {
        const incoming = msg.player;
        // A message may only act on the sender's own slot (D5), so a join that
        // names any other id is dropped. The host's id is 'host', which no
        // connection can hold, so a client cannot claim the host's entry.
        if (!isSenderAllowed(incoming?.id, conn.peer)) {
          console.warn(
            'Dropped JOIN from ' + conn.peer + ' naming ' + incoming?.id,
          );
          return;
        }
        // The token is matched before the peer id, so a rejoin revives the
        // departed entry instead of adding a third player (D18).
        const target = findJoinTarget(
          this.players,
          incoming.token ?? '',
          incoming.id,
        );
        const previous = target === -1 ? null : this.players[target];
        // A departed slot that still holds its token occupies its place until
        // the grace runs out, so only a new entry or a slot that lost its
        // token has to be checked against the limit (D18).
        const needsSlot =
          previous === null ||
          (previous.left === true && (previous.token ?? '') === '');
        if (needsSlot && occupiedCount(this.players) >= 2) {
          conn.send({ type: 'ROOM_FULL' });
          conn.close();
          return;
        }

        let joined: Player;
        if (target === -1) {
          joined = { ...incoming, isHost: false, left: false };
          this.players = [...this.players, joined];
        } else {
          // Revive the old entry, so score, progress, totalQuestions,
          // finished and finishTime survive the rejoin.
          const departed = this.players[target];
          const timer = this.graceTimers.get(departed.id);
          if (timer) {
            clearTimeout(timer);
            this.graceTimers.delete(departed.id);
          }
          joined = {
            ...departed,
            id: incoming.id,
            name: incoming.name,
            token: incoming.token ?? '',
            left: false,
          };
          this.players = this.players.map((p, i) =>
            i === target ? joined : p,
          );
        }

        this.notifyPlayerJoin(joined);

        // Send WELCOME to the joining player
        conn.send({
          type: 'WELCOME',
          players: this.players,
          state: this.gameState,
          quizId: this.gameState.quizId,
        });

        // Broadcast the player to others
        this.broadcast({ type: 'JOIN', player: joined }, conn.peer);
      } else if (msg.type === 'SCORE_UPDATE') {
        if (!isSenderAllowed(msg.playerId, conn.peer)) {
          this.dropForeignUpdate(msg, conn);
          return;
        }
        this.players = this.players.map((p) =>
          p.id === msg.playerId ? { ...p, score: msg.score } : p,
        );
        this.notifyScoreUpdate(msg.playerId, msg.score);
        this.broadcast({
          type: 'SCORE_UPDATE',
          playerId: msg.playerId,
          score: msg.score,
        });
      } else if (msg.type === 'PLAYER_PROGRESS') {
        if (!isSenderAllowed(msg.playerId, conn.peer)) {
          this.dropForeignUpdate(msg, conn);
          return;
        }
        this.players = this.players.map((p) =>
          p.id === msg.playerId
            ? {
                ...p,
                progress: msg.progress,
                totalQuestions: msg.totalQuestions,
              }
            : p,
        );
        this.onPlayerProgressCallbacks.forEach((cb) =>
          cb(msg.playerId, msg.progress, msg.totalQuestions),
        );
        this.broadcast(msg, conn.peer);
      } else if (msg.type === 'PLAYER_FINISH') {
        if (!isSenderAllowed(msg.playerId, conn.peer)) {
          this.dropForeignUpdate(msg, conn);
          return;
        }
        this.players = this.players.map((p) =>
          p.id === msg.playerId
            ? {
                ...p,
                finished: true,
                score: msg.score,
                finishTime: msg.finishTime,
              }
            : p,
        );
        this.onPlayerFinishCallbacks.forEach((cb) =>
          cb(msg.playerId, msg.score, msg.finishTime),
        );
        this.broadcast(msg, conn.peer);
      }
    });

    conn.on('close', () => {
      this.connections = this.connections.filter((c) => c.peer !== conn.peer);
      const index = this.players.findIndex((p) => p.id === conn.peer);
      if (index === -1) {
        // A connection that never got a slot (a refused third player) leaves
        // without anybody having departed.
        return;
      }
      this.players = this.players.map((p, i) =>
        i === index ? { ...p, left: true } : p,
      );
      const playerId = conn.peer;
      this.onPlayerLeftCallbacks.forEach((cb) => cb(playerId));
      this.broadcast({ type: 'PLAYER_LEFT', playerId });

      // Hold the slot for a minute so a rejoin with the same token revives it.
      // At expiry the slot is final and it is removed, so the lobby does not
      // keep a permanent departed row. Nothing is broadcast, because the
      // others already marked the player gone.
      const previousTimer = this.graceTimers.get(playerId);
      if (previousTimer) {
        clearTimeout(previousTimer);
      }
      this.graceTimers.set(
        playerId,
        setTimeout(() => {
          this.graceTimers.delete(playerId);
          this.players = this.players.filter(
            (p) => !(p.id === playerId && p.left),
          );
        }, REJOIN_GRACE_MS),
      );
    });
  }

  /** A message may only act on the sender's own slot (D5). */
  private dropForeignUpdate(
    msg: { type: string; playerId: string },
    conn: DataConnection,
  ) {
    console.warn(
      'Dropped ' + msg.type + ' from ' + conn.peer + ' naming ' + msg.playerId,
    );
  }

  private broadcast(msg: Message, excludePeerId?: string) {
    this.connections.forEach((conn) => {
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
        msg.players.forEach((p) => this.notifyPlayerJoin(p));
        this.notifyGameStateChange(msg.state);
        break;
      case 'JOIN':
        if (!this.players.find((p) => p.id === msg.player.id)) {
          this.players = [...this.players, msg.player];
        }
        this.notifyPlayerJoin(msg.player);
        break;
      case 'GAME_STATE':
        this.gameState = msg.state;
        this.notifyGameStateChange(msg.state);
        break;
      case 'SCORE_UPDATE':
        this.players = this.players.map((p) =>
          p.id === msg.playerId ? { ...p, score: msg.score } : p,
        );
        this.notifyScoreUpdate(msg.playerId, msg.score);
        break;
      case 'QUIZ_SELECT':
        this.onQuizSelectCallbacks.forEach((cb) => cb(msg.quizId));
        break;
      case 'PLAYER_PROGRESS':
        this.players = this.players.map((p) =>
          p.id === msg.playerId
            ? {
                ...p,
                progress: msg.progress,
                totalQuestions: msg.totalQuestions,
              }
            : p,
        );
        this.onPlayerProgressCallbacks.forEach((cb) =>
          cb(msg.playerId, msg.progress, msg.totalQuestions),
        );
        break;
      case 'PLAYER_FINISH':
        this.players = this.players.map((p) =>
          p.id === msg.playerId
            ? {
                ...p,
                finished: true,
                score: msg.score,
                finishTime: msg.finishTime,
              }
            : p,
        );
        this.onPlayerFinishCallbacks.forEach((cb) =>
          cb(msg.playerId, msg.score, msg.finishTime),
        );
        break;
      case 'PLAYER_LEFT':
        this.players = this.players.map((p) =>
          p.id === msg.playerId ? { ...p, left: true } : p,
        );
        this.onPlayerLeftCallbacks.forEach((cb) => cb(msg.playerId));
        break;
      case 'ROOM_FULL':
        // Settled in joinRoom's data handler; nothing to apply here.
        break;
    }
  }

  // PUBLIC METHODS

  startGame(quiz?: { name: string; questions: QuizQuestion[] }) {
    if (this.isHost) {
      const startTime = Date.now();
      this.gameState = {
        ...this.gameState,
        status: 'playing',
        quizId: quiz?.name,
        quiz,
        startTime,
      };
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
      this.players = this.players.map((p) => (p.isHost ? { ...p, score } : p));
      this.notifyScoreUpdate('host', score);
      this.broadcast({ type: 'SCORE_UPDATE', playerId: 'host', score });
    } else if (this.hostConnection?.open) {
      this.hostConnection.send({
        type: 'SCORE_UPDATE',
        playerId: this.playerId!,
        score,
      });
    }
  }

  updateProgress(progress: number, totalQuestions: number) {
    if (this.isHost) {
      this.players = this.players.map((p) =>
        p.isHost ? { ...p, progress, totalQuestions } : p,
      );
      this.onPlayerProgressCallbacks.forEach((cb) =>
        cb('host', progress, totalQuestions),
      );
      this.broadcast({
        type: 'PLAYER_PROGRESS',
        playerId: 'host',
        progress,
        totalQuestions,
      });
    } else if (this.hostConnection?.open) {
      this.hostConnection.send({
        type: 'PLAYER_PROGRESS',
        playerId: this.playerId!,
        progress,
        totalQuestions,
      });
    }
  }

  finishGame(score: number) {
    const finishTime = this.gameState.startTime
      ? Date.now() - this.gameState.startTime
      : 0;

    if (this.isHost) {
      this.players = this.players.map((p) =>
        p.isHost ? { ...p, finished: true, score, finishTime } : p,
      );
      this.onPlayerFinishCallbacks.forEach((cb) =>
        cb('host', score, finishTime),
      );
      this.broadcast({
        type: 'PLAYER_FINISH',
        playerId: 'host',
        score,
        finishTime,
      });
    } else if (this.hostConnection?.open) {
      this.hostConnection.send({
        type: 'PLAYER_FINISH',
        playerId: this.playerId!,
        score,
        finishTime,
      });
    }
  }

  // State Getters
  getPlayers(): Player[] {
    return [...this.players];
  }
  getGameState(): GameState {
    return this.gameState;
  }
  getIsHost(): boolean {
    return this.isHost;
  }
  getPlayerId(): string | null {
    return this.isHost ? 'host' : this.playerId;
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
  onQuizSelect(callback: (quizId: string) => void) {
    this.onQuizSelectCallbacks.push(callback);
  }
  onPlayerProgress(
    callback: (
      playerId: string,
      progress: number,
      totalQuestions: number,
    ) => void,
  ) {
    this.onPlayerProgressCallbacks.push(callback);
  }
  onPlayerFinish(
    callback: (playerId: string, score: number, finishTime: number) => void,
  ) {
    this.onPlayerFinishCallbacks.push(callback);
  }
  onPlayerLeft(callback: (playerId: string) => void) {
    this.onPlayerLeftCallbacks.push(callback);
  }

  private notifyPlayerJoin(player: Player) {
    this.onPlayerJoinCallbacks.forEach((cb) => cb(player));
  }
  private notifyGameStateChange(state: GameState) {
    this.onGameStateChangeCallbacks.forEach((cb) => cb(state));
  }
  private notifyScoreUpdate(playerId: string, score: number) {
    this.onScoreUpdateCallbacks.forEach((cb) => cb(playerId, score));
  }
}

export const multiplayerService = new MultiplayerService();
