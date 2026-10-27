# 6 - Verification of three asserted claims

Scope: first-hand verification only. Every line below comes from a command run in
`/home/maverock24/gitrepos/Quizzy`. No code, no locale file and no test was modified.

---

## CLAIM A - the e2e tests pin English UI copy

**VERDICT: CONFIRMED.** All 8 cited assertions exist with the exact literal and the exact
line. The spec pins no language at all and depends entirely on the app defaulting to `en`.

### Every assertion in the spec that depends on a user-visible string

`read e2e/multiplayer.spec.ts` (82 lines) plus:

```
$ grep -n "getByText\|getByPlaceholder\|getByRole\|getByLabel\|toHaveText\|toContainText\|toHaveValue" e2e/multiplayer.spec.ts
34:    await expect(hostPage.getByText('Multiplayer Quiz')).toBeVisible();
36:    await hostPage.getByPlaceholder('Enter your name').fill('HostUser');
38:    await hostPage.getByText('Create New Game').click();
41:    await expect(hostPage.getByText('Room:', { exact: false })).toBeVisible({
53:    await expect(hostPage.getByText('JoinerUser')).toBeVisible({
58:      playerPage.getByText('Waiting for host to start...'),
60:    await expect(playerPage.getByText('HostUser').first()).toBeVisible({
65:    await hostPage.getByText('Select Quiz').click();
68:    await hostPage.getByText('🌐 Language').click();
72:      .getByText('Advanced Finnish Language & Complex Grammar')
76:    await hostPage.getByText('Start Game').click();
79:    await expect(hostPage.getByText('Question 1')).toBeVisible();
80:    await expect(playerPage.getByText('Question 1')).toBeVisible();
```

Status of the 8 claims from the brief:

| brief | line | literal | status |
|---|---|---|---|
| `:34 'Multiplayer Quiz'` | 34 | `'Multiplayer Quiz'` | confirmed |
| `:38 'Create New Game'` | 38 | `'Create New Game'` | confirmed |
| `:41 'Room:'` | 41 | `'Room:'`, `{ exact: false }` | confirmed (matcher is a substring match) |
| `:58 'Waiting for host to start...'` | 58 | `'Waiting for host to start...'` | confirmed |
| `:65 'Select Quiz'` | 65 | `'Select Quiz'` | confirmed |
| `:68 '🌐 Language'` | 68 | `'🌐 Language'` | confirmed |
| `:76 'Start Game'` | 76 | `'Start Game'` | confirmed |
| `:79 'Question 1'` | 79 | `'Question 1'` | confirmed |

Assertions the brief did not list (still string-dependent):

- `:36` `getByPlaceholder('Enter your name')`
- `:53` `getByText('JoinerUser')` and `:60` `getByText('HostUser').first()` - seeded player
  names, not app copy.
- `:72` `getByText('Advanced Finnish Language & Complex Grammar')` - quiz title from quiz
  data, not from `components/locales/`.
- `:80` a second `getByText('Question 1')` on the player page.

So the spec contains 12 string/locator assertions, of which 9 depend on English app-level
or quiz copy (`:34, :36, :38, :41, :58, :65, :68, :72, :76`) plus 2 on `'Question 1'`
(`:79`, `:80`).

### Where the pinned literals actually come from

Five of the eight are NOT translation keys at all. They are hardcoded English JSX in the
multiplayer screens:

```
$ for s in "Multiplayer Quiz" "Create New Game" "Waiting for host to start" "Start Game" "Room:"; do ...; done
=== 'Multiplayer Quiz'
app/multiplayer/index.tsx:231:              <Text style={styles.title}>Multiplayer Quiz</Text>
app/multiplayer/index.tsx:262:            <Text style={styles.title}>⚔️ Multiplayer Quiz</Text>
=== 'Create New Game'
app/multiplayer/index.tsx:289:                  <Text style={styles.buttonText}>🚀 Create New Game</Text>
=== 'Waiting for host to start'
app/multiplayer/[code].tsx:771:                      Waiting for host to start...
=== 'Start Game'
app/multiplayer/[code].tsx:728:                  <Text style={styles.buttonText}>🎮 Start Game</Text>
=== 'Room:'
app/multiplayer/[code].tsx:648:            <Text style={styles.title}>Room: {code}</Text>
```

The remaining ones do resolve to keys in `components/locales/en.json`:

```
$ python3 <substring lookup over en/de/fi>
'Select Quiz'      -> select_quiz : en='Select Quiz:'  de='Quiz auswählen:'  fi='Valitse tietovisa:'
'Language'         -> language    : en='Language'      de='Sprache'          fi='Kieli'
'Enter your name'  -> enter_name  : en='Enter your name' de='Gib deinen Namen ein' fi='Kirjoita nimesi'
'Question'         -> question    : en='Question'      de='Frage'            fi='Kysymys'
```

### Does the spec set a language?

No.

```
$ grep -rn "language\|languageCode\|locale\|localStorage\|i18n" e2e/ playwright.config.ts
e2e/multiplayer.spec.ts:12:      window.localStorage.setItem('onboardingCompleted', 'true');
e2e/multiplayer.spec.ts:13:      window.localStorage.setItem('userName', 'HostUser');
e2e/multiplayer.spec.ts:18:      window.localStorage.setItem('onboardingCompleted', 'true');
e2e/multiplayer.spec.ts:19:      window.localStorage.setItem('userName', 'JoinerUser');
```

The only `localStorage` writes are the onboarding flag and the player name. No
`language`, `languageCode`, `locale` or `i18n` token appears anywhere in `e2e/` or
`playwright.config.ts`. `e2e/` holds exactly one file:

```
$ ls e2e/ && wc -l e2e/*.ts
multiplayer.spec.ts
82 e2e/multiplayer.spec.ts
```

### playwright.config.ts

`baseURL` is `http://localhost:8081`, set under `use`. Full relevant block:

```ts
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx expo start --web',
    url: 'http://localhost:8081',
```

There is no `storageState`, no `globalSetup`, no `setup` project and no `locale` override.
The single project is `Desktop Chrome` with Playwright defaults, so `navigator.language`
is `en-US`.

### Why the default is English

`components/i18n.ts` picks the language at import time:

```
$ read components/i18n.ts
    const lang = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('fi')) return 'fi';
    return 'en';
  ...
i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: 'en',
```

With Chromium's `en-US`, `getInitialLanguage()` returns `'en'`. The spec therefore relies
on the ambient browser locale for every string assertion, and nothing in the harness pins
it.

---

## CLAIM B - locale key parity direction

**VERDICT: CORRECTED.** The sentence as written is true in the direction it states (0 keys
in `en` are missing from `de`, 0 from `fi`) but it is one-directional and hides a real
asymmetry: `de.json` carries 10 keys that `en.json` and `fi.json` do not have, all of them
live translation keys used by shipped code. `de` also has 121 keys against 111 for the
other two, and its key order diverges from `en` at index 53.

### Command and verbatim output

Script at `/tmp/parity.py`, run from the repo root:

```python
import json, collections
L = lambda f: json.load(open(f'components/locales/{f}.json'),
                        object_pairs_hook=collections.OrderedDict)
F = {f: L(f) for f in ('en','de','fi')}
for f in ('en','de','fi'):
    print(f'{f}.json: {len(F[f])} keys, nested values: {[k for k,v in F[f].items() if isinstance(v,(dict,list))]}')
for a,b in (('en','de'),('en','fi')):
    print(f'\nen-not-in-{b} ({len(set(F[a])-set(F[b]))}): {sorted(set(F[a])-set(F[b]))}')
    print(f'{b}-not-in-en ({len(set(F[b])-set(F[a]))}): {sorted(set(F[b])-set(F[a]))}')
for f in ('de','fi'):
    eo, fo = list(F['en']), list(F[f])
    if eo == fo: print(f'\norder: {f} == en')
    else:
        i = next(i for i,(x,y) in enumerate(zip(eo,fo)) if x!=y)
        print(f'\norder: {f} diverges from en at index {i}: en={eo[i]!r} {f}={fo[i]!r}')
for other in ('de','fi'):
    same = [k for k in F['en'] if k in F[other] and F['en'][k] == F[other][k]]
    print(f'\nbyte-identical en vs {other} ({len(same)}):')
    for k in same: print(f'  {k} = {F["en"][k]!r}')
```

Output, verbatim:

```
en.json: 111 keys, nested values: []
de.json: 121 keys, nested values: []
fi.json: 111 keys, nested values: []

en-not-in-de (0): []
de-not-in-en (10): ['multiplication_duration', 'multiplication_mode', 'multiplication_mode_count', 'multiplication_mode_timed', 'multiplication_quiz_category', 'multiplication_quiz_label_range', 'multiplication_quiz_name', 'multiplication_range_from', 'multiplication_range_start', 'multiplication_range_to']

en-not-in-fi (0): []
fi-not-in-en (0): []

order: de diverges from en at index 53: en='time_up' de='multiplication_quiz_name'

order: fi == en

byte-identical en vs de (2):
  enable_sound = 'Sound'
  max_level = 'Max Level!'

byte-identical en vs fi (1):
  quiz_title = 'Quizzy'
```

Cross-check of the counts by file size:

```
$ wc -c components/locales/*.json
 5116 components/locales/de.json
 4366 components/locales/en.json
 4550 components/locales/fi.json
```

All three files are flat: zero nested objects or arrays, so "key" here is always a single
top-level JSON property.

### Answers in the requested form

- keys in `en` but not in `de`: **none** (0)
- keys in `en` but not in `fi`: **none** (0)
- keys in `de` but not in `en`: **10**, the `multiplication_*` list above
- keys in `fi` but not in `en`: **none** (0)
- exact counts: `en` 111, `de` 121, `fi` 111
- key order: `fi` is identical to `en` (111 keys, same sequence). `de` diverges at index 53
  of 0-based enumeration, where `en` has `time_up` (en.json:55) and `de` has
  `multiplication_quiz_name` (de.json:55). The ten `multiplication_*` keys are inserted as
  a contiguous block at de.json:55-64, between `minutes` and `time_up`, which is what
  shifts every following key by 10 positions.

### The 10 `de`-only keys, with values

```
$ python3 ... (set(F['de']) - set(F['en']))
  'multiplication_duration'         = 'Dauer'
  'multiplication_mode'             = 'Modus'
  'multiplication_mode_count'       = '20 Aufgaben'
  'multiplication_mode_timed'       = 'Zeit'
  'multiplication_quiz_category'    = '🔢 Mathematik'
  'multiplication_quiz_label_range' = 'Einmaleins ({{from}}×{{from}} bis {{to}}×{{to}})'
  'multiplication_quiz_name'        = 'Einmaleins (1×1 bis 10×10)'
  'multiplication_range_from'       = 'Von'
  'multiplication_range_start'      = 'Los geht’s'
  'multiplication_range_to'         = 'Bis'
```

These are not dead data. All ten are referenced by shipped code:

```
$ grep -rn "multiplication_" --include=*.ts --include=*.tsx . | grep -v node_modules
./app/(tabs)/index.tsx:524:                  ? t('multiplication_quiz_label_range', {
./components/kids/MultiplicationRangeSheet.tsx:36:  { mode: 'count', labelKey: 'multiplication_mode_count' },
./components/kids/MultiplicationRangeSheet.tsx:37:  { mode: 'timed', labelKey: 'multiplication_mode_timed' },
./components/kids/MultiplicationRangeSheet.tsx:96:          <Text style={styles.title}>{t('multiplication_quiz_name')}</Text>
./components/kids/MultiplicationRangeSheet.tsx:98:            <Text style={styles.label}>{t('multiplication_mode')}</Text>
./components/kids/MultiplicationRangeSheet.tsx:129:              <Text style={styles.label}>{t('multiplication_duration')}</Text>
./components/kids/MultiplicationRangeSheet.tsx:134:              <Text style={styles.label}>{t('multiplication_range_from')}</Text>
./components/kids/MultiplicationRangeSheet.tsx:138:              <Text style={styles.label}>{t('multiplication_range_to')}</Text>
./components/kids/MultiplicationRangeSheet.tsx:155:                {t('multiplication_range_start')}
./services/MultiplicationQuiz.ts:14:  name: i18n.t('multiplication_quiz_name'),
./services/MultiplicationQuiz.ts:15:  category: i18n.t('multiplication_quiz_category'),
```

`en.json` and `fi.json` contain no key matching `multiplication`:

```
$ grep -in "multiplic\|table\|times" components/locales/en.json
101:  "progress_info": "Answer correctly {{remaining}} more times to master this question",
$ grep -in "multiplic\|kertotaulu\|taulu" components/locales/fi.json
(no output)
```

Since `components/i18n.ts` registers `resources: { en, de, fi }` with `fallbackLng: 'en'`,
an `en` or `fi` render of these ten call sites has no value in either the active or the
fallback resource. That is a statement about the resource contents; the rendered result of
a miss is i18next behaviour and was not exercised here.

### Byte-identical values across locales

en vs de, 2 keys:

| key | value | en.json | de.json |
|---|---|---|---|
| `enable_sound` | `Sound` | :24 | :24 |
| `max_level` | `Max Level!` | :63 | :73 |

en vs fi, 1 key:

| key | value | en.json | fi.json |
|---|---|---|---|
| `quiz_title` | `Quizzy` | :2 | :2 |

Notes on identical values, listed without judgement:

- `quiz_title` = `Quizzy` in both `en` and `fi`: a brand name. `de` is the exception,
  `de.json:2` is `"Quizzy (DE)"`, which is why `de` does not appear in this list.
- `enable_sound` = `Sound`: `Sound` is a loanword that German uses, so this can be a
  legitimate translation rather than a leftover. Not adjudicated here.
- `max_level` = `Max Level!`: the only byte-identical pair with no brand or loanword
  explanation.
- No key has values that differ only by case or surrounding whitespace
  (`lower()+strip()` comparison returned zero additional pairs), and no `en` value is
  empty or free of letters.

---

## CLAIM C - exact user-facing string counts in `services/`

**VERDICT: CORRECTED for both files.** `multiplayerFailures.ts` has **8** user-facing
sentences, not 7, and they span `:38-:52` (not `:40-52` or `:40-55`; the file is 54 lines).
`leadLabel` in `multiplayerRules.ts` has **5** user-facing strings across `:129-:132`, not
4. Both files were read in full. The returned strings are rendered directly to the user in
both cases, never used as error codes.

### `services/multiplayerFailures.ts` (54 lines, read in full)

Signature and callers-side contract:

```ts
export type MultiplayerFailure =
  | 'bad-code' | 'room-not-found' | 'room-full' | 'incompatible'
  | 'network' | 'connect-failed' | 'timeout' | 'could-not-create';

export function failureFromPeerError(type: string): MultiplayerFailure   // :12

export function failureMessage(failure: MultiplayerFailure): string      // :35
```

`failureMessage` takes the union value (an internal code) and returns a sentence. The
switch is exhaustive over all 8 union members, with no `default`, so the return is never
`undefined`.

Every user-facing string, verbatim with line:

```
$ grep -n "" services/multiplayerFailures.ts | sed -n '20,60p'
35:export function failureMessage(failure: MultiplayerFailure): string {
36:  switch (failure) {
37:    case 'bad-code':
38:      return 'A room code is six letters and numbers';
39:    case 'room-not-found':
40:      return 'No room with that code';
41:    case 'room-full':
42:      return 'This room is already full';
43:    case 'incompatible':
44:      return 'This device cannot do multiplayer';
45:    case 'network':
46:      return 'Cannot reach the server, check the connection';
47:    case 'connect-failed':
48:      return 'Could not connect, try again';
49:    case 'timeout':
50:      return 'The room did not answer';
51:    case 'could-not-create':
52:      return 'Could not create a room, try again';
53:  }
54:}
```

| # | line | literal |
|---|---|---|
| 1 | 38 | `A room code is six letters and numbers` |
| 2 | 40 | `No room with that code` |
| 3 | 42 | `This room is already full` |
| 4 | 44 | `This device cannot do multiplayer` |
| 5 | 46 | `Cannot reach the server, check the connection` |
| 6 | 48 | `Could not connect, try again` |
| 7 | 50 | `The room did not answer` |
| 8 | 52 | `Could not create a room, try again` |

**True count: 8.** The remaining string literals in the file are the 8 union members at
`:2-9`, the 7 switch arms at `:14-27` returning those same codes, and none of those is
user-facing text.

### How callers use the return value: rendered directly, not as a code

```
$ grep -rn "failureMessage" --include=*.ts --include=*.tsx . | grep -v node_modules
./app/multiplayer/index.tsx:24:import { failureMessage } from '../../services/multiplayerFailures';
./app/multiplayer/index.tsx:141:        showAlert('Cannot create a room', failureMessage(result.failure));
./app/multiplayer/index.tsx:145:      showAlert('Cannot create a room', failureMessage('could-not-create'));
./app/multiplayer/index.tsx:171:        showAlert('Cannot join', failureMessage(result.failure));
./app/multiplayer/index.tsx:175:      showAlert('Cannot join', failureMessage('connect-failed'));
./app/multiplayer/index.tsx:198:        showAlert('Cannot create a room', failureMessage(result.failure));
./app/multiplayer/index.tsx:202:      showAlert('Cannot send invite', failureMessage('network'));
./app/multiplayer/[code].tsx:21:import { failureMessage } from '../../services/multiplayerFailures';
./app/multiplayer/[code].tsx:321:      setRejoinError(failureMessage(result.failure));
```

The body of the alert is the returned sentence verbatim:

```ts
// app/multiplayer/index.tsx:27
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};
```

In `[code].tsx` the return value becomes state and is rendered inside `<Text>` at three
places:

```
app/multiplayer/[code].tsx:122:  const [rejoinError, setRejoinError] = useState('');
app/multiplayer/[code].tsx:321:      setRejoinError(failureMessage(result.failure));
app/multiplayer/[code].tsx:524-525:  {rejoinError !== '' && ( <Text style={styles.rejoinError}>{rejoinError}</Text>
app/multiplayer/[code].tsx:606-608:  ... <Text style={styles.rejoinError}>{rejoinError}</Text>
app/multiplayer/[code].tsx:743-747:  ... <Text style={styles.rejoinError}>{rejoinError}</Text>
```

So `failureMessage` output is user-visible prose in a `window.alert` / `Alert.alert` body
and in three `<Text>` nodes. It is never compared, mapped or switched on.

The 4 alert titles passed alongside it are additional hardcoded English in `app/`, not in
`services/`: `'Cannot create a room'` (`:141`, `:145`, `:198`), `'Cannot join'` (`:171`,
`:175`), `'Cannot send invite'` (`:202`), and `'Required'` / `'Please enter your name'`
(`:127`, `:155`).

### `services/multiplayerRules.ts` (158 lines, read in full)

```
$ grep -n "" services/multiplayerRules.ts | sed -n '118,140p'
123:/**
124: * The one line above the two rows. Points decide, so equal points read `Tied`
125: * however far apart the two are through the quiz.
126: */
127:export function leadLabel(standing: Standing): string {
128:  const { you, rival, lead, ahead } = standing;
129:  if (!you || !rival) return 'Waiting for your rival';
130:  if (rival.left) return 'Opponent left';
131:  if (ahead === 'rival') return `${-lead} behind`;
132:  return ahead === 'you' ? `You're ahead by ${lead}` : 'Tied';
133:}
```

| # | line | literal |
|---|---|---|
| 1 | 129 | `Waiting for your rival` |
| 2 | 130 | `Opponent left` |
| 3 | 131 | `` `${-lead} behind` `` (e.g. `3 behind`) |
| 4 | 132 | `` `You're ahead by ${lead}` `` |
| 5 | 132 | `Tied` (the else branch of the same ternary) |

**True count: 5**, in 4 source lines: `:132` holds two distinct strings. Both interpolated
forms carry an English word order, so a plain value translation alone cannot localise them.

Everything else in `multiplayerRules.ts` that looks like a string is internal:

```
$ grep -n "'[^']*'" services/multiplayerRules.ts
18:export const HOST_SENTINEL = 'host';
69:  const target = findJoinTarget(players, joined.token ?? '', joined.id);
95:export type Ahead = 'you' | 'rival' | 'tied' | 'none';
114:  if (!you) return { lead: 0, ahead: 'none' };
117:  if (!rival) return { you, lead: 0, ahead: 'none' };
119:  const ahead: Ahead = lead > 0 ? 'you' : lead < 0 ? 'rival' : 'tied';
```

Those are a sentinel id, a token default, and the `Ahead` discriminant union. None is
rendered.

### Every place `leadLabel` is imported and rendered

```
$ grep -rn "leadLabel" --include=*.ts --include=*.tsx . | grep -v node_modules
./components/MultiplayerScoreboard.tsx:5:  leadLabel,
./components/MultiplayerScoreboard.tsx:73:        {leadLabel(standing)}
./services/multiplayerRules.ts:127:export function leadLabel(standing: Standing): string {
```

One call site in the whole repo, rendered straight into a `<Text>`:

```
// components/MultiplayerScoreboard.tsx:63-74
  const standing = standings(players, myId);
  const { you, rival, ahead } = standing;
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.lead,
          (ahead === 'none' || rival?.left === true) && styles.leadMuted,
        ]}
      >
        {leadLabel(standing)}
      </Text>
```

Not used as a code: the styling decision above it reads the `Ahead` discriminant from
`standing`, not the label.

### Other user-facing literals elsewhere in `services/`

A literal scan over all 12 files under `services/` (1614 lines) plus a context read of
each hit:

```
services/                      MultiplayerService.ts MultiplicationQuiz.ts PresenceService.ts
                               __tests__ androidUpdate.ts answerMode.ts multiplayerFailures.ts
                               multiplayerRules.ts multiplicationProblems.ts roomCode.ts
                               sessionToken.ts timedRound.ts
```

Excluded by the stated rules, with the reason:

- `MultiplayerService.ts:194, 216, 333, 342, 348` and `PresenceService.ts:127, 150, 153,
  176` are all `console.log` / `console.warn` / `console.error` arguments.
- `MultiplayerService.ts:367` `'Dropped JOIN from '` is a `console.warn`.
- `PresenceService.ts:122` `throw new Error('Network response was not ok')` never reaches
  the UI: it is thrown inside `pollLobby` and swallowed two lines later by
  `catch (error) { console.warn('Lobby poll failed:', error); }` (`:126-127`).
- `roomCode.ts`, `answerMode.ts`, `timedRound.ts`, `sessionToken.ts`,
  `multiplicationProblems.ts` hold no user-facing literal: only `'host'`-style sentinels,
  a `'quizzy-multiplayer-token'` storage key, a `token-` id prefix, and type unions.
- `MultiplicationQuiz.ts:14-15` uses `i18n.t(...)` keys, not literals.

**Thrown `Error` messages that DO reach the user: `services/androidUpdate.ts`.** All four
throws are in `services/`, and three of them land in an `Alert.alert` body and an on-screen
error line:

```
$ grep -rn "throw new Error" services/*.ts
services/androidUpdate.ts:61:      throw new Error(`Unable to load release info (${resp.status})`);
services/androidUpdate.ts:84:    throw new Error('APK install is only available on Android.');
services/androidUpdate.ts:89:    throw new Error('No writable storage directory available.');
services/androidUpdate.ts:96:    throw new Error(`APK download failed (HTTP ${download.status}).`);
```

`:61` is swallowed: `fetchLatestRelease` wraps the whole body in `try { ... } catch { return
null; }` (`:56-67`), so its message is never shown. The other three are shown:

```ts
// app/(tabs)/settings.tsx:104-110
    try {
      await installAndroidRelease(androidRelease);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to install update.';
      setUpdateError(msg);
      Alert.alert('Update failed', msg);
    }
```

`updateError` is then rendered in the settings row:

```
app/(tabs)/settings.tsx:486:                  : updateError || 'Checking for updates…'}
```

So `APK install is only available on Android.` (`:84`), `No writable storage directory
available.` (`:89`) and `` `APK download failed (HTTP ${status}).` `` (`:96`) are English
user-facing strings living in `services/`, with no translation path at all. They are not
covered by either file the brief discussed.

### Totals for claim C

| file | brief said | fragment said | verified |
|---|---|---|---|
| `services/multiplayerFailures.ts` | 7, around `:40-52` | 8, around `:40-55` | **8**, at `:38, 40, 42, 44, 46, 48, 50, 52` |
| `services/multiplayerRules.ts` `leadLabel` | 4, at `:129-132` | 5 | **5**, at `:129, 130, 131, 132` (two on `:132`) |
| missed elsewhere in `services/` | - | - | **3** English `Error` messages in `androidUpdate.ts` (`:84`, `:89`, `:96`) that are displayed |
