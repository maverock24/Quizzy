import {
  allFinished,
  connectedCount,
  findJoinTarget,
  isSenderAllowed,
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
