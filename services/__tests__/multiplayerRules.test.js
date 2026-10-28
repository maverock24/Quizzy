import {
  MAX_NAME_LENGTH,
  allFinished,
  applyJoin,
  connectedCount,
  findJoinTarget,
  isSenderAllowed,
  isValidQuiz,
  isValidQuizList,
  leadLabel,
  normalizeAnswer,
  occupiedCount,
  MAX_ROSTER,
  parseClientMessage,
  parseHostMessage,
  progressPercent,
  sanitizeJoin,
  scoreAnswer,
  standings,
  winnerOf,
} from '../multiplayerRules';

const player = (id, overrides = {}) => ({
  id,
  name: id,
  score: 0,
  progress: 0,
  finished: false,
  ...overrides,
});

describe('isSenderAllowed', () => {
  it('accepts a message that names the sender itself', () => {
    expect(isSenderAllowed('peer-a', 'peer-a')).toBe(true);
  });

  it('rejects the host sentinel even from the host sentinel', () => {
    // The host row is written by the host directly, never over a channel, so
    // a peer that registers the PeerJS id 'host' must not pass this gate.
    expect(isSenderAllowed('host', 'host')).toBe(false);
  });

  it('rejects any message whose sender is the host sentinel', () => {
    expect(isSenderAllowed('peer-b', 'host')).toBe(false);
  });

  it('rejects a message that names another player', () => {
    expect(isSenderAllowed('peer-b', 'peer-a')).toBe(false);
  });

  it('rejects a client claiming the host sentinel', () => {
    expect(isSenderAllowed('host', 'peer-a')).toBe(false);
  });

  it('rejects a message with no player id at all', () => {
    expect(isSenderAllowed(undefined, 'peer-a')).toBe(false);
  });
});

describe('findJoinTarget', () => {
  it('matches the token before the id', () => {
    const players = [
      player('peer-old', { token: 'tok-a', left: true }),
      player('peer-new', { token: 'tok-b' }),
    ];
    expect(findJoinTarget(players, 'tok-a', 'peer-new')).toBe(0);
  });

  it('ignores a token that belongs to a slot which is still live', () => {
    // A stolen token must not revive a slot that nobody left: the revive would
    // rewrite the victim's id and their own updates would then be foreign.
    const players = [
      player('host', { isHost: true, token: '' }),
      player('victim', { token: 'tok-stolen' }),
    ];
    expect(findJoinTarget(players, 'tok-stolen', 'peer-thief')).toBe(-1);
  });

  it('still matches a token on a slot that was left behind', () => {
    const players = [
      player('host', { isHost: true, token: '' }),
      player('victim', { token: 'tok-a', left: true }),
    ];
    expect(findJoinTarget(players, 'tok-a', 'peer-back')).toBe(1);
  });

  it('falls back to the id when the token is unknown', () => {
    const players = [player('peer-a', { token: 'tok-a' }), player('peer-b')];
    expect(findJoinTarget(players, 'tok-unknown', 'peer-b')).toBe(1);
  });

  it('returns -1 when neither the token nor the id is known', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    expect(findJoinTarget(players, 'tok-unknown', 'peer-b')).toBe(-1);
  });

  it('returns -1 for an empty token and an unknown id', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    expect(findJoinTarget(players, '', 'peer-b')).toBe(-1);
  });

  it('never matches the host entry, by token or by id', () => {
    const players = [
      player('host', { isHost: true, token: '' }),
      player('peer-a', { token: 'tok-a' }),
    ];
    expect(findJoinTarget(players, '', 'host')).toBe(-1);
    expect(findJoinTarget(players, 'tok-host', 'host')).toBe(-1);
  });
});

describe('applyJoin', () => {
  it('replaces the entry when the same id arrives again', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    const merged = applyJoin(
      players,
      player('peer-a', { name: 'Ana', token: 'tok-a' }),
    );
    expect(merged).not.toBe(players);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Ana');
  });

  it('replaces the entry with the same token and keeps its index', () => {
    const players = [
      player('host', { isHost: true, token: '' }),
      player('peer-old', { token: 'tok-a', left: true }),
      player('peer-b', { token: 'tok-b' }),
    ];
    const merged = applyJoin(players, player('peer-new', { token: 'tok-a' }));
    expect(merged.map((p) => p.id)).toEqual(['host', 'peer-new', 'peer-b']);
    expect(merged).not.toBe(players);
  });

  it('appends a player it has never seen', () => {
    const players = [player('host', { isHost: true, token: '' })];
    const merged = applyJoin(players, player('peer-a', { token: 'tok-a' }));
    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.id)).toEqual(['host', 'peer-a']);
  });

  it('keeps the host entry when a join carries the host token', () => {
    const players = [
      player('host', { name: 'Ada', isHost: true, token: 'tok-host' }),
    ];
    const merged = applyJoin(
      players,
      player('peer-a', { name: 'Mallory', token: 'tok-host' }),
    );
    expect(merged.find((p) => p.isHost).name).toBe('Ada');
    expect(merged.find((p) => p.isHost).token).toBe('tok-host');
  });

  it('ignores an empty token on another entry', () => {
    const players = [player('peer-a', { token: '' })];
    const merged = applyJoin(players, player('peer-b', { token: '' }));
    expect(merged.map((p) => p.id)).toEqual(['peer-a', 'peer-b']);
  });

  it('does not mutate the input array', () => {
    const players = [player('peer-a', { token: 'tok-a' })];
    applyJoin(players, player('peer-b', { token: 'tok-b' }));
    expect(players).toHaveLength(1);
  });
});

describe('allFinished', () => {
  it('is true for one finished player plus one who left', () => {
    const players = [
      player('peer-a', { finished: true, finishTime: 1000 }),
      player('peer-b', { left: true }),
    ];
    expect(allFinished(players)).toBe(true);
  });

  it('is false while an opponent still plays', () => {
    const players = [
      player('peer-a', { finished: true, finishTime: 1000 }),
      player('peer-b'),
    ];
    expect(allFinished(players)).toBe(false);
  });

  it('is false for a single player who is still playing', () => {
    expect(allFinished([player('peer-a')])).toBe(false);
  });

  it('is false for an empty room', () => {
    expect(allFinished([])).toBe(false);
  });
});

describe('winnerOf', () => {
  it('skips the player who left', () => {
    const players = [
      player('peer-a', {
        finished: true,
        score: 5,
        finishTime: 1000,
        left: true,
      }),
      player('peer-b', { finished: true, score: 3, finishTime: 2000 }),
    ];
    expect(winnerOf(players).id).toBe('peer-b');
  });

  it('breaks a score tie by the earlier finish time', () => {
    const players = [
      player('peer-late', { finished: true, score: 4, finishTime: 2000 }),
      player('peer-early', { finished: true, score: 4, finishTime: 1000 }),
    ];
    expect(winnerOf(players).id).toBe('peer-early');
  });

  it('returns null when nobody finished', () => {
    expect(winnerOf([player('peer-a'), player('peer-b')])).toBeNull();
  });
});

describe('standings', () => {
  // The joiner is the second entry the host ever writes, so the viewer must be
  // found by id and never by position.
  it('finds the viewer when the host is first in the roster', () => {
    const players = [
      player('host', { isHost: true, score: 1, token: '' }),
      player('peer-me', { score: 3, token: 'tok-me' }),
    ];
    const standing = standings(players, 'peer-me');
    expect(standing.you.id).toBe('peer-me');
    expect(standing.rival.id).toBe('host');
    expect(standing.ahead).toBe('you');
    expect(standing.lead).toBe(2);
  });

  it('finds the viewer and the rival by id', () => {
    const players = [
      player('host', { score: 7, progress: 8, totalQuestions: 31 }),
      player('peer-a'),
    ];
    const standing = standings(players, 'host');
    expect(standing.you.id).toBe('host');
    expect(standing.rival.id).toBe('peer-a');
  });

  it('reports the viewer ahead by the point gap', () => {
    const players = [
      player('host', { score: 7 }),
      player('peer-a', { score: 5 }),
    ];
    const standing = standings(players, 'host');
    expect(standing.ahead).toBe('you');
    expect(standing.lead).toBe(2);
  });

  it('reports a negative lead when the rival leads', () => {
    const players = [
      player('host', { score: 5 }),
      player('peer-a', { score: 7 }),
    ];
    const standing = standings(players, 'host');
    expect(standing.ahead).toBe('rival');
    expect(standing.lead).toBe(-2);
  });

  it('calls equal points a tie even when progress differs', () => {
    const players = [
      player('host', { score: 4, progress: 2 }),
      player('peer-a', { score: 4, progress: 7 }),
    ];
    const standing = standings(players, 'host');
    expect(standing.ahead).toBe('tied');
    expect(standing.lead).toBe(0);
  });

  it('prefers the rival who has not left', () => {
    const players = [
      player('host'),
      player('peer-old', { left: true }),
      player('peer-new'),
    ];
    expect(standings(players, 'host').rival.id).toBe('peer-new');
  });

  it('finds no viewer for a null id', () => {
    const players = [player('host'), player('peer-a')];
    const standing = standings(players, null);
    expect(standing.you).toBeUndefined();
    expect(standing.rival).toBeUndefined();
    expect(standing.ahead).toBe('none');
  });

  it('is none for a one-player roster', () => {
    const standing = standings([player('host')], 'host');
    expect(standing.you.id).toBe('host');
    expect(standing.rival).toBeUndefined();
  });
});

describe('leadLabel', () => {
  const you = (score) => player('host', { isHost: true, score, token: '' });
  const rival = (score, overrides = {}) =>
    player('peer-a', { score, token: 'tok-a', ...overrides });

  it('says how far ahead the viewer is', () => {
    expect(leadLabel(standings([you(7), rival(5)], 'host'))).toBe(
      "You're ahead by 2",
    );
  });

  it('says how far behind the viewer is', () => {
    expect(leadLabel(standings([you(5), rival(7)], 'host'))).toBe('2 behind');
  });

  it('calls equal points tied even when the progress differs', () => {
    const players = [you(4), rival(4, { progress: 7 })];
    expect(leadLabel(standings(players, 'host'))).toBe('Tied');
  });

  it('reports a departed rival instead of a lead', () => {
    expect(
      leadLabel(standings([you(9), rival(0, { left: true })], 'host')),
    ).toBe('Opponent left');
  });

  it('waits when there is nobody to compare with', () => {
    expect(leadLabel(standings([you(3)], 'host'))).toBe(
      'Waiting for your rival',
    );
  });
});

describe('progressPercent', () => {
  it('is the rounded share of questions answered', () => {
    const p = player('peer-a', { progress: 8, totalQuestions: 31 });
    expect(progressPercent(p, 31)).toBe(26);
  });

  it('falls back to the given total before the first answer', () => {
    const p = player('peer-a', { progress: 1, totalQuestions: 0 });
    expect(progressPercent(p, 4)).toBe(25);
  });

  it('never divides by zero', () => {
    const p = player('peer-a', { progress: 0, totalQuestions: 0 });
    expect(progressPercent(p, 0)).toBe(0);
  });

  it('clamps above a hundred', () => {
    const p = player('peer-a', { progress: 5, totalQuestions: 4 });
    expect(progressPercent(p, 4)).toBe(100);
  });
});

describe('connectedCount', () => {
  it('excludes the player who left', () => {
    const players = [
      player('peer-a'),
      player('peer-b', { left: true }),
      player('peer-c'),
    ];
    expect(connectedCount(players)).toBe(2);
  });

  it('counts everyone when nobody left', () => {
    expect(connectedCount([player('peer-a'), player('peer-b')])).toBe(2);
  });
});

describe('occupiedCount', () => {
  it('counts a departed slot that still holds its token', () => {
    const players = [
      player('host', { isHost: true }),
      player('peer-a', { left: true, token: 'tok-a' }),
    ];
    expect(occupiedCount(players)).toBe(2);
  });

  it('does not count a departed slot whose token is gone', () => {
    const players = [
      player('host', { isHost: true }),
      player('peer-a', { left: true, token: '' }),
    ];
    expect(occupiedCount(players)).toBe(1);
  });
});

describe('sanitizeJoin', () => {
  it('wipes the result fields a joiner could win with', () => {
    // The reported attack: a joiner claims the win in its JOIN.
    const joined = sanitizeJoin({
      id: 'peer-a',
      name: 'Mallory',
      score: 1e9,
      progress: 99,
      totalQuestions: 10,
      finished: true,
      finishTime: 1,
      left: false,
      token: 'tok-a',
    });

    expect(joined.score).toBe(0);
    expect(joined.progress).toBe(0);
    expect(joined.totalQuestions).toBe(0);
    expect(joined.finished).toBe(false);
    expect(joined.finishTime).toBeUndefined();
    expect(joined.left).toBe(false);
  });

  it('keeps the identity the join carries', () => {
    const joined = sanitizeJoin({
      id: 'peer-a',
      name: 'Ana',
      token: 'tok-a',
      joinedAt: '2024-01-01T00:00:00.000Z',
    });

    expect(joined.id).toBe('peer-a');
    expect(joined.name).toBe('Ana');
    expect(joined.token).toBe('tok-a');
    expect(joined.joinedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('caps the name at the shared limit', () => {
    const joined = sanitizeJoin({ id: 'peer-a', name: 'a'.repeat(50) });
    expect(joined.name).toHaveLength(MAX_NAME_LENGTH);
    expect(MAX_NAME_LENGTH).toBe(24);
  });

  it('coerces a name that is not a string to an empty one', () => {
    expect(sanitizeJoin({ id: 'peer-a', name: { text: 'Ana' } }).name).toBe('');
    expect(sanitizeJoin({ id: 'peer-a', name: 42 }).name).toBe('');
  });

  it('survives a payload that is not an object at all', () => {
    for (const value of [null, undefined, 7, 'JOIN', [], true]) {
      const joined = sanitizeJoin(value);
      expect(joined.id).toBe('');
      expect(joined.name).toBe('');
      expect(joined.score).toBe(0);
    }
  });
});

describe('parseClientMessage', () => {
  it('returns null for a null or non-object payload', () => {
    // Before this, `msg.type` on a null payload threw inside the host.
    for (const value of [null, undefined, 7, 'SCORE_UPDATE', true]) {
      expect(parseClientMessage(value)).toBeNull();
    }
  });

  it('returns null for a message type it does not know', () => {
    expect(parseClientMessage({ type: 'WELCOME' })).toBeNull();
    expect(parseClientMessage({ type: 'PLAYER_LEFT', playerId: 'host' })).toBe(
      null,
    );
    expect(parseClientMessage({})).toBeNull();
  });

  it('keeps a JOIN, with its result fields wiped', () => {
    const parsed = parseClientMessage({
      type: 'JOIN',
      player: { id: 'peer-a', name: 'Ana', token: 'tok-a', score: 1e9 },
    });
    expect(parsed).toEqual({
      type: 'JOIN',
      player: expect.objectContaining({
        id: 'peer-a',
        name: 'Ana',
        token: 'tok-a',
        score: 0,
        finished: false,
      }),
    });
  });

  it('returns null for a JOIN with no player object', () => {
    expect(parseClientMessage({ type: 'JOIN', player: null })).toBeNull();
    expect(parseClientMessage({ type: 'JOIN' })).toBeNull();
  });

  it('accepts a finite SCORE_UPDATE', () => {
    expect(
      parseClientMessage({
        type: 'SCORE_UPDATE',
        playerId: 'peer-a',
        score: 4,
      }),
    ).toEqual({ type: 'SCORE_UPDATE', playerId: 'peer-a', score: 4 });
  });

  it('clamps a SCORE_UPDATE to the highest score a quiz can hold', () => {
    const parsed = parseClientMessage({
      type: 'SCORE_UPDATE',
      playerId: 'peer-a',
      score: 1e9,
    });
    expect(parsed.score).toBe(1e6);

    const negative = parseClientMessage({
      type: 'SCORE_UPDATE',
      playerId: 'peer-a',
      score: -5,
    });
    expect(negative.score).toBe(0);
  });

  it('returns null for a SCORE_UPDATE whose score is not a finite number', () => {
    // `score: {}` used to reach the scoreboard and throw on render.
    for (const score of [{}, '4', null, NaN, Infinity, undefined]) {
      expect(
        parseClientMessage({ type: 'SCORE_UPDATE', playerId: 'peer-a', score }),
      ).toBeNull();
    }
  });

  it('returns null for a SCORE_UPDATE with no player id string', () => {
    for (const playerId of [undefined, null, 7, {}]) {
      expect(
        parseClientMessage({ type: 'SCORE_UPDATE', playerId, score: 1 }),
      ).toBeNull();
    }
  });

  it('accepts a bounded PLAYER_PROGRESS', () => {
    expect(
      parseClientMessage({
        type: 'PLAYER_PROGRESS',
        playerId: 'peer-a',
        progress: 3,
        totalQuestions: 10,
      }),
    ).toEqual({
      type: 'PLAYER_PROGRESS',
      playerId: 'peer-a',
      progress: 3,
      totalQuestions: 10,
    });
  });

  it('never lets the progress pass a known total', () => {
    const parsed = parseClientMessage({
      type: 'PLAYER_PROGRESS',
      playerId: 'peer-a',
      progress: 99,
      totalQuestions: 10,
    });
    expect(parsed.progress).toBe(10);
  });

  it('leaves the progress alone when the total is not known', () => {
    const parsed = parseClientMessage({
      type: 'PLAYER_PROGRESS',
      playerId: 'peer-a',
      progress: 5,
      totalQuestions: 0,
    });
    expect(parsed.progress).toBe(5);
  });

  it('clamps a PLAYER_PROGRESS beyond the question cap', () => {
    const parsed = parseClientMessage({
      type: 'PLAYER_PROGRESS',
      playerId: 'peer-a',
      progress: 1e9,
      totalQuestions: 1e9,
    });
    expect(parsed.progress).toBe(1e5);
    expect(parsed.totalQuestions).toBe(1e5);
  });

  it('returns null for a PLAYER_PROGRESS whose numbers are missing or not finite', () => {
    for (const progress of [undefined, {}, NaN, Infinity, '3']) {
      expect(
        parseClientMessage({
          type: 'PLAYER_PROGRESS',
          playerId: 'peer-a',
          progress,
          totalQuestions: 10,
        }),
      ).toBeNull();
    }
    expect(
      parseClientMessage({
        type: 'PLAYER_PROGRESS',
        playerId: 'peer-a',
        progress: 3,
      }),
    ).toBeNull();
  });

  it('accepts a PLAYER_FINISH with a time of zero or more', () => {
    expect(
      parseClientMessage({
        type: 'PLAYER_FINISH',
        playerId: 'peer-a',
        score: 5,
        finishTime: 0,
      }),
    ).toEqual({
      type: 'PLAYER_FINISH',
      playerId: 'peer-a',
      score: 5,
      finishTime: 0,
    });
  });

  it('returns null for a PLAYER_FINISH whose time is negative or absent', () => {
    for (const finishTime of [-1, undefined, {}, NaN, Infinity, '1000']) {
      expect(
        parseClientMessage({
          type: 'PLAYER_FINISH',
          playerId: 'peer-a',
          score: 5,
          finishTime,
        }),
      ).toBeNull();
    }
  });

  it('returns null for a PLAYER_FINISH with no player id string', () => {
    expect(
      parseClientMessage({
        type: 'PLAYER_FINISH',
        playerId: null,
        score: 5,
        finishTime: 10,
      }),
    ).toBeNull();
  });
});

describe('normalizeAnswer', () => {
  it('ignores case and surrounding space', () => {
    expect(normalizeAnswer('  Paris ')).toBe('paris');
  });

  it('leaves an answer that is already plain alone', () => {
    expect(normalizeAnswer('Paris')).toBe('paris');
  });
});

describe('scoreAnswer', () => {
  // The quiz the host holds when it starts the game.
  const quiz = {
    name: 'Capitals',
    questions: [
      {
        question: 'Capital of France?',
        answers: [{ answer: 'Paris' }, { answer: 'Lyon' }],
        answer: 'Paris',
      },
      {
        question: 'Capital of Italy?',
        answers: [{ answer: 'Rome' }, { answer: 'Milan' }],
        answer: 'Rome',
      },
    ],
  };

  it('scores the answer the quiz holds and advances the progress', () => {
    expect(scoreAnswer(quiz, 0, 'Paris', 0)).toEqual({
      correct: true,
      progress: 1,
    });
  });

  it('records a wrong answer as wrong and still advances', () => {
    expect(scoreAnswer(quiz, 1, 'Milan', 1)).toEqual({
      correct: false,
      progress: 2,
    });
  });

  it('compares the way the room screen does, trimmed and without case', () => {
    expect(scoreAnswer(quiz, 0, '  pARIS ', 0)).toEqual({
      correct: true,
      progress: 1,
    });
  });

  it('ignores a replay of an index the host already moved past', () => {
    // A double tap sends the same index twice; only the first may count.
    expect(scoreAnswer(quiz, 0, 'Paris', 1)).toBeNull();
  });

  it('ignores an index at or past the end of the quiz', () => {
    expect(scoreAnswer(quiz, 2, 'Paris', 2)).toBeNull();
    expect(scoreAnswer(quiz, 99, 'Paris', 0)).toBeNull();
  });

  it('ignores a negative index', () => {
    expect(scoreAnswer(quiz, -1, 'Paris', 0)).toBeNull();
  });

  it('ignores an index that is not an integer', () => {
    for (const index of [0.5, '0', null, undefined, NaN, Infinity, {}]) {
      expect(scoreAnswer(quiz, index, 'Paris', 0)).toBeNull();
    }
  });

  it('ignores a submission when there is no quiz to score against', () => {
    for (const missing of [undefined, null, {}, { name: 'q' }]) {
      expect(scoreAnswer(missing, 0, 'Paris', 0)).toBeNull();
    }
  });

  it('ignores a quiz that is not a quiz', () => {
    expect(
      scoreAnswer({ name: 'q', questions: [{ question: 'q' }] }, 0, 'A', 0),
    ).toBeNull();
  });

  it('ignores an answer that is not a string', () => {
    for (const answer of [undefined, null, 7, {}, ['Paris']]) {
      expect(scoreAnswer(quiz, 0, answer, 0)).toBeNull();
    }
  });

  it('accepts the current question, which is not a replay', () => {
    expect(scoreAnswer(quiz, 1, 'Rome', 1)).not.toBeNull();
  });
});

describe('isValidQuizList', () => {
  const quiz = () => ({
    name: 'Capitals',
    questions: [
      {
        question: 'Capital of France?',
        answers: [{ answer: 'Paris' }],
        answer: 'Paris',
      },
    ],
  });

  it('accepts a list of complete quizzes', () => {
    expect(isValidQuizList([quiz(), quiz()])).toBe(true);
  });

  it('refuses a value that is not an array', () => {
    for (const value of [null, undefined, 7, 'quiz', {}, true]) {
      expect(isValidQuizList(value)).toBe(false);
    }
  });

  it('refuses an empty list, which has nothing to render', () => {
    expect(isValidQuizList([])).toBe(false);
  });

  it('refuses a list holding one entry that is not a quiz', () => {
    expect(isValidQuizList([quiz(), null])).toBe(false);
    expect(isValidQuizList([quiz(), { name: 'no questions' }])).toBe(false);
    expect(isValidQuizList(['quiz'])).toBe(false);
  });
});

describe('isValidQuiz', () => {
  const question = () => ({
    question: 'What is the capital of France?',
    answers: [{ answer: 'Paris' }, { answer: 'Lyon' }],
    answer: 'Paris',
    explanation: 'Paris has been the capital since 987.',
  });

  it('accepts a quiz with one complete question', () => {
    expect(isValidQuiz({ name: 'Capitals', questions: [question()] })).toBe(
      true,
    );
  });

  it('accepts a question whose answers are only answer strings', () => {
    expect(
      isValidQuiz({
        name: 'Capitals',
        questions: [{ question: 'Q', answers: [{ answer: 'A' }], answer: 'A' }],
      }),
    ).toBe(true);
  });

  it('rejects anything that is not a quiz object', () => {
    for (const value of [null, undefined, 7, 'quiz', [], true]) {
      expect(isValidQuiz(value)).toBe(false);
    }
  });

  it('rejects a quiz with no questions', () => {
    expect(isValidQuiz({ name: 'Capitals', questions: [] })).toBe(false);
    expect(isValidQuiz({ name: 'Capitals' })).toBe(false);
    expect(isValidQuiz({ name: 'Capitals', questions: {} })).toBe(false);
  });

  it('rejects a question that is missing its fields', () => {
    const missingQuestion = { ...question() };
    delete missingQuestion.question;
    expect(isValidQuiz({ name: 'q', questions: [missingQuestion] })).toBe(
      false,
    );

    const missingAnswer = { ...question() };
    delete missingAnswer.answer;
    expect(isValidQuiz({ name: 'q', questions: [missingAnswer] })).toBe(false);

    expect(
      isValidQuiz({ name: 'q', questions: [{ ...question(), question: 7 }] }),
    ).toBe(false);
    expect(
      isValidQuiz({ name: 'q', questions: [{ ...question(), answer: null }] }),
    ).toBe(false);
    expect(isValidQuiz({ name: 'q', questions: [null] })).toBe(false);
  });

  it('rejects answers that are not objects with an answer string', () => {
    expect(
      isValidQuiz({
        name: 'q',
        questions: [{ ...question(), answers: ['Paris', 'Lyon'] }],
      }),
    ).toBe(false);
    expect(
      isValidQuiz({
        name: 'q',
        questions: [{ ...question(), answers: [{ answer: 7 }] }],
      }),
    ).toBe(false);
    expect(
      isValidQuiz({
        name: 'q',
        questions: [{ ...question(), answers: [null] }],
      }),
    ).toBe(false);
    expect(
      isValidQuiz({ name: 'q', questions: [{ ...question(), answers: [] }] }),
    ).toBe(true);
  });
});

describe('parseHostMessage', () => {
  const rosterEntry = (overrides = {}) => ({
    id: 'peer-a',
    name: 'Ada',
    score: 3,
    isHost: false,
    joinedAt: '2024-01-01T00:00:00.000Z',
    progress: 1,
    totalQuestions: 5,
    finished: false,
    left: false,
    ...overrides,
  });

  const state = (overrides = {}) => ({
    status: 'waiting',
    currentQuestionIndex: 0,
    ...overrides,
  });

  it('drops a payload that is not an object, instead of throwing on msg.type', () => {
    expect(parseHostMessage(null)).toBeNull();
    expect(parseHostMessage(undefined)).toBeNull();
    expect(parseHostMessage('WELCOME')).toBeNull();
    expect(parseHostMessage(7)).toBeNull();
    expect(parseHostMessage([])).toBeNull();
  });

  it('drops an unknown or missing type', () => {
    expect(parseHostMessage({})).toBeNull();
    expect(parseHostMessage({ type: 'DELETE_EVERYTHING' })).toBeNull();
  });

  it('accepts a well-formed WELCOME and normalises the roster', () => {
    const parsed = parseHostMessage({
      type: 'WELCOME',
      players: [rosterEntry({ id: 'host', isHost: true })],
      state: state(),
      quizId: 'q1',
    });
    expect(parsed.type).toBe('WELCOME');
    expect(parsed.players).toHaveLength(1);
    expect(parsed.quizId).toBe('q1');
  });

  it('never carries a token off the wire, even if the host sends one', () => {
    const parsed = parseHostMessage({
      type: 'WELCOME',
      players: [rosterEntry({ token: 'stolen-token' })],
      state: state(),
    });
    expect(parsed.players[0].token).toBeUndefined();
  });

  it('drops a WELCOME whose players is not an array', () => {
    expect(
      parseHostMessage({ type: 'WELCOME', players: 'nope', state: state() }),
    ).toBeNull();
  });

  it('drops a WELCOME whose roster exceeds the cap', () => {
    const players = Array.from({ length: MAX_ROSTER + 1 }, (_, i) =>
      rosterEntry({ id: 'peer-' + i }),
    );
    expect(
      parseHostMessage({ type: 'WELCOME', players, state: state() }),
    ).toBeNull();
  });

  it('drops a roster entry with a non-finite score', () => {
    for (const score of [NaN, Infinity, {}, 'many', null]) {
      expect(
        parseHostMessage({
          type: 'WELCOME',
          players: [rosterEntry({ score })],
          state: state(),
        }),
      ).toBeNull();
    }
  });

  it('clamps a score and a progress it accepts', () => {
    const parsed = parseHostMessage({
      type: 'WELCOME',
      players: [rosterEntry({ score: 1e12, progress: 9e9, totalQuestions: 5 })],
      state: state(),
    });
    expect(parsed.players[0].score).toBe(1e6);
    expect(parsed.players[0].progress).toBe(5);
  });

  it('drops a game state with an unknown status or a bad index', () => {
    expect(
      parseHostMessage({
        type: 'WELCOME',
        players: [],
        state: state({ status: 'pwned' }),
      }),
    ).toBeNull();
    expect(
      parseHostMessage({
        type: 'WELCOME',
        players: [],
        state: state({ currentQuestionIndex: NaN }),
      }),
    ).toBeNull();
  });

  it('drops a quiz the question view could not render', () => {
    const parsed = parseHostMessage({
      type: 'GAME_STATE',
      state: state({
        status: 'playing',
        quiz: { name: 'bad', questions: [{ question: 'q', answers: [] }] },
      }),
    });
    expect(parsed.state.quiz).toBeUndefined();
  });

  it('refuses a SCORE_UPDATE whose score is not a finite number', () => {
    expect(
      parseHostMessage({ type: 'SCORE_UPDATE', playerId: 'peer-a', score: {} }),
    ).toBeNull();
    expect(
      parseHostMessage({
        type: 'SCORE_UPDATE',
        playerId: 'peer-a',
        score: Infinity,
      }),
    ).toBeNull();
    expect(parseHostMessage({ type: 'SCORE_UPDATE', score: 4 })).toBeNull();
  });

  it('accepts a bounded SCORE_UPDATE', () => {
    expect(
      parseHostMessage({ type: 'SCORE_UPDATE', playerId: 'peer-a', score: 4 }),
    ).toEqual({ type: 'SCORE_UPDATE', playerId: 'peer-a', score: 4 });
  });

  it('refuses a negative finish time', () => {
    expect(
      parseHostMessage({
        type: 'PLAYER_FINISH',
        playerId: 'peer-a',
        score: 1,
        finishTime: -5,
      }),
    ).toBeNull();
  });
});

describe('parseHostMessage and the binary serializer', () => {
  // Regression: PeerJS's packer turns an absent `undefined` into `null` on the
  // wire, so a roster entry with `finishTime: null` used to be refused as
  // malformed and the whole WELCOME was dropped. The joiner then never saw the
  // host in its roster.
  it('treats null on an optional field as "not sent", not as malformed', () => {
    const parsed = parseHostMessage({
      type: 'WELCOME',
      players: [
        {
          id: 'host',
          name: 'HostUser',
          score: 0,
          isHost: true,
          joinedAt: '2024-01-01T00:00:00.000Z',
          progress: 0,
          totalQuestions: 0,
          finished: false,
          left: false,
          token: null,
          finishTime: null,
        },
      ],
      state: { status: 'waiting', currentQuestionIndex: 0, quizId: null },
    });
    expect(parsed).not.toBeNull();
    expect(parsed.type).toBe('WELCOME');
    expect(parsed.players[0].id).toBe('host');
    expect(parsed.players[0].finishTime).toBeUndefined();
  });
});
