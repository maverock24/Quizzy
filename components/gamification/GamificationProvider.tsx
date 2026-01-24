/**
 * GamificationProvider
 * Manages streaks, achievements, XP, and daily quizzes
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
    Achievement,
    AchievementProgress,
    calculateLevel,
    DailyQuizData,
    DEFAULT_ACHIEVEMENTS,
    GamificationStats,
    getDefaultGamificationStats,
    getLevelTitle,
    getTodayDateString,
    isConsecutiveDay,
    isSameDay,
    StreakData,
    XP_REWARDS,
    XPData,
} from './types';

// Storage key for gamification data
const GAMIFICATION_STORAGE_KEY = 'quizzy_gamification';

// Types for newly unlocked achievements (for celebration modal)
export interface NewlyUnlockedAchievement extends Achievement {
    xpAwarded: number;
}

// Context Type
interface GamificationContextType {
    // Stats
    stats: GamificationStats;

    // Streak
    streak: StreakData;

    // XP & Level
    xp: XPData;
    levelTitle: string;

    // Achievements
    achievements: AchievementProgress[];
    getAchievementDetails: (id: string) => Achievement | undefined;
    unlockedAchievements: Achievement[];
    lockedAchievements: Achievement[];

    // Daily Quiz
    dailyQuiz: DailyQuizData | null;
    getDailyQuiz: () => string | null; // Returns quiz ID for today
    completeDailyQuiz: (score: number, total: number) => void;

    // Actions
    onQuizComplete: (
        score: number,
        totalQuestions: number,
        timeInSeconds?: number
    ) => NewlyUnlockedAchievement[];
    onCorrectAnswer: () => number; // Returns XP awarded
    addXP: (amount: number, reason?: string) => void;

    // Newly unlocked (for celebration modal)
    newlyUnlockedAchievements: NewlyUnlockedAchievement[];
    clearNewlyUnlocked: () => void;

    // Reset
    resetGamification: () => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<GamificationStats>(getDefaultGamificationStats());
    const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<NewlyUnlockedAchievement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load stats from storage on mount
    useEffect(() => {
        loadStats();
    }, []);

    // Save stats to storage whenever they change
    useEffect(() => {
        if (isLoaded) {
            saveStats();
        }
    }, [stats, isLoaded]);

    const loadStats = async () => {
        try {
            const stored = await AsyncStorage.getItem(GAMIFICATION_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as GamificationStats;

                // Ensure all achievements exist (in case new ones were added)
                const existingIds = new Set(parsed.achievements.map(a => a.achievementId));
                const missingAchievements = DEFAULT_ACHIEVEMENTS
                    .filter(a => !existingIds.has(a.id))
                    .map(a => ({
                        achievementId: a.id,
                        currentProgress: 0,
                        isUnlocked: false,
                    }));

                setStats({
                    ...parsed,
                    achievements: [...parsed.achievements, ...missingAchievements],
                });
            }
        } catch (error) {
            console.error('Failed to load gamification stats:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const saveStats = async () => {
        try {
            await AsyncStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(stats));
        } catch (error) {
            console.error('Failed to save gamification stats:', error);
        }
    };

    // ============ Streak Management ============
    const updateStreak = useCallback(() => {
        const today = getTodayDateString();

        setStats(prev => {
            // If already played today, don't update streak
            if (isSameDay(prev.streak.lastQuizDate)) {
                return prev;
            }

            let newStreak = prev.streak.currentStreak;
            let totalDays = prev.streak.totalDaysPlayed;

            if (isConsecutiveDay(prev.streak.lastQuizDate)) {
                // Consecutive day - increase streak
                newStreak += 1;
            } else if (prev.streak.lastQuizDate === null) {
                // First time playing
                newStreak = 1;
            } else {
                // Streak broken - reset to 1
                newStreak = 1;
            }

            totalDays += 1;

            return {
                ...prev,
                streak: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, prev.streak.longestStreak),
                    lastQuizDate: today,
                    totalDaysPlayed: totalDays,
                },
            };
        });
    }, []);

    // ============ XP Management ============
    const addXP = useCallback((amount: number, _reason?: string) => {
        setStats(prev => {
            const newTotalXP = prev.xp.totalXP + amount;
            const newXPData = calculateLevel(newTotalXP);

            return {
                ...prev,
                xp: newXPData,
            };
        });
    }, []);

    const onCorrectAnswer = useCallback((): number => {
        const xpAwarded = XP_REWARDS.CORRECT_ANSWER;
        addXP(xpAwarded, 'correct_answer');
        return xpAwarded;
    }, [addXP]);

    // ============ Achievement Checking ============
    const checkAndUnlockAchievements = useCallback((
        currentStats: GamificationStats,
        score: number,
        totalQuestions: number,
        timeInSeconds?: number
    ): NewlyUnlockedAchievement[] => {
        const newlyUnlocked: NewlyUnlockedAchievement[] = [];
        const today = getTodayDateString();
        const hour = new Date().getHours();

        const isPerfectScore = score === totalQuestions;

        // Calculate new values
        const newPerfectScores = isPerfectScore
            ? currentStats.perfectScoresCount + 1
            : currentStats.perfectScoresCount;
        const newQuizzesCompleted = currentStats.totalQuizzesCompleted + 1;

        // Check each achievement
        DEFAULT_ACHIEVEMENTS.forEach(achievement => {
            const progress = currentStats.achievements.find(a => a.achievementId === achievement.id);
            if (progress?.isUnlocked) return; // Already unlocked

            let shouldUnlock = false;
            let newProgress = progress?.currentProgress || 0;

            switch (achievement.id) {
                // Streak achievements
                case 'streak_3':
                case 'streak_7':
                case 'streak_14':
                case 'streak_30':
                case 'streak_60':
                case 'streak_100':
                case 'streak_365':
                    newProgress = currentStats.streak.currentStreak;
                    shouldUnlock = newProgress >= achievement.requirement;
                    break;

                // Perfect score achievements
                case 'first_perfect':
                case 'perfect_5':
                case 'perfect_10':
                case 'perfect_25':
                case 'perfect_50':
                case 'perfect_100':
                    newProgress = newPerfectScores;
                    shouldUnlock = newProgress >= achievement.requirement;
                    break;

                // First quiz achievement
                case 'first_quiz':
                    newProgress = newQuizzesCompleted;
                    shouldUnlock = newProgress >= 1;
                    break;

                // Volume achievements (quizzes)
                case 'quizzes_5':
                case 'quizzes_10':
                case 'quizzes_25':
                case 'quizzes_50':
                case 'quizzes_100':
                case 'quizzes_250':
                    newProgress = newQuizzesCompleted;
                    shouldUnlock = newProgress >= achievement.requirement;
                    break;

                // Volume achievements (questions) - tracked via totalQuestionsAnswered
                case 'questions_50':
                case 'questions_100':
                case 'questions_250':
                case 'questions_500':
                case 'questions_1000':
                case 'questions_2500':
                case 'questions_5000':
                    // This needs totalQuestionsAnswered from stats
                    // Will be tracked when we add that field
                    break;

                // Speed achievements
                case 'quick_thinker':
                    if (timeInSeconds && totalQuestions > 0) {
                        const avgTime = timeInSeconds / totalQuestions;
                        shouldUnlock = avgTime <= achievement.requirement;
                    }
                    break;
                case 'speed_demon':
                    if (timeInSeconds && totalQuestions >= 10 && score >= 10) {
                        shouldUnlock = timeInSeconds <= achievement.requirement;
                    }
                    break;
                case 'lightning_fast':
                    if (timeInSeconds && totalQuestions >= 10 && score === totalQuestions) {
                        shouldUnlock = timeInSeconds <= achievement.requirement;
                    }
                    break;
                case 'sonic_speed':
                    if (timeInSeconds && totalQuestions >= 10 && score === totalQuestions) {
                        shouldUnlock = timeInSeconds <= 20;
                    }
                    break;

                // XP and Level achievements
                case 'xp_1000':
                    shouldUnlock = currentStats.xp.totalXP >= 1000;
                    newProgress = currentStats.xp.totalXP;
                    break;
                case 'xp_10000':
                    shouldUnlock = currentStats.xp.totalXP >= 10000;
                    newProgress = currentStats.xp.totalXP;
                    break;
                case 'xp_50000':
                    shouldUnlock = currentStats.xp.totalXP >= 50000;
                    newProgress = currentStats.xp.totalXP;
                    break;
                case 'level_10':
                    shouldUnlock = currentStats.xp.currentLevel >= 10;
                    newProgress = currentStats.xp.currentLevel;
                    break;
                case 'level_25':
                    shouldUnlock = currentStats.xp.currentLevel >= 25;
                    newProgress = currentStats.xp.currentLevel;
                    break;

                // Special achievements
                case 'daily_quiz_first':
                case 'daily_quiz_7':
                case 'daily_quiz_30':
                case 'daily_perfect_streak_3':
                    // Handled separately in completeDailyQuiz
                    break;

                case 'night_owl':
                    if (hour >= 0 && hour < 5) {
                        shouldUnlock = true;
                    }
                    break;

                case 'early_bird':
                    if (hour >= 5 && hour < 6) {
                        shouldUnlock = true;
                    }
                    break;

                case 'weekend_warrior':
                    const dayOfWeek = new Date().getDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        // Track weekend quizzes - would need separate counter
                    }
                    break;

                case 'first_try_legend':
                    // Would need to track if quiz was played before
                    if (isPerfectScore) {
                        // For now, award on first perfect score
                    }
                    break;

                // Category achievements - would need category tracking
                case 'category_explorer':
                case 'category_conqueror':
                case 'category_master':
                case 'all_rounder':
                    // These need category tracking in stats
                    break;

                // Other special achievements that need additional tracking
                case 'comeback_king':
                case 'consistency_10':
                case 'speed_streak_5':
                case 'marathon_session':
                case 'no_hints':
                    // These need additional state tracking
                    break;
            }

            if (shouldUnlock) {
                newlyUnlocked.push({
                    ...achievement,
                    xpAwarded: achievement.xpReward,
                    unlockedAt: today,
                });
            }
        });

        return newlyUnlocked;
    }, []);

    // ============ Quiz Completion Handler ============
    const onQuizComplete = useCallback((
        score: number,
        totalQuestions: number,
        timeInSeconds?: number
    ): NewlyUnlockedAchievement[] => {
        // Update streak
        updateStreak();

        // Calculate XP
        let xpEarned = XP_REWARDS.QUIZ_COMPLETION;

        // Perfect score bonus
        if (score === totalQuestions) {
            xpEarned += XP_REWARDS.PERFECT_SCORE;
        } else if (score / totalQuestions >= 0.8) {
            // High score bonus (80%+)
            xpEarned += XP_REWARDS.HIGH_SCORE_BONUS;
        }

        // Streak bonus (compounds with streak length)
        xpEarned += stats.streak.currentStreak * XP_REWARDS.DAILY_STREAK_BONUS;

        // Streak milestone bonuses
        if (stats.streak.currentStreak === 3) {
            xpEarned += XP_REWARDS.STREAK_MILESTONE_3;
        } else if (stats.streak.currentStreak === 7) {
            xpEarned += XP_REWARDS.STREAK_MILESTONE_7;
        } else if (stats.streak.currentStreak === 30) {
            xpEarned += XP_REWARDS.STREAK_MILESTONE_30;
        }

        // Speed bonus - award XP for each question answered quickly
        if (timeInSeconds && totalQuestions > 0) {
            const avgSecondsPerQuestion = timeInSeconds / totalQuestions;
            if (avgSecondsPerQuestion <= XP_REWARDS.SPEED_BONUS_THRESHOLD) {
                // Award speed bonus for each question
                xpEarned += XP_REWARDS.SPEED_BONUS_XP * totalQuestions;
            }
        }

        // Check achievements
        const unlocked = checkAndUnlockAchievements(stats, score, totalQuestions, timeInSeconds);

        // Add achievement XP
        unlocked.forEach(a => {
            xpEarned += a.xpReward;
        });

        // Update stats
        setStats(prev => {
            const newTotalXP = prev.xp.totalXP + xpEarned;
            const newXPData = calculateLevel(newTotalXP);

            // Update achievement progress
            const updatedAchievements = prev.achievements.map(a => {
                const unlockedAchievement = unlocked.find(u => u.id === a.achievementId);
                if (unlockedAchievement) {
                    return {
                        ...a,
                        isUnlocked: true,
                        unlockedAt: getTodayDateString(),
                        currentProgress: unlockedAchievement.requirement,
                    };
                }
                return a;
            });

            return {
                ...prev,
                xp: newXPData,
                achievements: updatedAchievements,
                perfectScoresCount: score === totalQuestions
                    ? prev.perfectScoresCount + 1
                    : prev.perfectScoresCount,
                totalQuizzesCompleted: prev.totalQuizzesCompleted + 1,
            };
        });

        // Set newly unlocked for celebration modal
        if (unlocked.length > 0) {
            setNewlyUnlockedAchievements(unlocked);
        }

        return unlocked;
    }, [stats, updateStreak, checkAndUnlockAchievements]);

    // ============ Daily Quiz ============
    const getDailyQuiz = useCallback((): string | null => {
        // This would return a quiz ID based on today's date
        // For now, we'll return null and let the UI handle it
        return null;
    }, []);

    const completeDailyQuiz = useCallback((score: number, total: number) => {
        const today = getTodayDateString();

        setStats(prev => {
            // Count completed daily quizzes
            const dailyQuizCount = prev.achievements
                .find(a => a.achievementId === 'daily_quiz_7')?.currentProgress || 0;

            return {
                ...prev,
                dailyQuiz: {
                    date: today,
                    quizId: 'daily',
                    completed: true,
                    score,
                    totalQuestions: total,
                },
            };
        });

        // Award daily quiz XP
        addXP(XP_REWARDS.DAILY_QUIZ_COMPLETION, 'daily_quiz');
    }, [addXP]);

    // ============ Achievement Helpers ============
    const getAchievementDetails = useCallback((id: string): Achievement | undefined => {
        return DEFAULT_ACHIEVEMENTS.find(a => a.id === id);
    }, []);

    const unlockedAchievements = stats.achievements
        .filter(a => a.isUnlocked)
        .map(a => DEFAULT_ACHIEVEMENTS.find(d => d.id === a.achievementId))
        .filter((a): a is Achievement => a !== undefined);

    const lockedAchievements = stats.achievements
        .filter(a => !a.isUnlocked)
        .map(a => DEFAULT_ACHIEVEMENTS.find(d => d.id === a.achievementId))
        .filter((a): a is Achievement => a !== undefined && !a.isSecret);

    // ============ Clear Newly Unlocked ============
    const clearNewlyUnlocked = useCallback(() => {
        setNewlyUnlockedAchievements([]);
    }, []);

    // ============ Reset ============
    const resetGamification = useCallback(async () => {
        const defaultStats = getDefaultGamificationStats();
        setStats(defaultStats);
        try {
            await AsyncStorage.removeItem(GAMIFICATION_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to reset gamification:', error);
        }
    }, []);

    // ============ Computed Values ============
    const levelTitle = getLevelTitle(stats.xp.currentLevel);

    if (!isLoaded) {
        return null; // Or loading spinner
    }

    return (
        <GamificationContext.Provider
            value={{
                stats,
                streak: stats.streak,
                xp: stats.xp,
                levelTitle,
                achievements: stats.achievements,
                getAchievementDetails,
                unlockedAchievements,
                lockedAchievements,
                dailyQuiz: stats.dailyQuiz,
                getDailyQuiz,
                completeDailyQuiz,
                onQuizComplete,
                onCorrectAnswer,
                addXP,
                newlyUnlockedAchievements,
                clearNewlyUnlocked,
                resetGamification,
            }}
        >
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = (): GamificationContextType => {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
