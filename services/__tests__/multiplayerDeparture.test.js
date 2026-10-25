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
  ...overrides,
});

const WELCOME_STATE = { status: 'waiting', currentQuestionIndex: 0 };

describe('departure', () => {
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

  // The host, one joined client, and a second open connection with no slot.
  const startHost = async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    peer.handlers.open('quizzy-ABC234');
    await promise;

    const sender = makeConnection('peer-a');
    peer.handlers.connection(sender);
    const other = makeConnection('peer-b');
    peer.handlers.connection(other);

    sender.handlers.data({
      type: 'JOIN',
      player: player('peer-a', { name: 'Ana' }),
    });
    sender.send.mockClear();
    other.send.mockClear();
    return { sender, other };
  };

  // A joining client that already holds the host's two-player roster.
  const startClient = async () => {
    const peer = makePeer();
    const connection = makeConnection('quizzy-ABC234');
    peer.connect = jest.fn(() => connection);
    Peer.mockReturnValue(peer);

    const promise = multiplayerService.joinRoom('ABC234', 'Ana');
    peer.handlers.open('peer-me');
    connection.handlers.open();
    connection.handlers.data({
      type: 'WELCOME',
      players: [
        player('host', { isHost: true, name: 'Ada' }),
        player('peer-me', { name: 'Ana' }),
      ],
      state: WELCOME_STATE,
    });
    await promise;
    connection.send.mockClear();
    return { connection };
  };

  it('marks the player whose connection closed and nobody else', async () => {
    const { sender, other } = await startHost();

    sender.handlers.close();

    const players = multiplayerService.getPlayers();
    expect(players).toHaveLength(2);
    expect(players.find((p) => p.id === 'peer-a').left).toBe(true);
    expect(players.find((p) => p.id === 'host').left).toBe(false);

    // A connection that never held a slot departs without marking anybody.
    other.handlers.close();
    expect(multiplayerService.getPlayers()).toHaveLength(2);
    expect(multiplayerService.getPlayers().filter((p) => p.left)).toHaveLength(
      1,
    );
  });

  it('broadcasts PLAYER_LEFT to the remaining connections', async () => {
    const { sender, other } = await startHost();
    const onLeft = jest.fn();
    multiplayerService.onPlayerLeft(onLeft);

    sender.handlers.close();

    expect(other.send).toHaveBeenCalledTimes(1);
    expect(other.send).toHaveBeenCalledWith({
      type: 'PLAYER_LEFT',
      playerId: 'peer-a',
    });
    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(onLeft).toHaveBeenCalledWith('peer-a');
  });

  it('marks a player left on PLAYER_LEFT and calls its listener once', async () => {
    const { connection } = await startClient();
    const onLeft = jest.fn();
    multiplayerService.onPlayerLeft(onLeft);

    connection.handlers.data({ type: 'PLAYER_LEFT', playerId: 'host' });

    expect(
      multiplayerService.getPlayers().find((p) => p.id === 'host').left,
    ).toBe(true);
    expect(
      multiplayerService.getPlayers().find((p) => p.id === 'peer-me').left,
    ).toBe(false);
    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(onLeft).toHaveBeenCalledWith('host');
  });

  it('marks the host left when the host connection closes', async () => {
    const { connection } = await startClient();
    const onLeft = jest.fn();
    multiplayerService.onPlayerLeft(onLeft);

    connection.handlers.close();

    expect(multiplayerService.getPlayers().find((p) => p.isHost).left).toBe(
      true,
    );
    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(onLeft).toHaveBeenCalledWith('host');
  });
});
