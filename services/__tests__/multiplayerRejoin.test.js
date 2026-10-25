jest.mock('peerjs', () => ({ __esModule: true, default: jest.fn() }));

function makePeer() {
  const handlers = {};
  return {
    handlers,
    on: jest.fn((event, callback) => {
      handlers[event] = callback;
    }),
    destroy: jest.fn(),
  };
}

function makeConnection(peer) {
  const handlers = {};
  return {
    handlers,
    peer,
    open: true,
    on: jest.fn((event, callback) => {
      handlers[event] = callback;
    }),
    send: jest.fn(),
    close: jest.fn(),
  };
}

const player = (id, overrides = {}) => ({
  id,
  name: id,
  score: 0,
  isHost: false,
  joinedAt: '2024-01-01T00:00:00.000Z',
  progress: 0,
  totalQuestions: 0,
  finished: false,
  left: false,
  token: `token-${id}`,
  ...overrides,
});

const WELCOME_STATE = { status: 'waiting', currentQuestionIndex: 0 };

describe('rejoin', () => {
  let Peer;
  let multiplayerService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    Peer = require('peerjs').default;
    Peer.mockReset();
    multiplayerService = require('../MultiplayerService').multiplayerService;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // One joining client, from `new Peer()` to the host's WELCOME. Returns the
  // JOIN it sent, which is the message the token has to ride on.
  const joinOnce = async (name) => {
    const peer = makePeer();
    const connection = makeConnection('quizzy-ABC234');
    peer.connect = jest.fn(() => connection);
    Peer.mockReturnValue(peer);

    const promise = multiplayerService.joinRoom('ABC234', name);
    peer.handlers.open(`peer-${name}`);
    connection.handlers.open();

    const join = connection.send.mock.calls
      .map(([msg]) => msg)
      .find((msg) => msg.type === 'JOIN');

    connection.handlers.data({
      type: 'WELCOME',
      players: [
        player('host', { isHost: true, name: 'Ada' }),
        player(`peer-${name}`, { name }),
      ],
      state: WELCOME_STATE,
    });
    await promise;

    return { peer, connection, join };
  };

  it('sends a non-empty token in the JOIN', async () => {
    const { join } = await joinOnce('Ana');

    expect(join).toBeDefined();
    expect(join.player.token).toEqual(expect.any(String));
    expect(join.player.token.length).toBeGreaterThan(0);
  });

  it('sends the same token for two joins from one session', async () => {
    const first = await joinOnce('Ana');
    const second = await joinOnce('Ana');

    expect(first.join.player.token).toMatch(/^token-/);
    expect(second.join.player.token).toBe(first.join.player.token);
  });

  it('reads a token already in sessionStorage', () => {
    const originalWindow = global.window;
    const getItem = jest.fn(() => 'token-stored');
    const setItem = jest.fn();
    global.window = { sessionStorage: { getItem, setItem } };
    jest.resetModules();

    try {
      const tokenModule = require('../sessionToken');
      expect(tokenModule.getSessionToken()).toBe('token-stored');
      expect(getItem).toHaveBeenCalledWith('quizzy-multiplayer-token');
      expect(setItem).not.toHaveBeenCalled();

      // A second, freshly loaded module has no token of its own, so the same
      // answer can only come from the store.
      jest.resetModules();
      expect(require('../sessionToken').getSessionToken()).toBe('token-stored');
      expect(setItem).not.toHaveBeenCalled();
    } finally {
      if (originalWindow === undefined) {
        delete global.window;
      } else {
        global.window = originalWindow;
      }
    }
  });
});
