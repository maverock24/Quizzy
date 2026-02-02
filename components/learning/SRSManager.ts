/**
 * SRSManager - Spaced Repetition System using SM-2 algorithm
 * Tracks question performance and schedules reviews based on forgetting curve
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SRSQuestionData, QuizQuestion } from '../types';

const SRS_STORAGE_KEY = '@quizzy_srs_data';
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

export interface SRSReviewQuestion {
    questionId: string;
    quizName: string;
    question: string;
    answers: { answer: string }[];
    correctAnswer: string;
    explanation: string;
    srsData: SRSQuestionData;
}

/**
 * Generate a unique ID for a question based on quiz name and question text
 */
export const generateQuestionId = (quizName: string, questionText: string): string => {
    // Simple hash-like ID based on quiz name and first 50 chars of question
    const normalized = `${quizName}::${questionText.substring(0, 50)}`;
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `q_${Math.abs(hash).toString(36)}`;
};

/**
 * Load all SRS data from storage
 */
export const loadSRSData = async (): Promise<Record<string, SRSQuestionData>> => {
    try {
        const stored = await AsyncStorage.getItem(SRS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load SRS data:', error);
    }
    return {};
};

/**
 * Save SRS data to storage
 */
export const saveSRSData = async (data: Record<string, SRSQuestionData>): Promise<void> => {
    try {
        await AsyncStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save SRS data:', error);
    }
};

/**
 * Get or create SRS data for a question
 */
export const getQuestionSRSData = (
    allSRSData: Record<string, SRSQuestionData>,
    quizName: string,
    questionText: string
): SRSQuestionData => {
    const questionId = generateQuestionId(quizName, questionText);

    if (allSRSData[questionId]) {
        return allSRSData[questionId];
    }

    // Create new SRS data - question is due immediately for first review
    return {
        questionId,
        quizName,
        nextReviewDate: Date.now(),
        interval: 0,
        easeFactor: DEFAULT_EASE_FACTOR,
        repetitions: 0,
    };
};

/**
 * SM-2 Algorithm: Calculate next review interval based on performance
 * @param srsData Current SRS data for the question
 * @param quality Score 0-5 (0-2 = incorrect/forgot, 3 = correct with difficulty, 4-5 = easy)
 */
export const calculateNextReview = (
    srsData: SRSQuestionData,
    quality: number // 0-5 scale
): SRSQuestionData => {
    const now = Date.now();
    let { interval, easeFactor, repetitions } = srsData;

    // Clamp quality to 0-5
    quality = Math.max(0, Math.min(5, quality));

    if (quality < 3) {
        // Failed - reset to beginning
        repetitions = 0;
        interval = 0; // Review in 10 minutes (handled in getNextReviewDate)
    } else {
        // Success - apply SM-2
        if (repetitions === 0) {
            interval = 1; // 1 day
        } else if (repetitions === 1) {
            interval = 6; // 6 days
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);

    // Calculate next review date
    const nextReviewDate = quality < 3
        ? now + (10 * 60 * 1000) // 10 minutes for failed
        : now + (interval * 24 * 60 * 60 * 1000); // interval in days

    return {
        ...srsData,
        interval,
        easeFactor,
        repetitions,
        nextReviewDate,
    };
};

/**
 * Get questions due for review (for daily warmup)
 * @param quizzes All available quizzes
 * @param maxQuestions Maximum number of questions to return
 */
export const getDueQuestions = async (
    quizzes: { name: string; questions: QuizQuestion[] }[],
    maxQuestions: number = 10
): Promise<SRSReviewQuestion[]> => {
    const now = Date.now();
    const allSRSData = await loadSRSData();
    const dueQuestions: SRSReviewQuestion[] = [];

    // First, collect all questions that have SRS data and are due
    for (const quiz of quizzes) {
        for (const question of quiz.questions) {
            const questionId = generateQuestionId(quiz.name, question.question);
            const srsData = allSRSData[questionId];

            if (srsData && srsData.nextReviewDate <= now) {
                dueQuestions.push({
                    questionId,
                    quizName: quiz.name,
                    question: question.question,
                    answers: question.answers,
                    correctAnswer: question.answer,
                    explanation: question.explanation,
                    srsData,
                });
            }
        }
    }

    // If we don't have enough due questions, add some new ones
    if (dueQuestions.length < maxQuestions) {
        const needed = maxQuestions - dueQuestions.length;
        const existingIds = new Set(dueQuestions.map(q => q.questionId));

        // Add questions that haven't been seen yet
        for (const quiz of quizzes) {
            if (dueQuestions.length >= maxQuestions) break;

            for (const question of quiz.questions) {
                if (dueQuestions.length >= maxQuestions) break;

                const questionId = generateQuestionId(quiz.name, question.question);

                if (!allSRSData[questionId] && !existingIds.has(questionId)) {
                    const newSRSData = getQuestionSRSData({}, quiz.name, question.question);
                    dueQuestions.push({
                        questionId,
                        quizName: quiz.name,
                        question: question.question,
                        answers: question.answers,
                        correctAnswer: question.answer,
                        explanation: question.explanation,
                        srsData: newSRSData,
                    });
                    existingIds.add(questionId);
                }
            }
        }
    }

    // Sort by urgency (most overdue first) and limit
    dueQuestions.sort((a, b) => a.srsData.nextReviewDate - b.srsData.nextReviewDate);

    return dueQuestions.slice(0, maxQuestions);
};

/**
 * Record an answer and update SRS data
 * @param quizName Name of the quiz
 * @param questionText The question text
 * @param wasCorrect Whether the answer was correct
 */
export const recordAnswer = async (
    quizName: string,
    questionText: string,
    wasCorrect: boolean
): Promise<void> => {
    const allSRSData = await loadSRSData();
    const srsData = getQuestionSRSData(allSRSData, quizName, questionText);

    // Convert boolean to SM-2 quality score
    // Correct = 4 (good), Incorrect = 1 (forgot)
    const quality = wasCorrect ? 4 : 1;

    const updatedSRSData = calculateNextReview(srsData, quality);
    allSRSData[updatedSRSData.questionId] = updatedSRSData;

    await saveSRSData(allSRSData);
};

/**
 * Get statistics about SRS progress
 */
export const getSRSStats = async (): Promise<{
    totalTracked: number;
    dueToday: number;
    masteredCount: number;
}> => {
    const now = Date.now();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const allSRSData = await loadSRSData();
    const values = Object.values(allSRSData);

    return {
        totalTracked: values.length,
        dueToday: values.filter(q => q.nextReviewDate <= endOfDay.getTime()).length,
        masteredCount: values.filter(q => q.interval >= 21).length, // 21+ days interval = "mastered"
    };
};
