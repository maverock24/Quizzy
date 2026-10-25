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
  ...overrides,
});

describe('host authority', () => {
  let Peer;
  let multiplayerService;
  let peer;
  let sender;
  let other;

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

  const connect = (peerId) => {
    const conn = makeConnection(peerId);
    peer.handlers.connection(conn);
    return conn;
  };

  // The room holds two players, the host and one joiner. `other` is a second
  // open connection with no slot, which is what the host broadcasts to.
  const startHostWithAJoinedClient = async () => {
    peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    peer.handlers.open('quizzy-ABC234');
    await promise;

    sender = connect('peer-a');
    other = connect('peer-b');
    sender.handlers.data({
      type: 'JOIN',
      player: player('peer-a', { name: 'Ana' }),
    });
    sender.send.mockClear();
    other.send.mockClear();
  };

  it('applies a SCORE_UPDATE that names the sender', async () => {
    await startHostWithAJoinedClient();
    const onScore = jest.fn();
    multiplayerService.onScoreUpdate(onScore);

    sender.handlers.data({
      type: 'SCORE_UPDATE',
      playerId: 'peer-a',
      score: 4,
    });

    expect(multiplayerService.getPlayers().map((p) => [p.id, p.score])).toEqual(
      [
        ['host', 0],
        ['peer-a', 4],
      ],
    );
    expect(onScore).toHaveBeenCalledWith('peer-a', 4);
    expect(other.send).toHaveBeenCalledWith({
      type: 'SCORE_UPDATE',
      playerId: 'peer-a',
      score: 4,
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('drops a SCORE_UPDATE that names another player', async () => {
    await startHostWithAJoinedClient();
    const onScore = jest.fn();
    multiplayerService.onScoreUpdate(onScore);

    sender.handlers.data({
      type: 'SCORE_UPDATE',
      playerId: 'peer-b',
      score: 9,
    });

    expect(multiplayerService.getPlayers().every((p) => p.score === 0)).toBe(
      true,
    );
    expect(onScore).not.toHaveBeenCalled();
    expect(other.send).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Dropped SCORE_UPDATE from peer-a naming peer-b',
    );
  });

  it('drops a PLAYER_PROGRESS that names another player', async () => {
    await startHostWithAJoinedClient();
    const onProgress = jest.fn();
    multiplayerService.onPlayerProgress(onProgress);

    sender.handlers.data({
      type: 'PLAYER_PROGRESS',
      playerId: 'peer-b',
      progress: 3,
      totalQuestions: 10,
    });

    expect(multiplayerService.getPlayers().every((p) => p.progress === 0)).toBe(
      true,
    );
    expect(onProgress).not.toHaveBeenCalled();
    expect(other.send).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Dropped PLAYER_PROGRESS from peer-a naming peer-b',
    );
  });

  it('drops a PLAYER_FINISH that names another player', async () => {
    await startHostWithAJoinedClient();
    const onFinish = jest.fn();
    multiplayerService.onPlayerFinish(onFinish);

    sender.handlers.data({
      type: 'PLAYER_FINISH',
      playerId: 'peer-b',
      score: 9,
      finishTime: 1000,
    });

    expect(
      multiplayerService
        .getPlayers()
        .every((p) => p.finished === false && p.finishTime === undefined),
    ).toBe(true);
    expect(onFinish).not.toHaveBeenCalled();
    expect(other.send).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'Dropped PLAYER_FINISH from peer-a naming peer-b',
    );
  });
});
