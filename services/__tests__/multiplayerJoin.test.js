jest.mock('peerjs', () => ({ __esModule: true, default: jest.fn() }));

const WELCOME_PLAYERS = [
  {
    id: 'host',
    name: 'Ada',
    score: 0,
    isHost: true,
    joinedAt: '2024-01-01T00:00:00.000Z',
    progress: 0,
    totalQuestions: 0,
    finished: false,
  },
  {
    id: 'peer-me',
    name: 'Ana',
    score: 0,
    isHost: false,
    joinedAt: '2024-01-01T00:00:01.000Z',
    progress: 0,
    totalQuestions: 0,
    finished: false,
  },
];

const WELCOME_STATE = { status: 'waiting', currentQuestionIndex: 0 };

function makeConnection() {
  const handlers = {};
  return {
    handlers,
    peer: 'quizzy-ABC234',
    open: true,
    on: jest.fn((event, callback) => {
      handlers[event] = callback;
    }),
    send: jest.fn(),
    close: jest.fn(),
  };
}

function makePeer() {
  const connection = makeConnection();
  const handlers = {};
  return {
    handlers,
    connection,
    on: jest.fn((event, callback) => {
      handlers[event] = callback;
    }),
    connect: jest.fn(() => connection),
    destroy: jest.fn(),
  };
}

describe('joinRoom', () => {
  let Peer;
  let multiplayerService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Peer = require('peerjs').default;
    Peer.mockReset();
    multiplayerService = require('../MultiplayerService').multiplayerService;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const joinWithPeerError = async (type) => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.joinRoom('ABC234', 'Ana');
    peer.handlers.error({ type });
    return promise;
  };

  it('connects once over a reliable channel to the upper-cased code', () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);

    multiplayerService.joinRoom('abc234', 'Ana');
    peer.handlers.open('peer-me');

    expect(peer.connect).toHaveBeenCalledTimes(1);
    expect(peer.connect).toHaveBeenCalledWith('quizzy-ABC234', {
      reliable: true,
    });
    expect(peer.connect.mock.calls[0]).toHaveLength(2);
  });

  it('resolves timeout after eight seconds of no answer', async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.joinRoom('ABC234', 'Ana');
    const settled = jest.fn();
    promise.then(settled);

    jest.advanceTimersByTime(7999);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await expect(promise).resolves.toEqual({ ok: false, failure: 'timeout' });
    // An unanswered join leaves no peer registered.
    expect(peer.destroy).toHaveBeenCalledTimes(1);
  });

  it('reads an unavailable peer as room-not-found', async () => {
    await expect(joinWithPeerError('peer-unavailable')).resolves.toEqual({
      ok: false,
      failure: 'room-not-found',
    });
  });

  it('reads an incompatible browser as incompatible', async () => {
    await expect(joinWithPeerError('browser-incompatible')).resolves.toEqual({
      ok: false,
      failure: 'incompatible',
    });
  });

  it('reads a network error as network', async () => {
    await expect(joinWithPeerError('network')).resolves.toEqual({
      ok: false,
      failure: 'network',
    });
  });

  it('reads a failed negotiation as connect-failed', async () => {
    await expect(joinWithPeerError('negotiation-failed')).resolves.toEqual({
      ok: false,
      failure: 'connect-failed',
    });
  });

  it('resolves the players, the state and the quiz id on WELCOME', async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.joinRoom('ABC234', 'Ana');

    peer.handlers.open('peer-me');
    peer.connection.handlers.open();
    peer.connection.handlers.data({
      type: 'WELCOME',
      players: WELCOME_PLAYERS,
      state: WELCOME_STATE,
      quizId: 'quiz-1',
    });

    await expect(promise).resolves.toEqual({
      ok: true,
      players: WELCOME_PLAYERS,
      gameState: WELCOME_STATE,
      quizId: 'quiz-1',
    });
  });

  it('rejects a five-character code without constructing a peer', async () => {
    await expect(multiplayerService.joinRoom('ABC23', 'Ana')).resolves.toEqual({
      ok: false,
      failure: 'bad-code',
    });

    expect(Peer).not.toHaveBeenCalled();
  });

  it('leaves no timer armed once WELCOME arrives', async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.joinRoom('ABC234', 'Ana');
    const settled = jest.fn();
    promise.then(settled);

    peer.handlers.open('peer-me');
    peer.connection.handlers.open();
    peer.connection.handlers.data({
      type: 'WELCOME',
      players: WELCOME_PLAYERS,
      state: WELCOME_STATE,
    });

    await promise;
    expect(jest.getTimerCount()).toBe(0);

    jest.advanceTimersByTime(20000);
    await Promise.resolve();
    expect(settled).toHaveBeenCalledTimes(1);
  });
});
