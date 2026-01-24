/**
 * DailyQuiz Component
 * Shows daily challenge with unique quiz each day
 * Hidden after completion (only one daily challenge per day)
 */
import React, { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useGamification } from './GamificationProvider';
import { useQuiz } from '../Quizprovider';
import { useTranslation } from 'react-i18next';
import { getTodayDateString, isSameDay, XP_REWARDS } from './types';

interface DailyQuizProps {
    onStartDailyQuiz: (quizName: string) => void;
    style?: any;
}

export const DailyQuiz: React.FC<DailyQuizProps> = ({
    onStartDailyQuiz,
    style,
}) => {
    const { t } = useTranslation();
    const { quizzes } = useQuiz();
    const { dailyQuiz, streak } = useGamification();

    // Check if daily quiz is completed today
    const isCompletedToday = dailyQuiz && isSameDay(dailyQuiz.date);

    // Generate deterministic daily quiz based on date
    const dailyQuizData = useMemo(() => {
        if (quizzes.length === 0) return null;

        const today = getTodayDateString();
        // Create a better hash from the date for more variety
        // Use date parts with prime multipliers for better distribution
        const [year, month, day] = today.split('-').map(n => parseInt(n, 10));
        const dateHash = (year * 31 + month * 17 + day * 13) * 7919; // Use prime numbers for distribution
        const quizIndex = Math.abs(dateHash) % quizzes.length;

        return {
            quiz: quizzes[quizIndex],
            date: today,
        };
    }, [quizzes]);


    const handleStartQuiz = () => {
        if (dailyQuizData && !isCompletedToday) {
            onStartDailyQuiz(dailyQuizData.quiz.name);
        }
    };

    // Hide component if no quiz data or if already completed today
    if (!dailyQuizData || isCompletedToday) {
        return null;
    }

    return (
        <View
            style={[
                styles.container,
                style,
            ]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.calendarIcon}>📅</Text>
                    <Text style={styles.title}>{t('daily_challenge')}</Text>
                </View>
                <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{XP_REWARDS.DAILY_QUIZ_COMPLETION} XP</Text>
                </View>
            </View>

            {/* Quiz Info */}
            <View style={styles.quizInfo}>
                <Text style={styles.quizName} numberOfLines={1}>
                    {dailyQuizData.quiz.name}
                </Text>
                <Text style={styles.questionCount}>
                    {dailyQuizData.quiz.questions?.length || 0} {t('questions')}
                </Text>
            </View>

            {/* Start Button - only shown when not completed (component is hidden when completed) */}
            <TouchableOpacity
                style={styles.startButton}
                onPress={handleStartQuiz}
                activeOpacity={0.8}
            >
                <Text style={styles.startButtonText}>{t('start_daily')}</Text>
                <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            {/* Streak bonus indicator */}
            {streak.currentStreak > 0 && (
                <View style={styles.streakBonus}>
                    <Text style={styles.streakBonusText}>
                        🔥 {t('streak_bonus')}: +{streak.currentStreak * XP_REWARDS.DAILY_STREAK_BONUS} XP
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'linear-gradient(135deg, #4ECDC4 0%, #556270 100%)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#4ECDC4',
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    calendarIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4ECDC4',
    },
    xpBadge: {
        backgroundColor: 'rgba(78, 205, 196, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    xpText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4ECDC4',
    },
    quizInfo: {
        marginBottom: 16,
    },
    quizName: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        marginBottom: 4,
    },
    questionCount: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    startButton: {
        backgroundColor: '#4ECDC4',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    arrowIcon: {
        fontSize: 20,
        color: 'white',
        marginLeft: 8,
    },
    streakBonus: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
    },
    streakBonusText: {
        fontSize: 13,
        color: '#FF6B35',
        fontWeight: '500',
    },
});

export default DailyQuiz;
