import i18n from '@/components/i18n';

/**
 * The subset of a player the host's rules read. Declared here rather than
 * imported so the transport can use these functions without a cycle.
 */
export interface RulePlayer {
  id: string;
  name: string;
  score: number;
  progress: number;
  totalQuestions?: number;
  finished: boolean;
  finishTime?: number;
  left?: boolean;
  token?: string;
  isHost?: boolean;
  /** Only present on roster entries the host sends; clamped on the way in. */
  joinedAt?: string;
}

export const HOST_SENTINEL = 'host';

/**
 * A message may only act on the sender's own slot, and the host's row is
 * never a slot a connection may act on. The host updates its own row through
 * `updateScore` and friends, directly on its roster, so nothing that arrives
 * over a data channel may name `host`: a peer that registers the PeerJS id
 * 'host' would otherwise pass an id-only check and rewrite the host's row.
 */
export function isSenderAllowed(
  playerId: string | undefined,
  senderPeerId: string | undefined,
): boolean {
  if (!playerId || !senderPeerId) {
    return false;
  }
  if (playerId === HOST_SENTINEL || senderPeerId === HOST_SENTINEL) {
    return false;
  }
  return playerId === senderPeerId;
}

/** The host's own entry, which no join may ever claim. */
function isHostEntry(p: RulePlayer): boolean {
  return p.isHost === true || p.id === HOST_SENTINEL;
}

/**
 * A rejoin replaces the old entry, so the token is looked at before the id.
 * Returns -1 when the sender is new. The host's entry is never a target: a
 * join that claims it would overwrite the host's own slot.
 *
 * A token only matches a slot that has been left. A stolen token must not
 * revive a slot that is still live, because the revive rewrites the entry's
 * id and the victim's own updates would then be foreign. The id branch needs
 * no such guard: `isSenderAllowed` forces `id === conn.peer`, so an id match
 * can only ever target the sender's own row.
 */
export function findJoinTarget(
  players: RulePlayer[],
  token: string,
  id: string,
): number {
  if (token) {
    const byToken = players.findIndex(
      (p) => p.token === token && p.left === true && !isHostEntry(p),
    );
    if (byToken !== -1) {
      return byToken;
    }
  }
  return players.findIndex((p) => p.id === id && !isHostEntry(p));
}

/**
 * A join merges into the roster instead of appending to it, and it picks the
 * same entry the host picks: the token identifies the human, because a rejoin
 * rewrites the entry's id. Sharing `findJoinTarget` is what keeps the lobby
 * and the host's roster from disagreeing about who a join is. The input array
 * is never written to, so a caller holding it sees no change.
 */
export function applyJoin<T extends RulePlayer>(players: T[], joined: T): T[] {
  const target = findJoinTarget(players, joined.token ?? '', joined.id);
  if (target === -1) return [...players, joined];
  return players.map((p, i) => (i === target ? joined : p));
}

/** A room is done when nobody is still playing, and an empty room is not done. */
export function allFinished(players: RulePlayer[]): boolean {
  if (players.length === 0) {
    return false;
  }
  return players.every((p) => p.finished || p.left === true);
}

/** Best score first, and the earlier finish breaks a tie. */
export function winnerOf(players: RulePlayer[]): RulePlayer | null {
  const ranked = players
    .filter((p) => p.finished && p.left !== true)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity);
    });
  return ranked.length > 0 ? ranked[0] : null;
}

/**
 * An answer is compared the same way everywhere: trimmed, without case. The
 * host scores with this and the room screen shows its instant feedback with
 * this, so what the player is told and what the host records never disagree.
 */
export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

/** What the host records for one submitted answer. */
export interface ScoredAnswer {
  correct: boolean;
  progress: number;
}

/**
 * The host is the scorer: a client submits the answer it picked and the host
 * compares it against the quiz it already holds. `null` means "ignore this
 * submission", which is how a replay, a double tap, an index past the end of
 * the quiz and a quiz the host never started are all refused rather than
 * counted.
 */
export function scoreAnswer(
  quiz: unknown,
  questionIndex: unknown,
  answer: unknown,
  currentProgress: number,
): ScoredAnswer | null {
  if (!isObject(quiz) || !isValidQuiz(quiz)) {
    return null;
  }
  if (typeof questionIndex !== 'number' || !Number.isInteger(questionIndex)) {
    return null;
  }
  if (typeof answer !== 'string') {
    return null;
  }
  const questions = quiz.questions as { answer: string }[];
  if (questionIndex < 0 || questionIndex >= questions.length) {
    return null;
  }
  // A question the host already moved past is a replay, so it is not counted
  // again: this is what keeps a double tap from scoring twice.
  if (questionIndex < currentProgress) {
    return null;
  }
  return {
    correct:
      normalizeAnswer(questions[questionIndex].answer) ===
      normalizeAnswer(answer),
    progress: questionIndex + 1,
  };
}

export type Ahead = 'you' | 'rival' | 'tied' | 'none';

export interface Standing {
  you?: RulePlayer;
  rival?: RulePlayer;
  lead: number;
  ahead: Ahead;
}

/**
 * The viewer is matched by id and nothing else, so a null id names nobody and
 * the caller draws no viewer row. A present rival beats a departed slot left
 * beside its own revive.
 */
export function standings(
  players: RulePlayer[],
  myId: string | null,
): Standing {
  const you = myId ? players.find((p) => p.id === myId) : undefined;
  if (!you) return { lead: 0, ahead: 'none' };
  const others = players.filter((p) => p.id !== you.id);
  const rival = others.find((p) => p.left !== true) ?? others[0];
  if (!rival) return { you, lead: 0, ahead: 'none' };
  const lead = you.score - rival.score;
  const ahead: Ahead = lead > 0 ? 'you' : lead < 0 ? 'rival' : 'tied';
  return { you, rival, lead, ahead };
}

/**
 * The one line above the two rows. Points decide, so equal points read `Tied`
 * however far apart the two are through the quiz. The translation is read per
 * call, never at module scope, so it follows the current language.
 */
export function leadLabel(standing: Standing): string {
  const { you, rival, lead, ahead } = standing;
  if (!you || !rival) return i18n.t('multiplayer_lead_waiting');
  if (rival.left) return i18n.t('multiplayer_lead_opponent_left');
  if (ahead === 'rival')
    return i18n.t('multiplayer_lead_behind', { lead: -lead });
  return ahead === 'you'
    ? i18n.t('multiplayer_lead_ahead', { lead })
    : i18n.t('multiplayer_lead_tied');
}

/** A missing total is 0%, not a division by zero, and a bar never leaves 0..100. */
export function progressPercent(
  player: RulePlayer,
  fallbackTotal: number,
): number {
  const total = player.totalQuestions || fallbackTotal;
  if (!total) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((player.progress / total) * 100)),
  );
}

export function connectedCount(players: RulePlayer[]): number {
  return players.filter((p) => p.left !== true).length;
}

/**
 * A departed slot that still holds its token keeps its place for a rejoin, so
 * it counts against the two-player limit even while nobody is connected on it.
 */
export function occupiedCount(players: RulePlayer[]): number {
  return players.filter((p) => p.left !== true || !!p.token).length;
}

/** A name is capped wherever it enters the roster, so no row can be spoofed. */
export const MAX_NAME_LENGTH = 24;

/** A score is one point per question, so a reported score is clamped here. */
export const MAX_SCORE = 1e6;

/** A question index is bounded well above any real quiz. */
export const MAX_QUESTION_INDEX = 1e5;

/** The fields of a roster entry that a join owns, with every number reset. */
export interface SanitisedJoin {
  id: string;
  name: string;
  score: number;
  progress: number;
  totalQuestions: number;
  finished: boolean;
  finishTime?: number;
  left: boolean;
  token: string;
  joinedAt: string;
}

function cappedName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.slice(0, MAX_NAME_LENGTH);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A finite number inside `min..max`, or `null` when the value is not one. */
function clamped(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return Math.min(max, Math.max(min, value));
}

/**
 * A join claims a place in the roster, not a result. Every value that decides
 * the outcome (score, progress, finished, finishTime) is set here, so a
 * joiner cannot send `score: 1e9, finished: true, finishTime: 1` and win
 * before the quiz starts. Only a new entry goes through this: a rejoin keeps
 * the values the slot already holds.
 */
export function sanitizeJoin(incoming: unknown): SanitisedJoin {
  const raw = isObject(incoming) ? incoming : {};
  return {
    id: typeof raw.id === 'string' ? raw.id : '',
    name: cappedName(raw.name),
    score: 0,
    progress: 0,
    totalQuestions: 0,
    finished: false,
    finishTime: undefined,
    left: false,
    token: typeof raw.token === 'string' ? raw.token : '',
    joinedAt:
      typeof raw.joinedAt === 'string'
        ? raw.joinedAt
        : new Date().toISOString(),
  };
}

/** What a connection may say. Everything else is refused. */
export type ClientMessage =
  | { type: 'JOIN'; player: SanitisedJoin }
  | { type: 'SCORE_UPDATE'; playerId: string; score: number }
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
    };

/**
 * The one door a host's data channel reads a message through. A payload that
 * is not an object, or whose fields are not of the right type, gives `null`
 * and is dropped: reading `msg.type` on `null` used to throw, and an
 * unclamped score used to reach the scoreboard's `{p.score}`.
 */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (!isObject(raw)) {
    return null;
  }
  switch (raw.type) {
    case 'JOIN':
      if (!isObject(raw.player)) {
        return null;
      }
      return { type: 'JOIN', player: sanitizeJoin(raw.player) };
    case 'SCORE_UPDATE': {
      if (typeof raw.playerId !== 'string') {
        return null;
      }
      const score = clamped(raw.score, 0, MAX_SCORE);
      if (score === null) {
        return null;
      }
      return { type: 'SCORE_UPDATE', playerId: raw.playerId, score };
    }
    case 'PLAYER_PROGRESS': {
      if (typeof raw.playerId !== 'string') {
        return null;
      }
      const progress = clamped(raw.progress, 0, MAX_QUESTION_INDEX);
      const totalQuestions = clamped(raw.totalQuestions, 0, MAX_QUESTION_INDEX);
      if (progress === null || totalQuestions === null) {
        return null;
      }
      // A total of zero means "not known yet", so only a known total caps the
      // progress.
      const capped =
        totalQuestions > 0 ? Math.min(progress, totalQuestions) : progress;
      return {
        type: 'PLAYER_PROGRESS',
        playerId: raw.playerId,
        progress: capped,
        totalQuestions,
      };
    }
    case 'PLAYER_FINISH': {
      if (typeof raw.playerId !== 'string') {
        return null;
      }
      const score = clamped(raw.score, 0, MAX_SCORE);
      // A negative time is not a duration, so the message is refused rather
      // than clamped: it would otherwise win the earliest-finish tie-break.
      if (
        score === null ||
        typeof raw.finishTime !== 'number' ||
        !Number.isFinite(raw.finishTime) ||
        raw.finishTime < 0
      ) {
        return null;
      }
      return {
        type: 'PLAYER_FINISH',
        playerId: raw.playerId,
        score,
        finishTime: raw.finishTime,
      };
    }
    default:
      return null;
  }
}

/**
 * A quiz arrives from the host over a data channel, so it is checked before it
 * is rendered: a question without an `answer`, or an answer without an
 * `answer` string, would crash the question view rather than be survived.
 */
export function isValidQuiz(value: unknown): boolean {
  if (!isObject(value)) {
    return false;
  }
  if (typeof value.name !== 'string') {
    return false;
  }
  if (!Array.isArray(value.questions) || value.questions.length === 0) {
    return false;
  }
  return value.questions.every((question) => {
    if (!isObject(question)) {
      return false;
    }
    if (typeof question.question !== 'string') {
      return false;
    }
    if (typeof question.answer !== 'string') {
      return false;
    }
    if (!Array.isArray(question.answers)) {
      return false;
    }
    return question.answers.every(
      (answer) => isObject(answer) && typeof answer.answer === 'string',
    );
  });
}

/**
 * A user quiz list is what the app renders from storage, so every entry has to
 * be a quiz: a hostile pasted or downloaded list must not reach the app.
 */
export function isValidQuizList(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  if (value.length === 0) {
    return false;
  }
  return value.every((quiz) => isValidQuiz(quiz));
}

/** A room holds two players, so a roster anywhere near this size is hostile. */
export const MAX_ROSTER = 8;

/** A player id and a quiz id are short opaque strings. */
const MAX_ID_LENGTH = 128;

/** The game state a host may announce, as the joiner needs it. */
export interface RuleGameState {
  status: 'waiting' | 'playing' | 'finished';
  currentQuestionIndex: number;
  quizId?: string;
  startTime?: number;
  quiz?: { name: string; questions: unknown[] };
}

/** What a host may say to a joiner. Everything else is refused. */
export type HostMessage =
  | { type: 'ROOM_FULL' }
  | {
      type: 'WELCOME';
      players: RulePlayer[];
      state: RuleGameState;
      quizId?: string;
    }
  | { type: 'JOIN'; player: RulePlayer }
  | { type: 'GAME_STATE'; state: RuleGameState }
  | { type: 'SCORE_UPDATE'; playerId: string; score: number }
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
  | { type: 'PLAYER_LEFT'; playerId: string };

const GAME_STATUSES = ['waiting', 'playing', 'finished'] as const;

/**
 * A roster entry as the host may send it. Every field is type-checked and every
 * number clamped. A `token` is dropped even if the host includes one: a token is
 * a session credential and must never cross the wire, so a peer cannot be handed
 * one to replay.
 */
function parseRosterPlayer(value: unknown): RulePlayer | null {
  if (!isObject(value)) {
    return null;
  }
  if (typeof value.id !== 'string' || value.id === '') {
    return null;
  }
  if (value.id.length > MAX_ID_LENGTH) {
    return null;
  }
  const score = clamped(value.score, 0, MAX_SCORE);
  const progress = clamped(value.progress, 0, MAX_QUESTION_INDEX);
  const totalQuestions = clamped(value.totalQuestions, 0, MAX_QUESTION_INDEX);
  if (score === null || progress === null || totalQuestions === null) {
    return null;
  }
  // PeerJS's binary serializer turns an absent `undefined` into `null`, so an
  // optional field arriving as null means "not sent", not "malformed".
  const rawFinish = value.finishTime;
  const finishTime =
    rawFinish === undefined || rawFinish === null
      ? undefined
      : clamped(rawFinish, 0, Number.MAX_SAFE_INTEGER);
  if (rawFinish !== undefined && rawFinish !== null && finishTime === null) {
    return null;
  }
  const player: RulePlayer = {
    id: value.id,
    name: cappedName(value.name),
    score,
    progress:
      totalQuestions > 0 ? Math.min(progress, totalQuestions) : progress,
    totalQuestions,
    finished: value.finished === true,
  };
  // Optional fields are only carried across when the host actually sent them,
  // so a normalised entry keeps the shape it arrived in. `token` is never
  // copied: a session credential must not travel to a peer.
  if (typeof finishTime === 'number') player.finishTime = finishTime;
  if (value.left !== undefined && value.left !== null) {
    player.left = value.left === true;
  }
  if (value.isHost !== undefined && value.isHost !== null) {
    player.isHost = value.isHost === true;
  }
  if (typeof value.joinedAt === 'string') {
    player.joinedAt = value.joinedAt.slice(0, 40);
  }
  return player;
}

function parseGameState(value: unknown): RuleGameState | null {
  if (!isObject(value)) {
    return null;
  }
  const status = value.status;
  if (typeof status !== 'string') {
    return null;
  }
  if (!(GAME_STATUSES as readonly string[]).includes(status)) {
    return null;
  }
  const index = clamped(value.currentQuestionIndex, 0, MAX_QUESTION_INDEX);
  if (index === null) {
    return null;
  }
  const state: RuleGameState = {
    status: status as RuleGameState['status'],
    currentQuestionIndex: index,
  };
  if (typeof value.quizId === 'string') {
    state.quizId = value.quizId.slice(0, MAX_ID_LENGTH);
  }
  if (typeof value.startTime === 'number' && Number.isFinite(value.startTime)) {
    state.startTime = value.startTime;
  }
  // A quiz the joiner cannot render is dropped rather than passed on, so the
  // question view never receives a shape it would crash on.
  if (
    value.quiz !== undefined &&
    value.quiz !== null &&
    isValidQuiz(value.quiz)
  ) {
    state.quiz = value.quiz as RuleGameState['quiz'];
  }
  return state;
}

/**
 * The one door a joiner's data channel reads a host's message through. The
 * host is a peer too, so nothing it sends is trusted: reading `msg.type` on a
 * `null` payload used to throw, and a non-array `players` used to be assigned
 * straight into React state.
 */
export function parseHostMessage(raw: unknown): HostMessage | null {
  if (!isObject(raw)) {
    return null;
  }
  switch (raw.type) {
    case 'ROOM_FULL':
      return { type: 'ROOM_FULL' };
    case 'WELCOME': {
      if (!Array.isArray(raw.players) || raw.players.length > MAX_ROSTER) {
        return null;
      }
      const players: RulePlayer[] = [];
      for (const entry of raw.players) {
        const player = parseRosterPlayer(entry);
        if (!player) {
          return null;
        }
        players.push(player);
      }
      const state = parseGameState(raw.state);
      if (!state) {
        return null;
      }
      const welcome: HostMessage = { type: 'WELCOME', players, state };
      if (typeof raw.quizId === 'string') {
        welcome.quizId = raw.quizId.slice(0, MAX_ID_LENGTH);
      }
      return welcome;
    }
    case 'JOIN': {
      const player = parseRosterPlayer(raw.player);
      return player ? { type: 'JOIN', player } : null;
    }
    case 'GAME_STATE': {
      const state = parseGameState(raw.state);
      return state ? { type: 'GAME_STATE', state } : null;
    }
    case 'SCORE_UPDATE': {
      if (typeof raw.playerId !== 'string') {
        return null;
      }
      const score = clamped(raw.score, 0, MAX_SCORE);
      return score === null
        ? null
        : { type: 'SCORE_UPDATE', playerId: raw.playerId, score };
    }
    case 'QUIZ_SELECT':
      return typeof raw.quizId === 'string'
        ? { type: 'QUIZ_SELECT', quizId: raw.quizId.slice(0, MAX_ID_LENGTH) }
        : null;
    case 'PLAYER_PROGRESS': {
      if (typeof raw.playerId !== 'string') {
        return null;
      }
      const progress = clamped(raw.progress, 0, MAX_QUESTION_INDEX);
      const totalQuestions = clamped(raw.totalQuestions, 0, MAX_QUESTION_INDEX);
      if (progress === null || totalQuestions === null) {
        return null;
      }
      return {
        type: 'PLAYER_PROGRESS',
        playerId: raw.playerId,
        progress:
          totalQuestions > 0 ? Math.min(progress, totalQuestions) : progress,
        totalQuestions,
      };
    }
    case 'PLAYER_FINISH': {
      if (typeof raw.playerId !== 'string') {
        return null;
      }
      const score = clamped(raw.score, 0, MAX_SCORE);
      if (
        score === null ||
        typeof raw.finishTime !== 'number' ||
        !Number.isFinite(raw.finishTime) ||
        raw.finishTime < 0
      ) {
        return null;
      }
      return {
        type: 'PLAYER_FINISH',
        playerId: raw.playerId,
        score,
        finishTime: raw.finishTime,
      };
    }
    case 'PLAYER_LEFT':
      return typeof raw.playerId === 'string'
        ? { type: 'PLAYER_LEFT', playerId: raw.playerId }
        : null;
    default:
      return null;
  }
}
