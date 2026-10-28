// The lobby heartbeat is the one thing that talks to the network on its own, so
// every case here drives `PresenceService` through a mocked `fetch` and never
// touches the wire.

const lobbyResponse = (payload = {}) => ({
  ok: true,
  json: async () => ({ users: [], invites: [], ...payload }),
});

// `poll()` awaits `fetch` and then `response.json()`, so finishing one poll
// takes more than a single microtask turn.
const flush = async () => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};

const sentBodies = (fetchMock) =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));

describe('presence', () => {
  let presenceService;
  let fetchMock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    fetchMock = jest.fn(async () => lobbyResponse());
    global.fetch = fetchMock;

    presenceService = require('../PresenceService').presenceService;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('a heartbeat posts the peer id, name and room code', async () => {
    presenceService.setRoomCode('ABC234');
    presenceService.connect('peer-1', 'Alice');
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      action: 'heartbeat',
      peerId: 'peer-1',
      name: 'Alice',
      roomCode: 'ABC234',
    });
  });

  test('a second poll while the first is unresolved is skipped', async () => {
    let resolveFetch;
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    presenceService.connect('peer-1', 'Alice');
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The ten second tick lands while the first heartbeat is still unresolved.
    jest.advanceTimersByTime(10000);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch(lobbyResponse());
    await flush();

    // Once the first poll settles, the next tick is free to poll again.
    jest.advanceTimersByTime(10000);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('a rejected poll keeps the interval running and throws nothing', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    presenceService.connect('peer-1', 'Alice');
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      'Lobby poll failed:',
      expect.any(Error),
    );

    jest.advanceTimersByTime(10000);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('disconnect posts one leave and stops the interval', async () => {
    presenceService.connect('peer-1', 'Alice');
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    presenceService.disconnect();
    await flush();

    expect(sentBodies(fetchMock).filter((b) => b.action === 'leave')).toEqual([
      { action: 'leave', peerId: 'peer-1' },
    ]);

    const callsAfterDisconnect = fetchMock.mock.calls.length;
    jest.advanceTimersByTime(30000);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(callsAfterDisconnect);
  });

  test('the same invite arriving twice fires one callback', async () => {
    const invite = {
      fromPeerId: 'peer-2',
      fromName: 'Bob',
      roomId: 'XYZ789',
      timestamp: 1,
    };
    fetchMock.mockImplementation(async () =>
      lobbyResponse({ invites: [invite] }),
    );

    const onInvite = jest.fn();
    presenceService.onInviteReceived(onInvite);
    presenceService.connect('peer-1', 'Alice');
    await flush();

    expect(onInvite).toHaveBeenCalledTimes(1);
    expect(onInvite).toHaveBeenCalledWith(invite);

    jest.advanceTimersByTime(10000);
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onInvite).toHaveBeenCalledTimes(1);
  });
});

describe('the lobby secret', () => {
  let presenceService;
  let fetchMock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    fetchMock = jest.fn(async () => lobbyResponse());
    global.fetch = fetchMock;

    presenceService = require('../PresenceService').presenceService;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('the first heartbeat carries none and every later one carries it', async () => {
    fetchMock.mockResolvedValueOnce(lobbyResponse({ secret: 'a'.repeat(32) }));

    presenceService.connect('peer-1', 'Alice');
    await flush();
    expect(sentBodies(fetchMock)[0].secret).toBeUndefined();

    jest.advanceTimersByTime(10000);
    await flush();
    expect(sentBodies(fetchMock)[1].secret).toBe('a'.repeat(32));
  });

  test('an invite, a removed invite and a leave all present the secret', async () => {
    fetchMock.mockResolvedValueOnce(lobbyResponse({ secret: 'b'.repeat(32) }));

    presenceService.connect('peer-1', 'Alice');
    await flush();

    await presenceService.sendInvite('peer-2', 'ABC234');
    await presenceService.removeInvite('ABC234');
    presenceService.disconnect();
    await flush();

    const bodies = sentBodies(fetchMock);
    expect(bodies.find((b) => b.action === 'invite').secret).toBe(
      'b'.repeat(32),
    );
    expect(bodies.find((b) => b.action === 'remove_invite').secret).toBe(
      'b'.repeat(32),
    );
    expect(bodies.find((b) => b.action === 'leave').secret).toBe(
      'b'.repeat(32),
    );
  });

  test('the secret is dropped on disconnect, so the next session starts over', async () => {
    fetchMock.mockResolvedValueOnce(lobbyResponse({ secret: 'c'.repeat(32) }));

    presenceService.connect('peer-1', 'Alice');
    await flush();
    presenceService.disconnect();
    await flush();

    presenceService.connect('peer-1', 'Alice');
    await flush();

    const heartbeats = sentBodies(fetchMock).filter(
      (b) => b.action === 'heartbeat',
    );
    expect(heartbeats).toHaveLength(2);
    expect(heartbeats[heartbeats.length - 1].secret).toBeUndefined();
  });

  test('no secret reaches the console or storage', async () => {
    const setItem = jest.fn();
    const getItem = jest.fn(() => null);
    const originalWindow = global.window;
    global.window = { sessionStorage: { getItem, setItem } };
    fetchMock.mockResolvedValueOnce(lobbyResponse({ secret: 'd'.repeat(32) }));

    try {
      presenceService.connect('peer-1', 'Alice');
      await flush();
      jest.advanceTimersByTime(10000);
      await flush();

      expect(setItem).not.toHaveBeenCalled();
      const logged = [
        ...console.log.mock.calls,
        ...console.warn.mock.calls,
        ...console.error.mock.calls,
      ].flat();
      expect(JSON.stringify(logged)).not.toContain('d'.repeat(32));
    } finally {
      if (originalWindow === undefined) {
        delete global.window;
      } else {
        global.window = originalWindow;
      }
    }
  });
});
