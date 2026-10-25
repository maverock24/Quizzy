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

/**
 * A rejoin replaces the old entry, so the token is looked at before the id.
 * Returns -1 when the sender is new.
 */
export function findJoinTarget(
  players: RulePlayer[],
  token: string,
  id: string,
): number {
  if (token) {
    const byToken = players.findIndex((p) => p.token === token);
    if (byToken !== -1) {
      return byToken;
    }
  }
  return players.findIndex((p) => p.id === id);
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
