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
