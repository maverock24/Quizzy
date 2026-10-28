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

const QUIZ = {
  name: 'Capitals',
  questions: [
    {
      question: 'What is the capital of France?',
      answers: [{ answer: 'Paris' }, { answer: 'Lyon' }],
      answer: 'Paris',
      explanation: 'Paris has been the capital since 987.',
    },
    {
      question: 'What is the capital of Spain?',
      answers: [{ answer: 'Madrid' }, { answer: 'Seville' }],
      answer: 'Madrid',
      explanation: 'Madrid is the capital since 1561.',
    },
  ],
};

// Comfortably past the 16300 bytes at which PeerJS refuses to JSON a payload.
function bigQuiz() {
  const questions = Array.from({ length: 60 }, (_, i) => ({
    question: `Question ${i} ` + 'q'.repeat(120),
    answers: [
      { answer: `A ${i}` },
      { answer: `B ${i}` },
      { answer: `C ${i}` },
      { answer: `D ${i}` },
    ],
    answer: `A ${i}`,
    explanation: 'e'.repeat(120),
  }));
  return { name: 'Huge', questions };
}

const sentOfType = (conn, type) =>
  conn.send.mock.calls.map(([msg]) => msg).find((msg) => msg.type === type);

// The host fixes the question order once, so a payload is compared as a set:
// same questions, whatever order the shuffle produced.
const byQuestion = (questions) =>
  [...questions].sort((a, b) => a.question.localeCompare(b.question));

describe('the quiz in the game state', () => {
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

  // A host whose room already holds one joined client, which is the peer a
  // GAME_STATE broadcast reaches.
  const startHostWithAJoinedClient = async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    peer.handlers.open('quizzy-ABC234');
    await promise;

    const guest = makeConnection('peer-a');
    peer.handlers.connection(guest);
    guest.handlers.data({
      type: 'JOIN',
      player: player('peer-a', { name: 'Ana' }),
    });
    guest.send.mockClear();

    return { peer, guest };
  };

  // One client, from `new Peer()` to the host's WELCOME.
  const joinOnce = async () => {
    const peer = makePeer();
    const connection = makeConnection('quizzy-ABC234');
    peer.connect = jest.fn(() => connection);
    Peer.mockReturnValue(peer);

    const promise = multiplayerService.joinRoom('ABC234', 'Ana');
    peer.handlers.open('peer-a');
    connection.handlers.open();
    connection.handlers.data({
      type: 'WELCOME',
      players: [
        player('host', { isHost: true, name: 'Ada' }),
        player('peer-a'),
      ],
      state: { status: 'waiting', currentQuestionIndex: 0 },
    });
    await promise;

    return connection;
  };

  it('broadcasts the selected quiz inside GAME_STATE', async () => {
    const { guest } = await startHostWithAJoinedClient();

    multiplayerService.startGame(QUIZ);

    const gameState = sentOfType(guest, 'GAME_STATE');
    expect(gameState.state.status).toBe('playing');
    expect(gameState.state.quizId).toBe('Capitals');
    expect(byQuestion(gameState.state.quiz.questions)).toEqual(
      byQuestion(QUIZ.questions),
    );
    expect(gameState.state.quiz.name).toBe('Capitals');
  });

  it('gives the host and a joining peer the same question order', async () => {
    // A score is checked by question index, so every peer has to render the
    // order the host fixed rather than shuffling for itself.
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    peer.handlers.open('quizzy-ABC234');
    await promise;
    multiplayerService.startGame(QUIZ);

    const guest = makeConnection('peer-a');
    peer.handlers.connection(guest);
    guest.handlers.data({
      type: 'JOIN',
      player: player('peer-a', { name: 'Ana' }),
    });

    const welcome = sentOfType(guest, 'WELCOME');
    expect(welcome.state.quiz.questions).toEqual(
      multiplayerService.getGameState().quiz.questions,
    );
  });

  it('sends the quiz in WELCOME to a joining connection', async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    peer.handlers.open('quizzy-ABC234');
    await promise;
    multiplayerService.startGame(QUIZ);

    const guest = makeConnection('peer-a');
    peer.handlers.connection(guest);
    guest.handlers.data({
      type: 'JOIN',
      player: player('peer-a', { name: 'Ana' }),
    });

    const welcome = sentOfType(guest, 'WELCOME');
    expect(welcome.quizId).toBe('Capitals');
    expect(welcome.state.status).toBe('playing');
    expect(byQuestion(welcome.state.quiz.questions)).toEqual(
      byQuestion(QUIZ.questions),
    );
  });

  it('exposes the quiz a client receives through getGameState', async () => {
    const connection = await joinOnce();

    connection.handlers.data({
      type: 'GAME_STATE',
      state: {
        status: 'playing',
        currentQuestionIndex: 0,
        quizId: 'Capitals',
        startTime: 1000,
        quiz: QUIZ,
      },
    });

    expect(multiplayerService.getGameState().quiz).toEqual(QUIZ);
    expect(multiplayerService.getGameState().status).toBe('playing');
  });

  it('carries a quiz above 16300 bytes unchanged', async () => {
    const quiz = bigQuiz();
    expect(JSON.stringify(quiz).length).toBeGreaterThan(16300);

    const { guest } = await startHostWithAJoinedClient();
    multiplayerService.startGame(quiz);
    const state = sentOfType(guest, 'GAME_STATE').state;
    expect(JSON.stringify(state).length).toBeGreaterThan(16300);

    // A fresh module is a fresh client: it is fed the state the host
    // broadcast and has to expose every question unchanged.
    jest.resetModules();
    const ClientPeer = require('peerjs').default;
    ClientPeer.mockReset();
    const clientPeer = makePeer();
    const connection = makeConnection('quizzy-ABC234');
    clientPeer.connect = jest.fn(() => connection);
    ClientPeer.mockReturnValue(clientPeer);
    const client = require('../MultiplayerService').multiplayerService;

    const pending = client.joinRoom('ABC234', 'Ana');
    clientPeer.handlers.open('peer-a');
    connection.handlers.open();
    connection.handlers.data({
      type: 'WELCOME',
      players: [
        player('host', { isHost: true, name: 'Ada' }),
        player('peer-a'),
      ],
      state,
    });
    await pending;

    expect(client.getGameState().quiz.name).toBe('Huge');
    // Every question and every byte of it survives the trip; the order is the
    // one the host fixed.
    expect(client.getGameState().quiz.questions).toEqual(state.quiz.questions);
    expect(byQuestion(client.getGameState().quiz.questions)).toEqual(
      byQuestion(quiz.questions),
    );
  });
});
