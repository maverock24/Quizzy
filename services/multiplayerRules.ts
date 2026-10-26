/**
 * The subset of a player the host's rules read. Declared here rather than
 * imported so the transport can use these functions without a cycle.
 */
export interface RulePlayer {
  id: string;
  name: string;
  score: number;
  progress: number;
  finished: boolean;
  finishTime?: number;
  left?: boolean;
  token?: string;
  isHost?: boolean;
}

export const HOST_SENTINEL = 'host';

/**
 * A message may only act on the sender's own slot. The host's sentinel is its
 * own id, and a connection's peer id is never 'host', so no special case is
 * needed: a client claiming 'host' is dropped.
 */
export function isSenderAllowed(
  playerId: string | undefined,
  senderPeerId: string,
): boolean {
  if (!playerId) {
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
 */
export function findJoinTarget(
  players: RulePlayer[],
  token: string,
  id: string,
): number {
  if (token) {
    const byToken = players.findIndex(
      (p) => p.token === token && !isHostEntry(p),
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
