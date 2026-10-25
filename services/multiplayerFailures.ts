export type MultiplayerFailure =
  | 'bad-code'
  | 'room-not-found'
  | 'room-full'
  | 'incompatible'
  | 'network'
  | 'connect-failed'
  | 'timeout'
  | 'could-not-create';

/** Maps a PeerJS error type to the cause the user should be told about. */
export function failureFromPeerError(type: string): MultiplayerFailure {
  switch (type) {
    case 'peer-unavailable':
      return 'room-not-found';
    case 'unavailable-id':
      return 'could-not-create';
    case 'browser-incompatible':
      return 'incompatible';
    case 'network':
      return 'network';
    case 'server-error':
      return 'network';
    case 'negotiation-failed':
      return 'connect-failed';
    default:
      return 'connect-failed';
  }
}

/**
 * One sentence per failure. Each literal stands alone: no shared string, so a
 * wrong sentence can only come from a wrong cause.
 */
export function failureMessage(failure: MultiplayerFailure): string {
  switch (failure) {
    case 'bad-code':
      return 'A room code is six letters and numbers';
    case 'room-not-found':
      return 'No room with that code';
    case 'room-full':
      return 'This room is already full';
    case 'incompatible':
      return 'This device cannot do multiplayer';
    case 'network':
      return 'Cannot reach the server, check the connection';
    case 'connect-failed':
      return 'Could not connect, try again';
    case 'timeout':
      return 'The room did not answer';
    case 'could-not-create':
      return 'Could not create a room, try again';
  }
}
