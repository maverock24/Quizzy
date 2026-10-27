import i18n from '@/components/i18n';

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
 * One sentence per failure. Each branch stands alone: no shared string, so a
 * wrong sentence can only come from a wrong cause. The translation is read per
 * call, never at module scope, so it follows the current language.
 */
export function failureMessage(failure: MultiplayerFailure): string {
  switch (failure) {
    case 'bad-code':
      return i18n.t('multiplayer_failure_bad_code');
    case 'room-not-found':
      return i18n.t('multiplayer_failure_room_not_found');
    case 'room-full':
      return i18n.t('multiplayer_failure_room_full');
    case 'incompatible':
      return i18n.t('multiplayer_failure_incompatible');
    case 'network':
      return i18n.t('multiplayer_failure_network');
    case 'connect-failed':
      return i18n.t('multiplayer_failure_connect_failed');
    case 'timeout':
      return i18n.t('multiplayer_failure_timeout');
    case 'could-not-create':
      return i18n.t('multiplayer_failure_could_not_create');
  }
}
