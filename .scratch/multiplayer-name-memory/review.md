# Review: remember the multiplayer player name

- **Branch**: `qrspi/multiplayer-name-memory`, 4 commits on `534e467`
- **Reviewer**: adversarial pass, read-only (no production code changed)

## Verdict

**Needs one fix before merge.** The pure rules, the persistence placement and
the key hygiene are correct. One functional hole against D1: the seed from the
profile name is computed once at provider load, so the exact user the feature
exists for (a brand-new player who just typed their name into onboarding) still
faces an empty field on their first multiplayer visit. Nothing CRITICAL. The
D7 race the design worries about is not reachable, and nothing tests the wiring.

## Findings

| # | Severity | File:line | What is wrong | Concrete fix |
|---|----------|-----------|---------------|--------------|
| 1 | MAJOR | `components/Quizprovider.tsx:718-719` and `:251-252` | The profile seed is a one-shot snapshot taken at load. `loadSettings()` resolves `multiplayerName` from `(savedMultiplayerName, savedUserName)` before the children ever render. On a fresh install both keys are empty, so it resolves to `''`. The user then completes onboarding, and `completeOnboarding` sets `userNameState` only. Nothing recomputes `multiplayerName`, and `loadSettings` is never called again (`:775-777` is the only call site). Result: the first multiplayer visit after onboarding shows an empty field, which is precisely the case D1 says must be seeded. The lobby effect cannot rescue it because its dependency is `multiplayerName`, which never changes. | Make onboarding seed the remembered name without writing storage: in `completeOnboarding`, after `setUserNameState(name)`, add `setMultiplayerNameState((prev) => resolveInitialName(prev, name));`. `resolveInitialName` already keeps a real remembered name over the profile one, and writes stay confined to `setMultiplayerName`, so D1's "does not rename the profile" and D6's "saved when actually used" both still hold. |
| 2 | MINOR | `services/playerName.ts:23-25` | `isPlayableName` has no production caller. The exported rule is used only by its own suite; the two screens still guard with `!name.trim()` (`app/multiplayer/index.tsx:141,176`) and the provider guards with `nameToRemember(name) === null` (`components/Quizprovider.tsx:241-242`), which reimplements the same test. D3 presents this as the single shared playability rule, so the code claims a seam it does not provide. | Either call it where the rule is enforced (`if (!isPlayableName(name))` in both handlers and inside `nameToRemember`), or delete it and its four tests and let `resolveInitialName`/`nameToRemember` be the whole contract. |
| 3 | MINOR | `components/Quizprovider.tsx:245` + `:710` | No suite imports `Quizprovider.tsx` or either screen (`grep -rln "Quizprovider\|app/multiplayer" services/__tests__ components/**/__tests__` returns nothing), so the whole wiring is unverified: swapping the two arguments at `:719`, changing one key string, dropping a `setMultiplayerName` call, or an effect that stomps typed input all leave 174 tests green. | Cheapest real guard, since the key is the one thing that fails silently: export the key from the service (`export const MULTIPLAYER_NAME_KEY = 'multiplayerName'`) and use it at `:245` and `:710`, then assert the constant in the suite so two divergent literals become impossible rather than merely absent. |
| 4 | MINOR | `app/multiplayer/index.tsx:78-82`, `app/multiplayer/[code].tsx:343-347` | The D7 guard protects against a race that cannot happen as described. `QuizProvider` returns `null` while `!isLanguageReady` (`components/Quizprovider.tsx:796-798`) and `setIsLanguageReady(true)` runs only after `await loadSettings()` (`:775-777`), so both screens mount with `multiplayerName` already resolved. After mount the only writer is a successful join, which writes the value the field already holds. The `touched` refs are harmless but load-bearing the moment the provider's gating changes, and nothing tests them. | Keep the guard, but say why in the comment: the current comment ("arrives asynchronously") is not true of the mounted tree. A one-line truth saves the next reader from trusting a race that is not there. |
| 5 | NIT | `app/multiplayer/index.tsx:304-308`, `app/multiplayer/[code].tsx:628-631` | The handlers can only set `touched`, never clear it, so deleting the whole field permanently disables the refill for that mount. Consistent with D7's "never stomp", but a player who clears the box cannot get the remembered name back without retyping it. | If that is unwanted, reset the flag when the text is empty: `if (text === '') nameTouched.current = false;`. |
| 6 | NIT | `app/multiplayer/index.tsx:207-213` | `handleInvitePlayer` has no `!name.trim()` guard, unlike create (`:141`) and join (`:176`), so it can create a room with an empty player name. The new code handles this correctly by declining to persist, which means the bad state is silently swallowed instead of reported. Pre-existing, adjacent, not introduced here. | Leave the persistence as it is and add the missing guard at the top of `handleInvitePlayer` in a separate change. |

## Verified correct (attacked, held)

- **D6 persistence placement.** All four call sites sit inside `if (result.ok)`: `app/multiplayer/index.tsx:151` (create), `:188` (join, which the accepted-invite path at `:239` also goes through), `:213` (invite create), `app/multiplayer/[code].tsx:321` (every successful room entry: prompt, `?name=`, rejoin). No call can fire on a failed attempt.
- **Blank name cannot overwrite storage.** `setMultiplayerName` returns before `setMultiplayerNameState` and before the write when `nameToRemember` yields `null` (`components/Quizprovider.tsx:240-243`), and the early return skips both halves, so state and storage stay consistent. The only reachable blank caller is the prompt's `onSubmitEditing` (`[code].tsx:632`, the button is guarded at `:637`), which then correctly leaves both untouched.
- **D1 profile isolation.** The only writes to `'userName'` are `Quizprovider.tsx:232` (`setUserName`, which no screen calls) and `:257` (`completeOnboarding`), plus the e2e init script. The profile greeting reads `userName` only (`app/(tabs)/profile.tsx:17,28-31`). Changing the lobby name cannot reach it.
- **Key hygiene.** `multiplayerName` appears as a storage key exactly twice, `Quizprovider.tsx:245` (write) and `:710` (read), both the same literal. No other file names the key.
- **Provider reachability and re-render cost.** `app/_layout.tsx:126-152` wraps the `Stack` in `QuizProvider`, and `app/multiplayer/_layout.tsx` nests inside it, so both screens are inside the provider and `useQuiz` cannot throw. The context value is a fresh object literal every render (`Quizprovider.tsx:801`), so every consumer already re-renders on any provider render; the new field adds one provider render per successful join and no new subscription. No regression traced.
- **Gate.** `npx tsc --noEmit` clean. `npx jest --ci` 17 suites, 174 tests, green. `npx eslint . --ext .js,.jsx,.ts,.tsx` exactly one error, the pre-existing `expo-env.d.ts:3:73`.

## What I could not prove

- **The e2e spec was not executed.** No dev server. Traced in code only: Playwright's `fill()` replaces the value, and the host asserts its own typed text (`e2e/multiplayer.spec.ts:41`), so the profile seed `HostUser` from the `addInitScript` at `:13` is overwritten harmlessly. Nothing auto-submits: the lobby input has no `onSubmitEditing` (`app/multiplayer/index.tsx:298-312`), and the room prompt's `onSubmitEditing` fires only on an Enter key (`[code].tsx:632`). The joiner arrives with `?name=JoinerUser` (`:49`), so its prompt never opens and the roster assertion at `:53` sees the same single entry as before. **Unproven but plausible risk**: D4's presence auto-connect now fires on the host's lobby mount in the e2e run, where before it did not (the profile seed gives the field a length above 2). `presenceService.poll` swallows its own failures (`services/PresenceService.ts:120-145`), so no crash path is traced, but the timing effect on `expect(...).toBeVisible({ timeout: 25000 })` was not observed.
- **Finding 1 was proven from code order, not from a running app.** The chain is `loadSettings` at `components/Quizprovider.tsx:775` before `setIsLanguageReady` at `:777`, `completeOnboarding` at `:251` touching only `userNameState`, and no second `loadSettings` call anywhere. Observing it needs a fresh install plus onboarding, which I did not drive.
- **The D7 stomp race.** I could not construct a sequence that reaches it (finding 4). The strongest candidate, a provider value arriving after the screen mounted, is excluded by the provider's `isLanguageReady` gate on children.
- **A `useRef` surviving renders but not remounts is right here.** The room screen's rejoin and the lobby's return from `router.replace('/multiplayer')` both land on a fresh mount, which reseeds from memory. That is the wanted behaviour; I state it as traced, not tested.

## Mutation results

Baseline checksums before any mutation, and after restoration:

```
aa7afbfe921abcbffc84d8d9c405c064a92b79c13d0c9cc871809a3c2c3a13bb  services/playerName.ts
d4a7b302b07a1b9df69dfa1ba38da0b6d049971e76cce78f58de04f3553f0bd6  services/__tests__/playerName.test.js
```

Each mutation was applied to `services/playerName.ts` only, run with
`npx jest services/__tests__/playerName.test.js --ci`, then the file was restored
from `/tmp/playerName.orig.ts` and re-checksummed.

| # | Mutation | Observed | Verdict |
|---|----------|----------|---------|
| M1 | `resolveInitialName` drops normalisation and trims nothing: `a = typeof remembered === 'string' ? remembered : ''` / `return a \|\| b` | 3 failed, 9 passed. Failures: "treats a whitespace-only input as absent", "trims both inputs", "falls through to the profile name when the remembered name is blank" | caught |
| M2 | `resolveInitialName` swaps the fallback order: `return normalize(profileName) \|\| normalize(remembered)` | 2 failed, 10 passed. Failures: "prefers the remembered name over the profile name", "trims both inputs" | caught |
| M3 | `resolveInitialName` returns the whitespace input, missing-only counts as absent: `if (typeof remembered === 'string') return remembered; return typeof profileName === 'string' ? profileName : ''` | 3 failed, 9 passed. Same three cases as M1 | caught |
| M4 (extra) | `nameToRemember` loses the null contract: `return trimmed;` instead of `return trimmed === '' ? null : trimmed;` | 1 failed, 11 passed. Failure: "returns null for a whitespace-only name" | caught |

Restoration proof: after M4 the working copy was restored and
`sha256sum services/playerName.ts` returned
`aa7afbfe921abcbffc84d8d9c405c064a92b79c13d0c9cc871809a3c2c3a13bb`, identical to
the baseline, and `git diff --stat` is empty. The suite file was never touched and
still hashes `d4a7b302b07a1b9df69dfa1ba38da0b6d049971e76cce78f58de04f3553f0bd6`.

**What the suite would NOT catch.** Everything outside the pure module. Within
`playerName.ts` the twelve assertions bite on all four plausible breakages above,
so the module is genuinely tested rather than tautological. But no test imports
`Quizprovider.tsx` or either screen, so all of the following stay green while
shipping a broken feature:

- swapping the two arguments at `components/Quizprovider.tsx:719` (the
  remembered name and the profile name are both plain strings, so `tsc` is silent
  too);
- any divergence between the read key at `:710` and the write key at `:245`;
- deleting any of the four `setMultiplayerName` calls;
- an effect that stomps typed input, or a `touched` flag wired to the wrong
  handler;
- finding 1 in full, including its fix: no assertion anywhere couples
  `completeOnboarding` to the multiplayer seed.

A single test that renders nothing and only asserts the shared key constant would
close the highest-value half of that gap (finding 3).

## Tree state

`git status --porcelain` shows only the untracked `.scratch/` directories and the
added `.scratch/multiplayer-name-memory/review.md`. The throwaway copies of
`services/playerName.ts` lived in `/tmp` and are noted here; nothing under the
repository other than this file was written, and `services/playerName.ts` is
byte-identical to its committed content.

---

## Resolution (orchestrator)

Fixed in `aada0fe`.

**MAJOR — first lobby after onboarding opened blank.** Confirmed by reading the
order, not just the report: `loadSettings` runs once (`components/Quizprovider.tsx:776`)
and on a fresh install resolves `resolveInitialName('', '')` to `''`;
`completeOnboarding` then set `userNameState` only, and nothing re-ran the seed,
so `multiplayerName` stayed empty. The lobby effect could not recover it because
its dependency is `multiplayerName`, which never changed. Fixed by seeding in
`completeOnboarding`:

```ts
setMultiplayerNameState((prev) => resolveInitialName(prev, name));
```

Display only, so D6 still keeps the storage write for the first real game
action. Traced end to end: fresh install resolves `''`, onboarding with `Alice`
resolves `Alice`, and a returning player with a remembered `Bobby` still wins
over a profile name of `Alice`.

**MINOR — `isPlayableName` had no production caller.** Fixed by using it for the
two blank-name guards that were duplicating `!name.trim()`
(`app/multiplayer/index.tsx:141,180`). The rule now has one definition.

**MINOR — the provider wiring is untested.** Accepted, and stated plainly: the
pure module has 12 tests that bite (proven by four mutations), but no suite
imports the provider or either screen, so a typo in an AsyncStorage key or a
dropped persist call would stay green. The suite catches the rule, not the
wiring. Adding a React render test for two screens would need the PeerJS and
presence transports mocked, which is a larger change than this feature.

**NIT — no way to un-touch the field.** Accepted. Once the player has typed, the
default never applies again for that mount. That is the intended reading of D7:
a remembered name must never overwrite an edit.

**NIT — `handleInvitePlayer` has no trim guard.** Pre-existing; inviting only
renders once a playable name exists, so the field cannot be blank there.

Gate after the fix: `npx tsc --noEmit` clean, `npx jest --ci` 17 suites /
174 tests green, `npx eslint` exactly one error, the pre-existing
`expo-env.d.ts:3:73`.

Still unproven, and unchanged by the fix: the Playwright suite was not executed
and no dev server was started, so the e2e interaction and the newly reachable
presence auto-connect on the lobby's mount are traced in code, not observed.
