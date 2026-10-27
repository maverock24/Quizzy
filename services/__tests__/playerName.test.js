import {
  isPlayableName,
  nameToRemember,
  resolveInitialName,
} from '../playerName';

describe('resolveInitialName', () => {
  it('prefers the remembered name over the profile name', () => {
    expect(resolveInitialName('LobbyLarry', 'ProfilePaula')).toBe('LobbyLarry');
  });

  it('falls back to the profile name when nothing is remembered', () => {
    expect(resolveInitialName(null, 'ProfilePaula')).toBe('ProfilePaula');
  });

  it('returns an empty string when neither name is set', () => {
    expect(resolveInitialName(null, null)).toBe('');
    expect(resolveInitialName(undefined, undefined)).toBe('');
  });

  it('treats a whitespace-only input as absent', () => {
    expect(resolveInitialName('   ', '')).toBe('');
    expect(resolveInitialName('', 'ProfilePaula')).toBe('ProfilePaula');
  });

  it('trims both inputs', () => {
    expect(resolveInitialName('  LobbyLarry ', '  ProfilePaula ')).toBe(
      'LobbyLarry',
    );
    expect(resolveInitialName('   ', '  ProfilePaula ')).toBe('ProfilePaula');
  });

  it('falls through to the profile name when the remembered name is blank', () => {
    expect(resolveInitialName('   ', 'ProfilePaula')).toBe('ProfilePaula');
  });
});

describe('isPlayableName', () => {
  it('rejects an empty name', () => {
    expect(isPlayableName('')).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    expect(isPlayableName('   ')).toBe(false);
  });

  it('accepts a single character', () => {
    expect(isPlayableName('A')).toBe(true);
  });

  it('accepts a padded name', () => {
    expect(isPlayableName(' Bob ')).toBe(true);
  });
});

describe('nameToRemember', () => {
  it('returns null for a whitespace-only name', () => {
    expect(nameToRemember('')).toBeNull();
    expect(nameToRemember('   ')).toBeNull();
  });

  it('returns the trimmed name', () => {
    expect(nameToRemember('  LobbyLarry ')).toBe('LobbyLarry');
  });
});
