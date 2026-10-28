import {
  ALLOWED_ORIGINS,
  MAX_NAME_LENGTH,
  isAuthorised,
  isPeerId,
  isRoomCode,
  mintSecret,
  publicUsers,
  resolveCors,
  sanitiseName,
} from '../lobbyRules';

const user = (peerId, overrides = {}) => ({
  peerId,
  name: peerId,
  lastSeen: 1000,
  ...overrides,
});

describe('resolveCors', () => {
  it('echoes the production origin, and only that one', () => {
    const headers = resolveCors('https://quizzy-2504.netlify.app');
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://quizzy-2504.netlify.app',
    );
  });

  it('echoes the local dev origin', () => {
    expect(
      resolveCors('http://localhost:8081')['Access-Control-Allow-Origin'],
    ).toBe('http://localhost:8081');
  });

  it('never answers with a wildcard', () => {
    for (const origin of ALLOWED_ORIGINS) {
      expect(resolveCors(origin)['Access-Control-Allow-Origin']).not.toBe('*');
    }
  });

  it('sends no allow-origin header for an origin that is not listed', () => {
    for (const origin of [
      'https://evil.example',
      'http://localhost:3000',
      'https://quizzy-2504.netlify.app.evil.example',
      '',
      undefined,
      null,
      42,
    ]) {
      expect(
        resolveCors(origin)['Access-Control-Allow-Origin'],
      ).toBeUndefined();
    }
  });

  it('varies on the origin, so a cache cannot cross the two', () => {
    expect(resolveCors('https://evil.example').Vary).toBe('Origin');
  });

  it('still allows the method and the header a POST needs', () => {
    const headers = resolveCors(undefined);
    expect(headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });
});

describe('mintSecret', () => {
  it('is thirty-two hex characters', () => {
    expect(mintSecret()).toMatch(/^[0-9a-f]{32}$/);
  });

  it('does not repeat', () => {
    const secrets = new Set(Array.from({ length: 50 }, () => mintSecret()));
    expect(secrets.size).toBe(50);
  });
});

describe('isAuthorised', () => {
  it('accepts the secret the lobby minted for that peer', () => {
    expect(isAuthorised(user('peer-1', { secret: 'abc123' }), 'abc123')).toBe(
      true,
    );
  });

  it('refuses a peer with no stored secret', () => {
    expect(isAuthorised(user('peer-1'), 'abc123')).toBe(false);
    expect(isAuthorised(user('peer-1', { secret: '' }), '')).toBe(false);
  });

  it('refuses a missing caller', () => {
    expect(isAuthorised(undefined, 'abc123')).toBe(false);
    expect(isAuthorised(null, 'abc123')).toBe(false);
  });

  it('refuses a wrong, empty or non-string secret', () => {
    const stored = user('peer-1', { secret: 'abc123' });
    for (const secret of ['abc124', '', undefined, null, 123, {}]) {
      expect(isAuthorised(stored, secret)).toBe(false);
    }
  });
});

describe('sanitiseName', () => {
  it('trims and keeps a normal name', () => {
    expect(sanitiseName('  Ana  ')).toBe('Ana');
  });

  it('caps the name at twenty-four characters', () => {
    expect(sanitiseName('a'.repeat(40))).toHaveLength(MAX_NAME_LENGTH);
    expect(MAX_NAME_LENGTH).toBe(24);
  });

  it('refuses a value that is not a name', () => {
    for (const value of [undefined, null, 42, {}, [], true]) {
      expect(sanitiseName(value)).toBeNull();
    }
  });

  it('refuses an empty or whitespace-only name', () => {
    expect(sanitiseName('')).toBeNull();
    expect(sanitiseName('   ')).toBeNull();
  });
});

describe('isRoomCode', () => {
  it('accepts a six-character code from the room alphabet', () => {
    expect(isRoomCode('ABC234')).toBe(true);
    // 0, 1, I and O are left out of the alphabet so no code has a look-alike.
    expect(isRoomCode('ABC01I')).toBe(false);
  });

  it('refuses anything that is not one', () => {
    for (const value of [
      'ABC23',
      'ABC2345',
      'abc234',
      'ABC 34',
      '',
      undefined,
      null,
      123456,
      {},
    ]) {
      expect(isRoomCode(value)).toBe(false);
    }
  });
});

describe('isPeerId', () => {
  it('accepts a non-empty string', () => {
    expect(isPeerId('peer-1')).toBe(true);
  });

  it('refuses an empty, over-long or non-string id', () => {
    for (const value of ['', 'a'.repeat(129), undefined, null, 7, {}]) {
      expect(isPeerId(value)).toBe(false);
    }
  });
});

describe('publicUsers', () => {
  it('never hands out a room code', () => {
    const users = {
      'peer-1': user('peer-1', { name: 'Ana', roomCode: 'ABC234' }),
    };
    expect(publicUsers(users)).toEqual([
      { peerId: 'peer-1', name: 'Ana', lastSeen: 1000 },
    ]);
    expect(publicUsers(users)[0]).not.toHaveProperty('roomCode');
  });

  it('never hands out a secret', () => {
    const users = { 'peer-1': user('peer-1', { secret: 'abc123' }) };
    expect(publicUsers(users)[0]).not.toHaveProperty('secret');
  });

  it('leaves the caller out of the list', () => {
    const users = {
      'peer-1': user('peer-1'),
      'peer-2': user('peer-2'),
    };
    expect(publicUsers(users, 'peer-1').map((u) => u.peerId)).toEqual([
      'peer-2',
    ]);
  });

  it('is empty for an empty lobby', () => {
    expect(publicUsers({})).toEqual([]);
  });
});
