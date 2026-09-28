import i18n from '@/components/i18n';
import { Quiz } from '@/components/types';
import {
  generateMultiplicationQuestions,
  MULTIPLICATION_GENERATOR,
} from './multiplicationProblems';

/**
 * Quiz definition for the multiplication-tables (Einmaleins 1–10) practice
 * round. The list only needs the metadata; `handleQuizSelection` regenerates
 * the problems so every play is a fresh set.
 */
export const createMultiplicationQuiz = (): Quiz => ({
  name: i18n.t('multiplication_quiz_name'),
  category: i18n.t('multiplication_quiz_category'),
  questions: generateMultiplicationQuestions(),
  generator: MULTIPLICATION_GENERATOR,
  inputMode: 'text',
  noShuffle: true,
});
