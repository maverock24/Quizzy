import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

// The locale files are the source of truth, so the sweep stays in step with them.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const en = require('../components/locales/en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const de = require('../components/locales/de.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fi = require('../components/locales/fi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const quizzesDe = require('../assets/quizzes_de.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const quizzesFi = require('../assets/quizzes_fi.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const essaysEn = require('../assets/essays_en.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const glossary = require('../assets/glossary.json');

type Locale = Record<string, string>;
const LOCALES: Record<string, Locale> = { en, de, fi };
const QUIZ_DATA: Record<string, unknown[]> = {
  de: quizzesDe,
  fi: quizzesFi,
};

/** Brand and bare units that read the same in every language. */
const ALWAYS_ALLOWED = ['Quizzy'];

/** A raw `lower_snake` token on screen means a missing key, not a translation. */
const RAW_KEY = /\b[a-z][a-z0-9]+(?:_[a-z0-9]+){1,}\b/g;
/** Identifiers that are meant to be shown verbatim. */
const INTENTIONAL_IDENTIFIERS = [
  /quizzes_user(\.json)?/g,
  /buggy_code(\.js)?/g,
  /script\.js/g,
  /app\/modal\.tsx/g,
];

/** Every string in the quiz, essay and glossary data, longest first. */
function contentStrings(language: 'de' | 'fi'): string[] {
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === 'string') parts.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') {
      for (const [key, nested] of Object.entries(
        value as Record<string, unknown>,
      )) {
        // Glossary term names are the object keys, not values.
        parts.push(key);
        walk(nested);
      }
    }
  };
  walk(QUIZ_DATA[language]);
  walk(essaysEn);
  walk(glossary);
  // Longest first, so a title is removed before a word inside it.
  return [...new Set(parts)]
    .filter((p) => p.length > 2)
    .sort((a, b) => b.length - a.length);
}

/**
 * Removes content (quiz titles, questions, essay and glossary text) from the
 * page text, so only interface chrome is left to inspect. Doing it by removal
 * rather than by suppressing words matters: the English essay data contains
 * common words like "save", which would otherwise blind the sweep.
 */
function stripContent(text: string, language: 'de' | 'fi'): string {
  let out = text;
  for (const content of contentStrings(language)) {
    if (out.includes(content)) out = out.split(content).join(' ');
  }
  return out;
}

/**
 * English text that must never appear on a screen in another language. Skipped
 * when the word also occurs inside a translated value or inside quiz content,
 * which is how loanwords ("Streak-Haustier", "Quiz") and content titles arrive.
 */
function englishOnlyValues(language: 'de' | 'fi') {
  const translated = LOCALES[language];
  const translatedBlob = Object.values(translated).join('\n').toLowerCase();

  return Object.keys(en)
    .filter((key) => translated[key] && translated[key] !== en[key])
    .map((key) => ({ key, english: (en[key] as string).trim() }))
    .filter(({ english }) => english.length > 3)
    .filter(({ english }) => !/^[\d\s.,:%×–-]+$/.test(english))
    .filter(({ english }) => !translatedBlob.includes(english.toLowerCase()))
    .filter(({ english }) =>
      ALWAYS_ALLOWED.every((allowed) => !english.includes(allowed)),
    );
}

function wordPattern(value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'u');
}

/** The text around a hit, so a failure says where it came from. */
function contextAround(text: string, needle: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const at = flat.indexOf(needle);
  if (at < 0) return '';
  return flat.slice(Math.max(0, at - 60), at + needle.length + 60);
}

type Screen = {
  name: string;
  path: string;
  /** Left unset for the onboarding sweep, which needs empty storage. */
  onboarded?: boolean;
  /** Extra AsyncStorage keys to seed before the screen mounts. */
  seed?: Record<string, string>;
  enter?: (page: Page) => Promise<void>;
};

function screensFor(language: 'de' | 'fi'): Screen[] {
  const translated = LOCALES[language];
  const clickText = async (page: Page, text: string) => {
    // Exact first: Playwright's default is a case-insensitive substring match,
    // so "Bearbeiten" would otherwise hit the row label "Eigene Quizze
    // bearbeiten" instead of the button that opens the editor.
    const target = page.getByText(text, { exact: true });
    const locator =
      (await target.count()) > 0
        ? target.first()
        : page.getByText(text, { exact: false }).first();
    // force: several of these sit in scroll views that never settle here.
    await locator.click({ force: true, timeout: 15000 });
    // Modals in this app mount late; too short a wait reads the screen before
    // the dialog exists and silently passes.
    await page.waitForTimeout(2600);
  };
  const clickKey = (page: Page, key: string) =>
    clickText(page, translated[key]);

  const modes = [
    'learn_mode_warmup_title',
    'learn_mode_compiler_title',
    'learn_mode_parsons_title',
    'learn_mode_faded_title',
    'learn_mode_bughunter_title',
  ];

  // The home screen lists categories; picking one reveals its quizzes, and
  // picking a quiz opens the question screen.
  const firstCategoryAndQuiz = () => {
    const data = QUIZ_DATA[language] as Array<Record<string, string>>;
    const first = data[0];
    const category = first.category || '';
    const inCategory = data.filter((quiz) => quiz.category === category);
    const quiz = inCategory[0] || first;
    return { category, quizName: quiz.name || quiz.nimi || '' };
  };

  return [
    { name: 'onboarding', path: '/', onboarded: false },
    { name: 'home', path: '/' },
    { name: 'learn-hub', path: '/learn' },
    ...modes.map((key) => ({
      name: `learn:${key}`,
      path: '/learn',
      enter: (page: Page) => clickKey(page, key),
    })),
    { name: 'profile', path: '/profile' },
    { name: 'settings', path: '/settings' },
    {
      name: 'settings:user-quiz-editor',
      path: '/settings',
      enter: (page: Page) => clickKey(page, 'settings_edit'),
    },
    {
      name: 'settings:save-quiz-json',
      path: '/settings',
      enter: async (page: Page) => {
        await clickKey(page, 'settings_edit');
        // Saving may be refused while the editor is empty; that is fine, the
        // point is whatever the dialog and the resulting alert say.
        try {
          await clickKey(page, 'save');
        } catch {
          // no-op: the screen was still read
        }
      },
    },
    {
      name: 'settings:reset',
      path: '/settings',
      enter: (page: Page) => clickKey(page, 'reset'),
    },
    {
      name: 'glossary',
      path: '/',
      enter: (page: Page) => clickKey(page, 'quiz_glossary'),
    },
    {
      name: 'quiz:answered',
      path: '/',
      enter: async (page: Page) => {
        const { category, quizName } = firstCategoryAndQuiz();
        await clickText(page, category.replace(/^\S+\s/, ''));
        await clickText(page, quizName);
        // Answer, so the feedback, explanation and next button all render.
        const data = QUIZ_DATA[language] as Array<Record<string, unknown>>;
        const questions = data[0].questions as Array<Record<string, unknown>>;
        const answers = questions[0].answers as Array<Record<string, string>>;
        // Any answer will do; try each until one lands, since some spellings
        // (curly quotes, ellipses) do not match the DOM text exactly.
        for (const option of answers) {
          try {
            await page
              .getByText(option.answer, { exact: false })
              .first()
              .click({ force: true, timeout: 6000 });
            break;
          } catch {
            // try the next option
          }
        }
        await page.waitForTimeout(2000);
      },
    },
    {
      name: 'kids:home',
      path: '/',
      seed: { kidsMode: 'true' },
    },
    {
      name: 'flashcards',
      path: '/',
      seed: { flashcardsEnabled: 'true' },
      enter: async (page: Page) => {
        const { category, quizName } = firstCategoryAndQuiz();
        await clickText(page, category.replace(/^\S+\s/, ''));
        await clickText(page, quizName);
      },
    },
    {
      name: 'reader',
      path: '/',
      seed: { readerModeEnabled: 'true' },
      enter: async (page: Page) => {
        const { category, quizName } = firstCategoryAndQuiz();
        await clickText(page, category.replace(/^\S+\s/, ''));
        await clickText(page, quizName);
      },
    },
    { name: 'modal', path: '/modal' },
    {
      name: 'quiz:question',
      path: '/',
      enter: async (page: Page) => {
        const { category, quizName } = firstCategoryAndQuiz();
        await clickText(page, category.replace(/^\S+\s/, ''));
        await clickText(page, quizName);
      },
    },
    {
      name: 'multiplayer:room',
      path: '/multiplayer',
      enter: (page: Page) => clickKey(page, 'multiplayer_create_game'),
    },
  ];
}

async function seedContext(
  browser: Browser,
  language: string,
  onboarded: boolean,
  seed: Record<string, string> = {},
): Promise<BrowserContext> {
  const context = await browser.newContext();
  await context.addInitScript(
    ([lang, isOnboarded, extra]) => {
      window.localStorage.clear();
      if (isOnboarded as boolean) {
        window.localStorage.setItem('onboardingCompleted', 'true');
        window.localStorage.setItem('userName', 'SweepUser');
      }
      window.localStorage.setItem('language', lang as string);
      for (const [key, value] of Object.entries(
        extra as Record<string, string>,
      )) {
        window.localStorage.setItem(key, value);
      }
      // The voice loader re-renders the tree about once a second in headless
      // Chromium, which hides screens behind constant churn.
      delete (window as unknown as { speechSynthesis?: unknown })
        .speechSynthesis;
    },
    [language, onboarded, seed],
  );
  return context;
}

/** Reads one screen and reports anything still in English or a raw key. */
async function inspect(page: Page, language: 'de' | 'fi', screen: Screen) {
  const candidates = englishOnlyValues(language);
  const found: { kind: string; text: string; key?: string }[] = [];

  // Bound every wait, so an unreachable screen fails fast and is reported.
  page.setDefaultTimeout(15000);

  // Native and browser dialogs never appear in innerText, so collect them.
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.message()} ${dialog.defaultValue()}`.trim());
    await dialog.dismiss();
  });

  await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  if (screen.enter) await screen.enter(page);

  let text = await page.locator('body').innerText();
  if (dialogs.length) text += `\n${dialogs.join('\n')}`;
  for (const identifier of INTENTIONAL_IDENTIFIERS) {
    text = text.replace(identifier, ' ');
  }
  text = stripContent(text, language);

  for (const { key, english } of candidates) {
    if (wordPattern(english).test(text)) {
      found.push({
        kind: 'english',
        text: `${english}  <- ...${contextAround(text, english)}...`,
        key,
      });
    }
  }

  for (const match of text.matchAll(RAW_KEY)) {
    found.push({ kind: 'raw-key', text: match[0] });
  }

  return found;
}

for (const language of ['de', 'fi'] as const) {
  test.describe(`i18n coverage sweep: ${language}`, () => {
    for (const screen of screensFor(language)) {
      test(`${screen.name} has no English interface text`, async ({
        browser,
      }) => {
        test.setTimeout(90000);
        const onboarded = screen.onboarded ?? true;
        const context = await seedContext(
          browser,
          language,
          onboarded,
          screen.seed,
        );
        const page = await context.newPage();

        let found;
        try {
          found = await inspect(page, language, screen);
        } finally {
          await context.close();
        }

        expect(
          found,
          `Untranslated text on ${language} at ${screen.name}:\n` +
            found
              .map(
                (f) =>
                  `  ${f.kind} ${JSON.stringify(f.text)}` +
                  (f.key ? ` (key ${f.key})` : ''),
              )
              .join('\n'),
        ).toEqual([]);
      });
    }
  });
}
