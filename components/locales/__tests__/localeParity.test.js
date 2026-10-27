const fs = require('fs');
const path = require('path');

const en = require('../en.json');
const de = require('../de.json');
const fi = require('../fi.json');

const LOCALES = { en, de, fi };
const TRANSLATED_LOCALES = ['de', 'fi'];

// Keys whose absence is a known locale defect. Must be empty from S2 on.
const KNOWN_MISSING = [];

// Values that may legitimately equal the English value. The brand name, and
// German for "quiz" is "Quiz".
const IDENTICAL_TO_ENGLISH_ALLOWED = {
  de: ['quiz_title', 'tab_quiz'],
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

  it('has a value for every literal key used in the source', () => {
    const used = collectUsedKeys().filter(
      (name) => !KNOWN_MISSING.includes(name),
    );
    for (const language of Object.keys(LOCALES)) {
      const missing = used.filter((name) => !hasKey(LOCALES[language], name));
      expect({ language, missing }).toEqual({ language, missing: [] });
    }
  });
});
