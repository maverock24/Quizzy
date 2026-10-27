const fs = require('fs');
const path = require('path');

const en = require('../en.json');
const de = require('../de.json');
const fi = require('../fi.json');
const {
  DEFAULT_ACHIEVEMENTS,
  LEVEL_CONFIGS,
} = require('../../gamification/types');

const LOCALES = { en, de, fi };
const TRANSLATED_LOCALES = ['de', 'fi'];

// Keys whose absence is a known locale defect. Must be empty from S2 on.
const KNOWN_MISSING = [];

// Values that may legitimately equal the English value. The brand name, and
// German for "quiz" is "Quiz".
const IDENTICAL_TO_ENGLISH_ALLOWED = {
  de: ['quiz_title', 'tab_quiz', 'multiplayer_quiz_label'],
  fi: ['quiz_title'],
};

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SCAN_ROOTS = ['app', 'components', 'services'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const SKIPPED_DIRECTORIES = ['node_modules', '__tests__', '.scratch'];
// Literal `t('key')` / `i18n.t('key')` call sites only. Template and variable
// keys are deliberately out of scope here.
const T_CALL = /(?:\bt\(|i18n\.t\()\s*'([A-Za-z0-9_]+)'/g;

function hasKey(locale, name) {
  return Object.prototype.hasOwnProperty.call(locale, name);
}

function identicalToEnglish(language, name) {
  return hasKey(en, name) && hasKey(LOCALES[language], name)
    ? LOCALES[language][name] === en[name]
    : false;
}

function collectSourceFiles(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, found);
    } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      found.push(fullPath);
    }
  }
  return found;
}

function collectUsedKeys() {
  const keys = new Set();
  for (const root of SCAN_ROOTS) {
    for (const file of collectSourceFiles(path.join(REPO_ROOT, root))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(T_CALL)) keys.add(match[1]);
    }
  }
  return [...keys].sort();
}

// Some components hold a key in data and pass it to `t` by variable, so the
// literal-call scan cannot see it: `t(labelKey)`, `t(stage.nameKey)`,
// `t(celebration.key)`. Module scope may hold keys but never a `t()` result, so
// the convention is a `*Key` property, or a bare `key` in a keyed lookup list.
const KEY_PROPERTY = /(?:\b[A-Za-z]*Key|\bkey)\s*:\s*'([a-z][a-z0-9_]*)'/g;

function collectIndirectKeys() {
  const keys = new Set();
  for (const root of SCAN_ROOTS) {
    for (const file of collectSourceFiles(path.join(REPO_ROOT, root))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(KEY_PROPERTY)) keys.add(match[1]);
    }
  }
  return [...keys].sort();
}

// `t(`achievement_category_${category}`)` is built from the AchievementCategory
// union, so expand the union rather than the call site.
const CATEGORY_KEYS = ['streak', 'score', 'speed', 'volume', 'special'].map(
  (category) => `achievement_category_${category}`,
);

// i18next substitutes `{{name}}`; a name that does not match the call site
// renders the raw braces to the user, so every language must carry the same
// placeholder set as English.
const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

function placeholdersIn(value) {
  return [...String(value).matchAll(PLACEHOLDER)]
    .map((match) => match[1])
    .sort();
}

const unionKeys = [
  ...new Set(Object.keys(en).concat(Object.keys(de), Object.keys(fi))),
].sort();

describe('locale parity', () => {
  it('declares only exemptions that are real', () => {
    for (const name of KNOWN_MISSING) {
      const missingSomewhere = !Object.values(LOCALES).every((locale) =>
        hasKey(locale, name),
      );
      expect({ name, missingSomewhere }).toEqual({
        name,
        missingSomewhere: true,
      });
    }

    for (const [language, names] of Object.entries(
      IDENTICAL_TO_ENGLISH_ALLOWED,
    )) {
      for (const name of names) {
        expect({
          language,
          name,
          identical: identicalToEnglish(language, name),
        }).toEqual({ language, name, identical: true });
      }
    }
  });

  it('has the same keys in every locale', () => {
    for (const language of Object.keys(LOCALES)) {
      const missing = unionKeys.filter(
        (name) =>
          !hasKey(LOCALES[language], name) && !KNOWN_MISSING.includes(name),
      );
      expect({ language, missing }).toEqual({ language, missing: [] });
    }
  });

  it('does not ship untranslated values equal to the English value', () => {
    for (const language of TRANSLATED_LOCALES) {
      const allowed = IDENTICAL_TO_ENGLISH_ALLOWED[language] || [];
      const identical = Object.keys(LOCALES[language]).filter(
        (name) =>
          hasKey(en, name) &&
          LOCALES[language][name] === en[name] &&
          !allowed.includes(name),
      );
      expect({ language, identical }).toEqual({ language, identical: [] });
    }
  });

  // The achievement and level names/descriptions are template keys
  // (`achievement_<id>_name`, `level_<n>_title`), so the literal-call scan above
  // cannot see them. Walk the data instead and check every derived key.
  it('has a value for every key derived from the achievement and level data', () => {
    const derived = [];
    for (const achievement of DEFAULT_ACHIEVEMENTS) {
      derived.push(`achievement_${achievement.id}_name`);
      derived.push(`achievement_${achievement.id}_description`);
    }
    for (const level of LEVEL_CONFIGS) {
      derived.push(`level_${level.level}_title`);
    }

    expect(derived.length).toBe(53 * 2 + 25);

    for (const language of Object.keys(LOCALES)) {
      const missing = derived.filter(
        (name) => !hasKey(LOCALES[language], name),
      );
      expect({ language, missing }).toEqual({ language, missing: [] });
    }
  });

  it('has a value for every literal key used in the source', () => {
    const used = collectUsedKeys().filter(
      (name) => !KNOWN_MISSING.includes(name),
    );
    for (const language of Object.keys(LOCALES)) {
      const missing = used.filter((name) => !hasKey(LOCALES[language], name));
      expect({ language, missing }).toEqual({ language, missing: [] });
    }
  });

  // Keys reached through a variable resolution path, which the literal `t('x')`
  // scan above cannot see. A typo here renders the raw key to the user.
  it('has a value for every key held in data and passed to t by variable', () => {
    const indirect = [...new Set([...collectIndirectKeys(), ...CATEGORY_KEYS])];

    // Guard the scan itself: if the convention changes, this fails loudly
    // rather than quietly covering nothing.
    expect(indirect.length).toBeGreaterThanOrEqual(20);

    for (const language of Object.keys(LOCALES)) {
      const missing = indirect.filter(
        (name) => !hasKey(LOCALES[language], name),
      );
      expect({ language, missing }).toEqual({ language, missing: [] });
    }
  });

  it('uses the same interpolation placeholders in every language', () => {
    for (const language of TRANSLATED_LOCALES) {
      const mismatched = Object.keys(LOCALES[language])
        .filter((name) => hasKey(en, name))
        .map((name) => ({
          name,
          english: placeholdersIn(en[name]),
          translated: placeholdersIn(LOCALES[language][name]),
        }))
        .filter(
          ({ english, translated }) =>
            english.join(',') !== translated.join(','),
        );
      expect({ language, mismatched }).toEqual({ language, mismatched: [] });
    }
  });
});
