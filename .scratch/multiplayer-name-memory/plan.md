# Plan: remember the multiplayer player name

Slices are ordered so the gate is green after each. One commit each.

## S1. The pure rules and their test

**Files**: `services/playerName.ts` (new), `services/__tests__/playerName.test.js`
(new).

**Change**: export three functions.

```ts
// The name the field should show: what was remembered, else the profile name,
// else empty. Trimmed; an all-space value counts as absent.
export function resolveInitialName(remembered?: string | null, profileName?: string | null): string

// A name is playable when it has at least one non-space character. Matches the
// `!name.trim()` guard the multiplayer screens use before creating or joining.
export function isPlayableName(name: string): boolean

// What to store after a successful game action, or null when there is nothing
// worth remembering.
export function nameToRemember(name: string): string | null
```

`resolveInitialName` returns `''` when both inputs are empty or whitespace.
`nameToRemember` returns the trimmed name, or `null` when `isPlayableName` is
false, so callers cannot overwrite a good remembered name with junk.

**Test** (`services/__tests__/playerName.test.js`, matching the existing
`describe`/`it` style of the other suites, no React):
- remembered wins over profile;
- profile is used when nothing is remembered;
- empty string when neither is set;
- whitespace-only inputs are treated as absent;
- both inputs are trimmed;
- a remembered name of `'   '` falls through to the profile name;
- `isPlayableName` is false for `''`, `'   '`, true for `'A'`, `' Bob '`;
- `nameToRemember` returns `null` for whitespace, the trimmed value otherwise.

**Automated check**: `npx jest services/__tests__/playerName.test.js --ci`.
**Human check**: the nine cases above are exactly what the file asserts.

---

## S2. Persist it in the provider

**Files**: `components/Quizprovider.tsx`.

**Change**:
- Add `multiplayerName: string` and
  `setMultiplayerName: (name: string) => void` to `QuizContextType` beside
  `userName` (`:19-20`).
- New state beside `userNameState` (`:157`):
  `const [multiplayerNameState, setMultiplayerNameState] = useState<string>('')`.
- In the existing startup loader, next to the `userName` read at `:691-695`, read
  both keys in the same order they are needed:
  `AsyncStorage.getItem('multiplayerName')` and the already-read
  `savedUserName`, then call
  `setMultiplayerNameState(resolveInitialName(savedMultiplayerName, savedUserName))`.
  Do not write the key here; only resolve what to show.
- A `setMultiplayerName` callback beside `setUserName` (`:225-232`) that sets state
  and does `AsyncStorage.setItem('multiplayerName', name)`, with the same
  `console.error('Failed to save ...')` shape as its neighbours. It must not write
  when `nameToRemember(name)` is `null`.
- Expose both in the context value object (`:779-780` area).

**Automated check**: `npx tsc --noEmit && npx jest --ci`.
**Human check**: the new context members sit next to `userName` and use the same
save-and-log pattern as their neighbours; no new AsyncStorage key name is
invented anywhere else.

---

## S3. The lobby uses it

**Files**: `app/multiplayer/index.tsx`.

**Change**:
- `const { multiplayerName, setMultiplayerName } = useQuiz();`
- Keep `useState('')` for `name` (D7), add a `touched` ref. Fill from an effect:
  when `multiplayerName` is non-empty and the field is untouched, `setName` it.
  `markTouched` runs from the `TextInput`'s `onChangeText` (`:286`).
- Persist with `setMultiplayerName(name)` after a successful create (`:135`), a
  successful join (`:169`), and inside `handleInvitePlayer` after
  `createRoom` succeeds (`:193`). Not before, so a failed attempt does not
  overwrite the remembered name.
- Do not touch the presence effect (`:74-85`); D4 keeps it as it is.

**Automated check**: `npx tsc --noEmit && npx jest --ci && npx eslint ...`.
**Human check**: an empty field pre-fills on open; typing changes it; the create
and join paths each persist the name they actually used.

---

## S4. The deep-link prompt uses it

**Files**: `app/multiplayer/[code].tsx`.

**Change**:
- `const { quizzes, multiplayerName, setMultiplayerName } = useQuiz();`
  (`useQuiz` is already imported and used at `:77`).
- The deep-link branch enters `needsName` when the link carried no name
  (`:121-124`). Seed `typedName` from `multiplayerName` at the moment the prompt
  opens, and only when `typedName` is still empty, so a value the user typed is
  kept.
- On a successful join through that prompt, persist with
  `setMultiplayerName(typedName)`.
- When the link carried a `?name=`, persist that name too, so a shared link
  teaches the app the player's name.

**Automated check**: `npx tsc --noEmit && npx jest --ci`.
**Human check**: opening `/multiplayer/<code>` with no name shows the prompt
pre-filled; joining works; the next link does not need typing.

---

## Risk register

1. **Stomping typed input.** The async fill must never overwrite what the user is
   typing. Mitigation: the `touched` flag (D7), and a test-level human check.
2. **A remembered name breaking the e2e run.** `e2e/multiplayer.spec.ts` fills the
   field and expects its own text. `fill()` replaces, so this is safe, but the
   spec cannot be run here without a dev server; it is traced in code, not
   executed.
3. **Presence auto-connect changing visibility** (D4). Accepted knowingly, and
   named in the design so it is not a surprise later.
4. **`multiplayerName` empty on first ever run.** Then the field behaves exactly
   as today. No regression for a new user.

## Verification

```
npx tsc --noEmit
npx jest --ci
npx eslint . --ext .js,.jsx,.ts,.tsx     # exactly 1 pre-existing error
git status --porcelain                    # only .scratch/ untracked
```
