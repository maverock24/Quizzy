import {
  allFinished,
  applyJoin,
  connectedCount,
  findJoinTarget,
  isSenderAllowed,
  leadLabel,
  occupiedCount,
  progressPercent,
  standings,
  winnerOf,
} from '../multiplayerRules';

const player = (id, overrides = {}) => ({
  id,
  name: id,
  score: 0,
  progress: 0,
  finished: false,
  ...overrides,
});

describe('isSenderAllowed', () => {
  it('accepts a message that names the sender itself', () => {
    expect(isSenderAllowed('peer-a', 'peer-a')).toBe(true);
  });

  it('accepts the host sentinel from the host', () => {
    expect(isSenderAllowed('host', 'host')).toBe(true);
  });

  it('rejects a message that names another player', () => {
    expect(isSenderAllowed('peer-b', 'peer-a')).toBe(false);
  });

  it('rejects a client claiming the host sentinel', () => {
    expect(isSenderAllowed('host', 'peer-a')).toBe(false);
  });

  it('rejects a message with no player id at all', () => {
    expect(isSenderAllowed(undefined, 'peer-a')).toBe(false);
  });
});

describe('findJoinTarget', () => {
  it('matches the token before the id', () => {
    const players = [
      player('peer-old', { token: 'tok-a' }),
      player('peer-new', { token: 'tok-b' }),
    ];
    expect(findJoinTarget(players, 'tok-a', 'peer-new')).toBe(0);
  });

  it('falls back to the id when the token is unknown', () => {
    const players = [player('peer-a', { token: 'tok-a' }), player('peer-b')];
    expect(findJoinTarget(players, 'tok-unknown', 'peer-b')).toBe(1);
  });

  it('returns -1 when neither the token nor the id is known', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    expect(findJoinTarget(players, 'tok-unknown', 'peer-b')).toBe(-1);
  });

  it('returns -1 for an empty token and an unknown id', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    expect(findJoinTarget(players, '', 'peer-b')).toBe(-1);
  });

  it('never matches the host entry, by token or by id', () => {
    const players = [
      player('host', { isHost: true, token: '' }),
      player('peer-a', { token: 'tok-a' }),
    ];
    expect(findJoinTarget(players, '', 'host')).toBe(-1);
    expect(findJoinTarget(players, 'tok-host', 'host')).toBe(-1);
  });
});

describe('applyJoin', () => {
  it('replaces the entry when the same id arrives again', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    const merged = applyJoin(
      players,
      player('peer-a', { name: 'Ana', token: 'tok-a' }),
    );
    expect(merged).not.toBe(players);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Ana');
  });

  it('replaces the entry with the same token and keeps its index', () => {
    const players = [
      player('host', { isHost: true, token: '' }),
      player('peer-old', { token: 'tok-a' }),
      player('peer-b', { token: 'tok-b' }),
    ];
    const merged = applyJoin(players, player('peer-new', { token: 'tok-a' }));
    expect(merged.map((p) => p.id)).toEqual(['host', 'peer-new', 'peer-b']);
    expect(merged).not.toBe(players);
  });

  it('appends a player it has never seen', () => {
    const players = [player('host', { isHost: true, token: '' })];
    const merged = applyJoin(players, player('peer-a', { token: 'tok-a' }));
    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.id)).toEqual(['host', 'peer-a']);
  });

  it('keeps the host entry when a join carries the host token', () => {
    const players = [
      player('host', { name: 'Ada', isHost: true, token: 'tok-host' }),
    ];
    const merged = applyJoin(
      players,
      player('peer-a', { name: 'Mallory', token: 'tok-host' }),
    );
    expect(merged.find((p) => p.isHost).name).toBe('Ada');
    expect(merged.find((p) => p.isHost).token).toBe('tok-host');
  });

  it('ignores an empty token on another entry', () => {
    const players = [player('peer-a', { token: '' })];
    const merged = applyJoin(players, player('peer-b', { token: '' }));
    expect(merged.map((p) => p.id)).toEqual(['peer-a', 'peer-b']);
  });

  it('does not mutate the input array', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    applyJoin(players, player('peer-b', { token: 'tok-b' }));
    expect(players).toHaveLength(1);
  });
});

describe('allFinished', () => {
  it('is true for one finished player plus one who left', () => {
    const players = [
      player('peer-a', { finished: true, finishTime: 1000 }),
      player('peer-b', { left: true }),
    ];
    expect(allFinished(players)).toBe(true);
  });

  it('is false while an opponent still plays', () => {
    const players = [
      player('peer-a', { finished: true, finishTime: 1000 }),
      player('peer-b'),
    ];
    expect(allFinished(players)).toBe(false);
  });

  it('is false for a single player who is still playing', () => {
    expect(allFinished([player('peer-a')])).toBe(false);
  });

  it('is false for an empty room', () => {
    expect(allFinished([])).toBe(false);
  });
});

describe('winnerOf', () => {
  it('skips the player who left', () => {
    const players = [
      player('peer-a', {
        finished: true,
        score: 5,
        finishTime: 1000,
        left: true,
      }),
      player('peer-b', { finished: true, score: 3, finishTime: 2000 }),
    ];
    expect(winnerOf(players).id).toBe('peer-b');
  });

  it('breaks a score tie by the earlier finish time', () => {
    const players = [
      player('peer-late', { finished: true, score: 4, finishTime: 2000 }),
      player('peer-early', { finished: true, score: 4, finishTime: 1000 }),
    ];
    expect(winnerOf(players).id).toBe('peer-early');
  });

  it('returns null when nobody finished', () => {
    expect(winnerOf([player('peer-a'), player('peer-b')])).toBeNull();
  });
});

describe('standings', () => {
  // The joiner is the second entry the host ever writes, so the viewer must be
  // found by id and never by position.
  it('finds the viewer when the host is first in the roster', () => {
    const players = [
      player('host', { isHost: true, score: 1, token: '' }),
      player('peer-me', { score: 3, token: 'tok-me' }),
    ];
    const standing = standings(players, 'peer-me');
    expect(standing.you.id).toBe('peer-me');
    expect(standing.rival.id).toBe('host');
    expect(standing.ahead).toBe('you');
    expect(standing.lead).toBe(2);
  });

  it('finds the viewer and the rival by id', () => {
    const players = [
      player('host', { score: 7, progress: 8, totalQuestions: 31 }),
      player('peer-a'),
    ];
    const standing = standings(players, 'host');
    expect(standing.you.id).toBe('host');
    expect(standing.rival.id).toBe('peer-a');
  });

  it('reports the viewer ahead by the point gap', () => {
    const players = [
      player('host', { score: 7 }),
      player('peer-a', { score: 5 }),
    ];
    const standing = standings(players, 'host');
    expect(standing.ahead).toBe('you');
    expect(standing.lead).toBe(2);
  });

  it('reports a negative lead when the rival leads', () => {
    const players = [
      player('host', { score: 5 }),
      player('peer-a', { score: 7 }),
    ];
    const standing = standings(players, 'host');
    expect(standing.ahead).toBe('rival');
    expect(standing.lead).toBe(-2);
  });

  it('calls equal points a tie even when progress differs', () => {
    const players = [
      player('host', { score: 4, progress: 2 }),
      player('peer-a', { score: 4, progress: 7 }),
    ];
    const standing = standings(players, 'host');
    expect(standing.ahead).toBe('tied');
    expect(standing.lead).toBe(0);
  });

  it('prefers the rival who has not left', () => {
    const players = [
      player('host'),
      player('peer-old', { left: true }),
      player('peer-new'),
    ];
    expect(standings(players, 'host').rival.id).toBe('peer-new');
  });

  it('finds no viewer for a null id', () => {
    const players = [player('host'), player('peer-a')];
    const standing = standings(players, null);
    expect(standing.you).toBeUndefined();
    expect(standing.rival).toBeUndefined();
    expect(standing.ahead).toBe('none');
  });

  it('is none for a one-player roster', () => {
    const standing = standings([player('host')], 'host');
    expect(standing.you.id).toBe('host');
    expect(standing.rival).toBeUndefined();
  });
});

describe('leadLabel', () => {
  const you = (score) => player('host', { isHost: true, score, token: '' });
  const rival = (score, overrides = {}) =>
    player('peer-a', { score, token: 'tok-a', ...overrides });

  it('says how far ahead the viewer is', () => {
    expect(leadLabel(standings([you(7), rival(5)], 'host'))).toBe(
      "You're ahead by 2",
    );
  });

  it('says how far behind the viewer is', () => {
    expect(leadLabel(standings([you(5), rival(7)], 'host'))).toBe('2 behind');
  });

  it('calls equal points tied even when the progress differs', () => {
    const players = [you(4), rival(4, { progress: 7 })];
    expect(leadLabel(standings(players, 'host'))).toBe('Tied');
  });

  it('reports a departed rival instead of a lead', () => {
    expect(
      leadLabel(standings([you(9), rival(0, { left: true })], 'host')),
    ).toBe('Opponent left');
  });

  it('waits when there is nobody to compare with', () => {
    expect(leadLabel(standings([you(3)], 'host'))).toBe(
      'Waiting for your rival',
    );
  });
});

describe('progressPercent', () => {
  it('is the rounded share of questions answered', () => {
    const p = player('peer-a', { progress: 8, totalQuestions: 31 });
    expect(progressPercent(p, 31)).toBe(26);
  });

  it('falls back to the given total before the first answer', () => {
    const p = player('peer-a', { progress: 1, totalQuestions: 0 });
    expect(progressPercent(p, 4)).toBe(25);
  });

  it('never divides by zero', () => {
    const p = player('peer-a', { progress: 0, totalQuestions: 0 });
    expect(progressPercent(p, 0)).toBe(0);
  });

  it('clamps above a hundred', () => {
    const p = player('peer-a', { progress: 5, totalQuestions: 4 });
    expect(progressPercent(p, 4)).toBe(100);
  });
});

describe('connectedCount', () => {
  it('excludes the player who left', () => {
    const players = [
      player('peer-a'),
      player('peer-b', { left: true }),
      player('peer-c'),
    ];
    expect(connectedCount(players)).toBe(2);
  });

  it('counts everyone when nobody left', () => {
    expect(connectedCount([player('peer-a'), player('peer-b')])).toBe(2);
  });
});

describe('occupiedCount', () => {
  it('counts a departed slot that still holds its token', () => {
    const players = [
      player('host', { isHost: true }),
      player('peer-a', { left: true, token: 'tok-a' }),
    ];
    expect(occupiedCount(players)).toBe(2);
  });

  it('does not count a departed slot whose token is gone', () => {
    const players = [
      player('host', { isHost: true }),
      player('peer-a', { left: true, token: '' }),
    ];
    expect(occupiedCount(players)).toBe(1);
  });
});
