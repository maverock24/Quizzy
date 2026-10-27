# Design tree

- **Slug**: multiplayer-name-memory
- **Tier**: full
- **Critical**: no

## End state

Opening multiplayer shows the name the player last actually played a game with,
pre-filled and editable. The same is true of a shared room link that arrives
without a `?name=`. Nobody types their name twice.

## Out of scope

- Renaming the profile. The multiplayer name is separate (D1); the profile
  greeting keeps using `userName`.
- Validating or reserving names. There is no uniqueness today and this does not
  add one.
- Any change to how the chosen name travels: it still goes as the `?name=`
  route param (`app/multiplayer/index.tsx:138,174,201`) and is still read at
  `app/multiplayer/[code].tsx:71-75`.
- The presence transport itself.

## Decisions

### D1. A separate remembered name, not the profile name

- **Status**: settled
- **Blocked by**: none
- **Decision**: new AsyncStorage key `multiplayerName`, seeded from the profile
  `userName` the first time there is nothing remembered. Changing the lobby name
  does not rename the profile. Honours "the last used name" literally.

### D2. Owned by `Quizprovider`, like every other persisted setting

- **Status**: settled
- **Blocked by**: none
- **Decision**: `components/Quizprovider.tsx` already owns every AsyncStorage
  backed setting (`userName` `:157`, `language` `:116`, `kidsMode`, the stats) and
  already reads them once at startup (`:691-695`). `multiplayerName` and its
  setter join the context there rather than duplicating AsyncStorage reads inside
  two screens. Both screens already render under the provider.

### D3. The rules live in a pure service with a test

- **Status**: settled
- **Blocked by**: none
- **Decision**: `services/playerName.ts` holds the pure rules, matching the repo's
  existing pattern (`roomCode.ts`, `timedRound.ts`, `answerMode.ts` each have a
  suite in `services/__tests__/`). The seed rule is
  `remembered || profile || ''`, normalised by trim. The playability rule is at
  least one non-space character, matching the `!name.trim()` guard the two screens
  use today at `app/multiplayer/index.tsx:128,162`.

### D4. Presence connects automatically once a name is pre-filled

- **Status**: settled
- **Blocked by**: none
- **Decision**: keep the existing `name.trim().length > 2` trigger at
  `app/multiplayer/index.tsx:74-85`. With a remembered name the lobby therefore
  connects on mount, so the player is visible and can receive invites without
  typing. Accepted knowingly: this makes every visitor to the multiplayer tab
  visible to other players.

### D5. The deep-link prompt gets the same memory

- **Status**: settled
- **Blocked by**: none
- **Decision**: `app/multiplayer/[code].tsx`'s separate prompt (`:121-124`, field
  at `:613`) pre-fills from the same value. The field stays shown so it can be
  changed before joining.

### D6. Saved when actually used, not on every keystroke

- **Status**: settled
- **Blocked by**: none
- **Decision**: persist on a successful create, a successful join, accepting an
  invite, and a deep link that carried a `?name=`. Not on every keystroke, so a
  half-typed name never becomes the remembered one.

### D7. Never stomp what the user is typing

- **Status**: settled
- **Blocked by**: none
- **Decision**: `multiplayerName` arrives asynchronously, so both screens start at
  `''` and fill from an effect only while the field is untouched. A `touched` flag
  flips on the first `onChangeText`, and the effect checks it. This is the bug a
  naive `useState(remembered)` would ship: the state would capture the empty
  string and never update.

### D8. The existing e2e must keep passing

- **Status**: settled, forced by evidence
- **Blocked by**: none
- **Decision**: `e2e/multiplayer.spec.ts` fills the host name and asserts
  `JoinerUser` appears (`:53`), and the joiner arrives via `?name=JoinerUser`
  (`:49`). Playwright's `fill()` overwrites a pre-filled value, so a default must
  not block typing. It must also not auto-submit anything: creating and joining
  stay explicit button presses.
