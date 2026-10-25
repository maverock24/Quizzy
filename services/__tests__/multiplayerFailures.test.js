import { failureFromPeerError, failureMessage } from '../multiplayerFailures';

const ALL_FAILURES = [
  'bad-code',
  'room-not-found',
  'room-full',
  'incompatible',
  'network',
  'connect-failed',
  'timeout',
  'could-not-create',
];

describe('failureFromPeerError', () => {
  it('reads an unavailable peer as a missing room', () => {
    expect(failureFromPeerError('peer-unavailable')).toBe('room-not-found');
  });

  it('reads a taken id as a create that did not work', () => {
    expect(failureFromPeerError('unavailable-id')).toBe('could-not-create');
  });

  it('reads an incompatible browser as an unsupported device', () => {
    expect(failureFromPeerError('browser-incompatible')).toBe('incompatible');
  });

  it('reads a network error as a network error', () => {
    expect(failureFromPeerError('network')).toBe('network');
  });

  it('reads a server error as a network error', () => {
    expect(failureFromPeerError('server-error')).toBe('network');
  });

  it('reads a failed negotiation as a failed connection', () => {
    expect(failureFromPeerError('negotiation-failed')).toBe('connect-failed');
  });

  it('falls back to a failed connection for an unknown error', () => {
    expect(failureFromPeerError('something-new')).toBe('connect-failed');
  });
});

describe('failureMessage', () => {
  it('gives every failure its own sentence', () => {
    const sentences = ALL_FAILURES.map(failureMessage);
    expect(new Set(sentences).size).toBe(8);
  });

  it('tells a full room apart from every other failure', () => {
    expect(failureMessage('room-full')).toBe('This room is already full');
  });
});
