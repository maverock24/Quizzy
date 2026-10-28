// The handler's own wiring is what this file drives: the rules it calls are
// covered in `services/__tests__/lobbyRules.test.js`. Netlify Blobs is not
// configured under jest, so every call takes the in-memory fallback.

const ALLOWED = 'https://quizzy-2504.netlify.app';

const post = (handler, body, origin = ALLOWED) =>
  handler({
    httpMethod: 'POST',
    headers: origin === undefined ? {} : { origin },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const json = (response) => JSON.parse(response.body);

describe('lobby function', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    handler = require('../lobby').handler;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const register = async (peerId, name = peerId) => {
    const response = await post(handler, {
      action: 'heartbeat',
      peerId,
      name,
    });
    return { response, secret: json(response).secret };
  };

  it('answers without a CORS header for an origin that is not listed', async () => {
    const response = await post(
      handler,
      { action: 'heartbeat', peerId: 'peer-1', name: 'Ana' },
      'https://evil.example',
    );
    expect(response.headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect(response.headers.Vary).toBe('Origin');
  });

  it('echoes the allowed origin on a preflight', async () => {
    const response = await handler({
      httpMethod: 'OPTIONS',
      headers: { origin: ALLOWED },
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBe(ALLOWED);
  });

  it('mints a secret on the first heartbeat and returns it to that caller', async () => {
    const { response, secret } = await register('peer-1', 'Ana');
    expect(response.statusCode).toBe(200);
    expect(secret).toMatch(/^[0-9a-f]{32}$/);
  });

  it('never shows a secret or a room code to another caller', async () => {
    await register('peer-1', 'Ana');
    const other = await post(handler, {
      action: 'heartbeat',
      peerId: 'peer-2',
      name: 'Bo',
      roomCode: 'ABC234',
    });

    const listed = json(other).users.find((u) => u.peerId === 'peer-1');
    expect(listed).toEqual({
      peerId: 'peer-1',
      name: 'Ana',
      lastSeen: expect.any(Number),
    });
    expect(JSON.stringify(json(other).users)).not.toContain('secret');
    expect(JSON.stringify(json(other).users)).not.toContain('roomCode');
  });

  it('refuses a repeat heartbeat with no secret or a wrong one', async () => {
    await register('peer-1', 'Ana');

    for (const secret of [undefined, '', 'not-the-secret']) {
      const response = await post(handler, {
        action: 'heartbeat',
        peerId: 'peer-1',
        name: 'Ana',
        secret,
      });
      expect(response.statusCode).toBe(403);
    }
  });

  it('accepts a repeat heartbeat that presents the secret', async () => {
    const { secret } = await register('peer-1', 'Ana');
    const response = await post(handler, {
      action: 'heartbeat',
      peerId: 'peer-1',
      name: 'Ana',
      secret,
    });
    expect(response.statusCode).toBe(200);
    expect(json(response).users).toEqual([]);
  });

  it('refuses leave, invite and remove_invite without the secret', async () => {
    const { secret } = await register('peer-1', 'Ana');

    const unauthorised = [
      { action: 'leave', peerId: 'peer-1' },
      {
        action: 'invite',
        peerId: 'peer-1',
        name: 'Ana',
        targetPeerId: 'peer-2',
        roomId: 'ABC234',
      },
      { action: 'remove_invite', peerId: 'peer-1', roomId: 'ABC234' },
    ];
    for (const body of unauthorised) {
      const response = await post(handler, { ...body, secret: 'wrong' });
      expect(response.statusCode).toBe(403);
    }

    // Still registered, so a refused leave did not delete the peer.
    const still = await post(handler, {
      action: 'heartbeat',
      peerId: 'peer-2',
      name: 'Bo',
    });
    expect(json(still).users.map((u) => u.peerId)).toEqual(['peer-1']);

    // And the real secret still works.
    const left = await post(handler, {
      action: 'leave',
      peerId: 'peer-1',
      secret,
    });
    expect(left.statusCode).toBe(200);
  });

  it('refuses an invite whose room id is not a room code', async () => {
    const { secret } = await register('peer-1', 'Ana');
    const response = await post(handler, {
      action: 'invite',
      peerId: 'peer-1',
      name: 'Ana',
      targetPeerId: 'peer-2',
      roomId: 'not-a-code',
      secret,
    });
    expect(response.statusCode).toBe(400);
  });

  it('answers 400 for a body that is not JSON, not 500', async () => {
    const response = await post(handler, '{not json');
    expect(response.statusCode).toBe(400);
  });

  it('answers 400 for a body that is not an object', async () => {
    for (const body of ['[]', 'null', '7']) {
      const response = await post(handler, body);
      expect(response.statusCode).toBe(400);
    }
  });

  it('answers 400 for a heartbeat with no usable peer id or name', async () => {
    expect((await post(handler, { action: 'heartbeat' })).statusCode).toBe(400);
    expect(
      (await post(handler, { action: 'heartbeat', peerId: 'peer-1' }))
        .statusCode,
    ).toBe(400);
    expect(
      (
        await post(handler, {
          action: 'heartbeat',
          peerId: 'peer-1',
          name: { text: 'Ana' },
        })
      ).statusCode,
    ).toBe(400);
  });

  it('stores a name capped at twenty-four characters', async () => {
    await register('peer-1', 'a'.repeat(40));
    const listing = await post(handler, {
      action: 'heartbeat',
      peerId: 'peer-2',
      name: 'Bo',
    });
    expect(json(listing).users[0].name).toHaveLength(24);
  });

  it('refuses a new heartbeat once the lobby holds two hundred', async () => {
    for (let i = 0; i < 200; i++) {
      await post(handler, {
        action: 'heartbeat',
        peerId: `peer-${i}`,
        name: `Player ${i}`,
      });
    }
    const response = await post(handler, {
      action: 'heartbeat',
      peerId: 'peer-over',
      name: 'Over',
    });
    expect(response.statusCode).toBe(403);
  });
});
