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

  // A ten-question quiz the host holds, so it can score what a client submits.
  const HOST_QUIZ = {
    name: 'Ten Questions',
    questions: Array.from({ length: 10 }, (_, i) => ({
      question: 'Question ' + i,
      answers: [{ answer: 'A' + i }, { answer: 'B' + i }],
      answer: 'A' + i,
    })),
  };

  // The host plus one joined client, which has already departed. The slot it
  // left behind holds a score and a progress, which a rejoin has to keep. A
  // JOIN only claims a place now and a client may not claim a score, so the
  // stats are earned by answering three questions and reporting the fourth.
  const startHostWithDepartedClient = async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    peer.handlers.open('quizzy-ABC234');
    await promise;

    const sender = makeConnection('peer-a');
    peer.handlers.connection(sender);
    sender.handlers.data({
      type: 'JOIN',
      player: player('peer-a', { name: 'Ana', token: 'token-ana' }),
    });
    multiplayerService.startGame(HOST_QUIZ);
    // The host scores these, so the slot ends up with three points. The order
    // is the host's, so each answer is read from the state it fixed.
    const questions = multiplayerService.getGameState().quiz.questions;
    for (const questionIndex of [0, 1, 2]) {
      sender.handlers.data({
        type: 'ANSWER',
        playerId: 'peer-a',
        questionIndex,
        answer: questions[questionIndex].answer,
      });
    }
    sender.handlers.data({
      type: 'PLAYER_PROGRESS',
      playerId: 'peer-a',
      progress: 4,
      totalQuestions: 10,
    });
    sender.send.mockClear();
    sender.handlers.close();

    return { peer, sender };
  };

  // A new connection sending one JOIN, as a client does on open.
  const joinAs = (peer, peerId, overrides = {}) => {
    const conn = makeConnection(peerId);
    peer.handlers.connection(conn);
    conn.handlers.data({
      type: 'JOIN',
      player: player(peerId, {
        name: 'Ana',
        token: 'token-ana',
        ...overrides,
      }),
    });
    return conn;
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

  it('revives the entry on a rejoin with a known token', async () => {
    const { peer } = await startHostWithDepartedClient();

    joinAs(peer, 'peer-a2');

    const ana = multiplayerService
      .getPlayers()
      .find((p) => p.token === 'token-ana');
    expect(ana).toBeDefined();
    expect(ana.id).toBe('peer-a2');
    expect(ana.name).toBe('Ana');
    expect(ana.left).toBe(false);
    expect(ana.isHost).toBe(false);
    // The stats the slot held survive the rejoin.
    expect(ana.score).toBe(3);
    expect(ana.progress).toBe(4);
    expect(ana.totalQuestions).toBe(10);
  });

  it('keeps the player count at two after a rejoin', async () => {
    const { peer } = await startHostWithDepartedClient();

    const rejoiner = joinAs(peer, 'peer-a2');

    expect(multiplayerService.getPlayers()).toHaveLength(2);
    expect(multiplayerService.getPlayers().map((p) => p.id)).toEqual([
      'host',
      'peer-a2',
    ]);

    const welcome = rejoiner.send.mock.calls
      .map(([msg]) => msg)
      .find((msg) => msg.type === 'WELCOME');
    expect(welcome.players).toHaveLength(2);
    expect(welcome.players.find((p) => p.id === 'peer-a2').score).toBe(3);
  });

  it('treats a rejoin after the grace as a new player', async () => {
    const { peer } = await startHostWithDepartedClient();

    jest.advanceTimersByTime(60000);
    // The slot is final: it is removed, not held open.
    expect(multiplayerService.getPlayers().map((p) => p.id)).toEqual(['host']);

    const late = joinAs(peer, 'peer-a2');

    // A new player, so the stats the slot held do not come back with it.
    const ana = multiplayerService.getPlayers().find((p) => p.id === 'peer-a2');
    expect(ana).toBeDefined();
    expect(ana.left).toBe(false);
    expect(ana.score).toBe(0);
    expect(ana.progress).toBe(0);
    expect(late.send).not.toHaveBeenCalledWith({ type: 'ROOM_FULL' });
  });

  it('refuses a stranger while the departed slot holds its place', async () => {
    const { peer } = await startHostWithDepartedClient();

    const stranger = joinAs(peer, 'peer-c', {
      name: 'Cal',
      token: 'token-cal',
    });

    expect(stranger.send).toHaveBeenCalledWith({ type: 'ROOM_FULL' });
    expect(stranger.close).toHaveBeenCalledTimes(1);
    expect(multiplayerService.getPlayers().map((p) => p.id)).toEqual([
      'host',
      'peer-a',
    ]);
  });

  it('keeps the place for a rejoin that arrives after a refused stranger', async () => {
    const { peer } = await startHostWithDepartedClient();

    joinAs(peer, 'peer-c', { name: 'Cal', token: 'token-cal' });
    joinAs(peer, 'peer-a2');

    // The old token still revives the slot, and only two are connected.
    const players = multiplayerService.getPlayers();
    expect(players.map((p) => p.id)).toEqual(['host', 'peer-a2']);
    expect(players.filter((p) => !p.left)).toHaveLength(2);
    expect(players.find((p) => p.id === 'peer-a2').score).toBe(3);
  });

  it('refuses a stranger after a rejoin has taken the place', async () => {
    const { peer } = await startHostWithDepartedClient();

    joinAs(peer, 'peer-a2');
    const stranger = joinAs(peer, 'peer-c', {
      name: 'Cal',
      token: 'token-cal',
    });

    expect(stranger.send).toHaveBeenCalledWith({ type: 'ROOM_FULL' });
    expect(multiplayerService.getPlayers().map((p) => p.id)).toEqual([
      'host',
      'peer-a2',
    ]);
    expect(multiplayerService.getPlayers().filter((p) => !p.left)).toHaveLength(
      2,
    );
  });

  it('clears the grace timer when the slot is revived', async () => {
    const { peer } = await startHostWithDepartedClient();
    expect(jest.getTimerCount()).toBe(1);

    joinAs(peer, 'peer-a2');
    expect(jest.getTimerCount()).toBe(0);

    // Nothing is left to fire, so the revived slot keeps its token and score.
    jest.advanceTimersByTime(60000);

    const ana = multiplayerService.getPlayers().find((p) => p.id === 'peer-a2');
    expect(ana.token).toBe('token-ana');
    expect(ana.left).toBe(false);
    expect(ana.score).toBe(3);
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
