/**
 * GamificationStats Component
 * Displays full stats dashboard for profile/settings screen
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGamification } from './GamificationProvider';
import { useQuiz } from '../Quizprovider';
import { useTranslation } from 'react-i18next';
import { StreakDisplay } from './StreakDisplay';
import { XPProgress } from './XPProgress';
import { AchievementBadge } from './AchievementBadge';
import { DEFAULT_ACHIEVEMENTS } from './types';

interface GamificationStatsProps {
    style?: any;
}

export const GamificationStats: React.FC<GamificationStatsProps> = ({ style }) => {
    const { t } = useTranslation();
    const {
        stats,
        streak,
        xp,
        achievements,
        unlockedAchievements,
        lockedAchievements,
    } = useGamification();
    const {
        totalQuestionsAnswered,
        totalCorrectAnswers,
        totalWonGames,
        totalLostGames,
    } = useQuiz();

    // Calculate accuracy
    const accuracy = totalQuestionsAnswered > 0
        ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
        : 0;

    // Sort achievements by category
    const achievementsByCategory = {
        streak: DEFAULT_ACHIEVEMENTS.filter(a => a.category === 'streak'),
        score: DEFAULT_ACHIEVEMENTS.filter(a => a.category === 'score'),
        volume: DEFAULT_ACHIEVEMENTS.filter(a => a.category === 'volume'),
        speed: DEFAULT_ACHIEVEMENTS.filter(a => a.category === 'speed'),
        special: DEFAULT_ACHIEVEMENTS.filter(a => a.category === 'special'),
    };

    const getProgressForAchievement = (id: string) => {
        return achievements.find(a => a.achievementId === id);
    };

    return (
        <ScrollView
            style={[styles.container, style]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header Stats Row */}
            <View style={styles.headerRow}>
                <StreakDisplay size="medium" />
                <View style={styles.headerDivider} />
                <View style={styles.quickStats}>
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>{stats.totalQuizzesCompleted}</Text>
                        <Text style={styles.quickStatLabel}>{t('quizzes')}</Text>
                    </View>
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>{unlockedAchievements.length}</Text>
                        <Text style={styles.quickStatLabel}>{t('badges')}</Text>
                    </View>
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>{accuracy}%</Text>
                        <Text style={styles.quickStatLabel}>{t('accuracy')}</Text>
                    </View>
                </View>
            </View>

            {/* XP Progress */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('level_progress')}</Text>
                <XPProgress size="full" showTitle />
            </View>

            {/* Detailed Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('statistics')}</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>🎯</Text>
                        <Text style={styles.statValue}>{totalQuestionsAnswered}</Text>
                        <Text style={styles.statLabel}>{t('questions_answered')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>✅</Text>
                        <Text style={styles.statValue}>{totalCorrectAnswers}</Text>
                        <Text style={styles.statLabel}>{t('correct_answers')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>⭐</Text>
                        <Text style={styles.statValue}>{stats.perfectScoresCount}</Text>
                        <Text style={styles.statLabel}>{t('perfect_scores')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>🏆</Text>
                        <Text style={styles.statValue}>{totalWonGames}</Text>
                        <Text style={styles.statLabel}>{t('Quiz_wins')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>📅</Text>
                        <Text style={styles.statValue}>{streak.totalDaysPlayed}</Text>
                        <Text style={styles.statLabel}>{t('days_played')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>🔥</Text>
                        <Text style={styles.statValue}>{streak.longestStreak}</Text>
                        <Text style={styles.statLabel}>{t('best_streak')}</Text>
                    </View>
                </View>
            </View>

            {/* Achievements Sections */}
            {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                <View key={category} style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {getCategoryIcon(category)} {t(`achievement_category_${category}`)}
                        </Text>
                        <Text style={styles.achievementCount}>
                            {categoryAchievements.filter(a => getProgressForAchievement(a.id)?.isUnlocked).length}
                            /{categoryAchievements.length}
                        </Text>
                    </View>
                    <View style={styles.achievementsList}>
                        {categoryAchievements.map(achievement => (
                            <View key={achievement.id} style={styles.achievementItem}>
                                <AchievementBadge
                                    achievement={achievement}
                                    progress={getProgressForAchievement(achievement.id)}
                                    size="medium"
                                    showProgress
                                />
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const getCategoryIcon = (category: string): string => {
    switch (category) {
        case 'streak': return '🔥';
        case 'score': return '⭐';
        case 'volume': return '📚';
        case 'speed': return '⚡';
        case 'special': return '🎁';
        default: return '🏆';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        marginBottom: 24,
    },
    headerDivider: {
        width: 1,
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 16,
    },
    quickStats: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    quickStat: {
        alignItems: 'center',
    },
    quickStatValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    quickStatLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
    },
    achievementCount: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    statCard: {
        width: '30%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        margin: 6,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginTop: 4,
    },
    achievementsList: {
        gap: 10,
    },
    achievementItem: {
        marginBottom: 10,
    },
});

export default GamificationStats;
