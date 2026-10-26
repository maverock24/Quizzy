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

describe('client actions', () => {
  let Peer;
  let multiplayerService;
  let connection;

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

  // A joining client in a running game. The start time is in the past, so a
  // finish records a duration instead of 0.
  const startClient = async () => {
    const peer = makePeer();
    connection = makeConnection('quizzy-ABC234');
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
      state: {
        status: 'playing',
        currentQuestionIndex: 0,
        startTime: Date.now() - 5000,
      },
    });
    await promise;
    connection.send.mockClear();
  };

  const me = () =>
    multiplayerService.getPlayers().find((p) => p.id === 'peer-me');

  it('applies its own score and notifies its listener once before sending SCORE_UPDATE', async () => {
    await startClient();
    const onScore = jest.fn();
    multiplayerService.onScoreUpdate(onScore);

    multiplayerService.updateScore(4);

    expect(me().score).toBe(4);
    expect(onScore).toHaveBeenCalledTimes(1);
    expect(onScore).toHaveBeenCalledWith('peer-me', 4);
    expect(onScore.mock.invocationCallOrder[0]).toBeLessThan(
      connection.send.mock.invocationCallOrder[0],
    );
    expect(connection.send).toHaveBeenCalledWith({
      type: 'SCORE_UPDATE',
      playerId: 'peer-me',
      score: 4,
    });
  });

  it('applies its own progress and totalQuestions before sending PLAYER_PROGRESS', async () => {
    await startClient();
    const onProgress = jest.fn();
    multiplayerService.onPlayerProgress(onProgress);

    multiplayerService.updateProgress(3, 10);

    expect(me().progress).toBe(3);
    expect(me().totalQuestions).toBe(10);
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith('peer-me', 3, 10);
    expect(connection.send).toHaveBeenCalledWith({
      type: 'PLAYER_PROGRESS',
      playerId: 'peer-me',
      progress: 3,
      totalQuestions: 10,
    });
  });

  it('marks itself finished with a finishTime before sending PLAYER_FINISH', async () => {
    await startClient();
    const onFinish = jest.fn();
    multiplayerService.onPlayerFinish(onFinish);

    multiplayerService.finishGame(7);

    // The host forwards PLAYER_FINISH to everyone but the sender, so nothing
    // else will ever write the joiner's own entry.
    expect(me().finished).toBe(true);
    expect(me().score).toBe(7);
    expect(me().finishTime).toBe(5000);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith('peer-me', 7, 5000);
    expect(connection.send).toHaveBeenCalledWith({
      type: 'PLAYER_FINISH',
      playerId: 'peer-me',
      score: 7,
      finishTime: 5000,
    });
  });

  it('still sends the message to the host unchanged', async () => {
    await startClient();

    multiplayerService.updateScore(2);
    multiplayerService.updateProgress(1, 10);
    multiplayerService.finishGame(2);

    expect(connection.send.mock.calls.map((call) => call[0])).toEqual([
      { type: 'SCORE_UPDATE', playerId: 'peer-me', score: 2 },
      {
        type: 'PLAYER_PROGRESS',
        playerId: 'peer-me',
        progress: 1,
        totalQuestions: 10,
      },
      {
        type: 'PLAYER_FINISH',
        playerId: 'peer-me',
        score: 2,
        finishTime: 5000,
      },
    ]);
  });

  it('does nothing when the host connection is closed', async () => {
    await startClient();
    connection.open = false;
    const onScore = jest.fn();
    const onProgress = jest.fn();
    const onFinish = jest.fn();
    multiplayerService.onScoreUpdate(onScore);
    multiplayerService.onPlayerProgress(onProgress);
    multiplayerService.onPlayerFinish(onFinish);

    multiplayerService.updateScore(4);
    multiplayerService.updateProgress(3, 10);
    multiplayerService.finishGame(4);

    expect(me().score).toBe(0);
    expect(me().progress).toBe(0);
    expect(me().finished).toBe(false);
    expect(me().finishTime).toBeUndefined();
    expect(onScore).not.toHaveBeenCalled();
    expect(onProgress).not.toHaveBeenCalled();
    expect(onFinish).not.toHaveBeenCalled();
    expect(connection.send).not.toHaveBeenCalled();
  });
});
