# Remember the multiplayer player name

- **Slug**: multiplayer-name-memory
- **Tier**: full (two screens plus shared logic, and a persistence decision)
- **Critical**: no (no auth, payment, migration or infra path)
- **Stage**: Design

## What the owner said

> the user should be able to change the name for a multiplayer game but generally
> the last used named should be used as default so the user does not have to
> enter a new name always

Read as: the multiplayer name stays editable, and it pre-fills with whatever the
user last played as, instead of an empty field every time.

## Evidence gathered in this window

### There are two separate name entry points, both starting empty

1. **The lobby.** `app/multiplayer/index.tsx:40` is
   `const [name, setName] = useState('')`. That name is required before creating
   or joining:
   - `:128-130` guards create with `if (!name.trim())` → alert
     `multiplayer_required` / `multiplayer_enter_name_body`.
   - `:162-164` guards join the same way.
   - `:281-285` renders the field, label `multiplayer_your_name`, placeholder
     `multiplayer_enter_name`.
   - `:74-85` connects to presence once `name.trim().length > 2`.
   - The name travels onward in three places as a route param:
     `:138-140`, `:174-176`, `:201-203`, plus the invite path at `:192-206`.

2. **The deep-link prompt.** `app/multiplayer/[code].tsx:123-124` is
   `const [needsName, setNeedsName] = useState(false)` and
   `const [typedName, setTypedName] = useState('')`. The comment at `:121` says
   "Deep-link state: a room link without a name asks for one before joining". The
   field renders at `:613` with the same placeholder. A name arriving in the link
   is read at `:71-75` as `nameParam`.

So a fix that only touches the lobby leaves the deep-link path prompting every
time, and vice versa.

### A profile name already exists, and is already persisted

- `components/Quizprovider.tsx:19-20` — the context exposes `userName: string`
  and `setUserName: (name: string) => void`.
- `:157` — `const [userName, setUserNameState] = useState<string>('')`.
- `:225-232` — `setUserName` writes `AsyncStorage.setItem('userName', name)`.
- `:234-245` — `completeOnboarding` writes the same key.
- `:691-695` — on startup, `AsyncStorage.getItem('userName')` populates it.
- `app/(tabs)/profile.tsx:17,28-31` — the profile screen greets `userName`.

**Consequence the design must handle**: `userName` is `''` on first render and
fills in asynchronously after the AsyncStorage read. So
`useState(userName)` would capture the empty string and never update. Any default
needs an effect keyed on `userName`, and must not stomp a name the user has
already started typing.

### The repo's pattern for testable logic

`services/` holds tiny pure modules, each with a matching suite in
`services/__tests__/`: `roomCode.ts`, `multiplayerFailures.ts`,
`multiplayerRules.ts`, `timedRound.ts`, `answerMode.ts`. 14 suites, 154 tests
(the locale suite added earlier brings the total to 162). A name-resolution rule
belongs beside them rather than inline in a screen.

### Gate

- `npx tsc --noEmit` → clean.
- `npx jest --ci` → 16 suites, 162 tests, green.
- `npx eslint . --ext .js,.jsx,.ts,.tsx` → 1 pre-existing error in the generated
  `expo-env.d.ts:3:73`.
- `e2e/multiplayer.spec.ts:79` and the around-it assertions depend on the lobby
  name flow: it types a joiner name and asserts it appears
  (`:53 getByText('JoinerUser')`). A pre-filled default must not break that.

### Working tree

`git status --porcelain --untracked-files=no` → empty. Branch `master`, 19
commits ahead of `origin/master` from the i18n effort.

## Questions this stage must settle

1. **One identity or two?** Should the multiplayer name BE the profile name
   (shared, changing one changes the other), or a separate remembered value that
   can differ from the profile name?
2. **When is it saved?** On a successful create/join only, or as soon as the user
   types it?
3. **Does the deep-link prompt get the same memory?** It has its own field and its
   own state.
