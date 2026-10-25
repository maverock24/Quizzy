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

describe('createRoom', () => {
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

  it('resolves a six-character code once the peer opens', async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);

    const promise = multiplayerService.createRoom('Ada');
    peer.handlers.open('quizzy-ABC234');

    const result = await promise;
    expect(result.ok).toBe(true);
    expect(result.code).toHaveLength(6);
    expect(Peer).toHaveBeenCalledWith(`quizzy-${result.code}`);
  });

  it('retries a taken code and succeeds on the third attempt', async () => {
    const peers = [makePeer(), makePeer(), makePeer()];
    peers.forEach((peer) => Peer.mockReturnValueOnce(peer));

    const promise = multiplayerService.createRoom('Ada');
    peers[0].handlers.error({ type: 'unavailable-id' });
    peers[1].handlers.error({ type: 'unavailable-id' });
    peers[2].handlers.open('quizzy-ZZZ999');

    const result = await promise;
    expect(Peer).toHaveBeenCalledTimes(3);

    const attemptedIds = Peer.mock.calls.map((call) => call[0]);
    expect(new Set(attemptedIds).size).toBe(3);
    expect(result).toEqual({ ok: true, code: attemptedIds[2].slice(7) });
  });

  it('gives up after three taken codes with could-not-create', async () => {
    const peers = [makePeer(), makePeer(), makePeer()];
    peers.forEach((peer) => Peer.mockReturnValueOnce(peer));

    const promise = multiplayerService.createRoom('Ada');
    peers[0].handlers.error({ type: 'unavailable-id' });
    peers[1].handlers.error({ type: 'unavailable-id' });
    peers[2].handlers.error({ type: 'unavailable-id' });

    await expect(promise).resolves.toEqual({
      ok: false,
      failure: 'could-not-create',
    });
    expect(Peer).toHaveBeenCalledTimes(3);
  });

  it('resolves timeout after ten seconds of no open', async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    const settled = jest.fn();
    promise.then(settled);

    jest.advanceTimersByTime(9999);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await expect(promise).resolves.toEqual({ ok: false, failure: 'timeout' });
  });

  it('leaves no timer armed once the peer opens', async () => {
    const peer = makePeer();
    Peer.mockReturnValue(peer);
    const promise = multiplayerService.createRoom('Ada');
    const settled = jest.fn();
    promise.then(settled);

    peer.handlers.open('quizzy-ABC234');
    await promise;
    expect(jest.getTimerCount()).toBe(0);

    jest.advanceTimersByTime(20000);
    await Promise.resolve();
    expect(settled).toHaveBeenCalledTimes(1);
  });
});
