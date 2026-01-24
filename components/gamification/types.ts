/**
 * Gamification Types
 * Defines types for streaks, achievements, XP, and levels
 */

// ============ Streak Types ============
export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastQuizDate: string | null; // ISO date string (YYYY-MM-DD)
    totalDaysPlayed: number;
}

// ============ Achievement Types ============
export type AchievementCategory =
    | 'streak'
    | 'score'
    | 'speed'
    | 'volume'
    | 'special';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji or icon name
    category: AchievementCategory;
    requirement: number; // The value needed to unlock
    xpReward: number; // XP awarded when unlocked
    unlockedAt?: string; // ISO date string when unlocked
    isSecret?: boolean; // Hidden until unlocked
}

export interface AchievementProgress {
    achievementId: string;
    currentProgress: number;
    isUnlocked: boolean;
    unlockedAt?: string;
}

// ============ XP & Level Types ============
export interface XPData {
    totalXP: number;
    currentLevel: number;
    xpForNextLevel: number;
    xpInCurrentLevel: number;
}

export interface LevelConfig {
    level: number;
    xpRequired: number; // Total XP needed to reach this level
    title: string;
}

// ============ Daily Quiz Types ============
export interface DailyQuizData {
    date: string; // YYYY-MM-DD
    quizId: string;
    completed: boolean;
    score?: number;
    totalQuestions?: number;
}

// ============ User Stats Types ============
export interface GamificationStats {
    streak: StreakData;
    xp: XPData;
    achievements: AchievementProgress[];
    dailyQuiz: DailyQuizData | null;
    // Speed tracking for speed achievements
    fastestQuizTime?: number; // seconds
    questionsAnsweredToday: number;
    perfectScoresCount: number;
    totalQuizzesCompleted: number;
}

// ============ XP Rewards Configuration ============
// Fine-tuned for engaging but achievable progression
export const XP_REWARDS = {
    // Base rewards
    CORRECT_ANSWER: 5,           // Base XP per correct answer
    WRONG_ANSWER: 1,             // Small consolation XP
    QUIZ_COMPLETION: 15,         // Bonus for finishing a quiz

    // Bonus multipliers
    PERFECT_SCORE: 25,           // Bonus for 100% score
    HIGH_SCORE_BONUS: 10,        // Bonus for 80%+ score

    // Streak rewards (exponential growth)
    DAILY_STREAK_BONUS: 5,       // Per day in streak (compounds)
    STREAK_MILESTONE_3: 25,      // Bonus at 3-day streak
    STREAK_MILESTONE_7: 75,      // Bonus at 7-day streak
    STREAK_MILESTONE_30: 300,    // Bonus at 30-day streak

    // Daily challenge
    DAILY_QUIZ_COMPLETION: 50,   // Base daily quiz reward
    DAILY_QUIZ_PERFECT: 25,      // Extra for perfect daily

    // Speed bonuses
    SPEED_BONUS_THRESHOLD: 3,    // Seconds per question for bonus
    SPEED_BONUS_XP: 2,           // XP per fast question

    // First-time bonuses
    FIRST_QUIZ_BONUS: 50,        // Welcome bonus
    FIRST_PERFECT_BONUS: 100,    // First perfect score bonus

    // Category exploration
    NEW_CATEGORY_BONUS: 20,      // First quiz in a new category
} as const;

// ============ Level Thresholds ============
// Smoother progression curve with 25 levels
export const LEVEL_CONFIGS: LevelConfig[] = [
    { level: 1, xpRequired: 0, title: 'Newcomer' },
    { level: 2, xpRequired: 50, title: 'Beginner' },
    { level: 3, xpRequired: 120, title: 'Curious' },
    { level: 4, xpRequired: 220, title: 'Learner' },
    { level: 5, xpRequired: 350, title: 'Student' },
    { level: 6, xpRequired: 520, title: 'Apprentice' },
    { level: 7, xpRequired: 730, title: 'Scholar' },
    { level: 8, xpRequired: 1000, title: 'Adept' },
    { level: 9, xpRequired: 1350, title: 'Expert' },
    { level: 10, xpRequired: 1800, title: 'Master' },
    { level: 11, xpRequired: 2400, title: 'Sage' },
    { level: 12, xpRequired: 3100, title: 'Grandmaster' },
    { level: 13, xpRequired: 4000, title: 'Virtuoso' },
    { level: 14, xpRequired: 5100, title: 'Prodigy' },
    { level: 15, xpRequired: 6500, title: 'Champion' },
    { level: 16, xpRequired: 8200, title: 'Legend' },
    { level: 17, xpRequired: 10200, title: 'Mythic' },
    { level: 18, xpRequired: 12700, title: 'Hero' },
    { level: 19, xpRequired: 15700, title: 'Titan' },
    { level: 20, xpRequired: 19500, title: 'Immortal' },
    { level: 21, xpRequired: 24000, title: 'Demigod' },
    { level: 22, xpRequired: 30000, title: 'Ascendant' },
    { level: 23, xpRequired: 38000, title: 'Transcendent' },
    { level: 24, xpRequired: 48000, title: 'Eternal' },
    { level: 25, xpRequired: 60000, title: 'Omniscient' },
];

// ============ Default Achievements ============
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
    // Streak Achievements
    {
        id: 'streak_3',
        name: 'Getting Started',
        description: 'Complete quizzes 3 days in a row',
        icon: '🔥',
        category: 'streak',
        requirement: 3,
        xpReward: 50,
    },
    {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Complete quizzes 7 days in a row',
        icon: '🔥',
        category: 'streak',
        requirement: 7,
        xpReward: 100,
    },
    {
        id: 'streak_14',
        name: 'Fortnight Fighter',
        description: 'Complete quizzes 14 days in a row',
        icon: '🔥',
        category: 'streak',
        requirement: 14,
        xpReward: 200,
    },
    {
        id: 'streak_30',
        name: 'Monthly Master',
        description: 'Complete quizzes 30 days in a row',
        icon: '🔥',
        category: 'streak',
        requirement: 30,
        xpReward: 500,
    },
    {
        id: 'streak_60',
        name: 'Two Month Titan',
        description: 'Complete quizzes 60 days in a row',
        icon: '🌟',
        category: 'streak',
        requirement: 60,
        xpReward: 1000,
    },
    {
        id: 'streak_100',
        name: 'Century Legend',
        description: 'Complete quizzes 100 days in a row',
        icon: '💯',
        category: 'streak',
        requirement: 100,
        xpReward: 2000,
    },
    {
        id: 'streak_365',
        name: 'Year of Dedication',
        description: 'Complete quizzes 365 days in a row',
        icon: '👑',
        category: 'streak',
        requirement: 365,
        xpReward: 10000,
        isSecret: true,
    },

    // Score Achievements
    {
        id: 'first_perfect',
        name: 'Perfectionist',
        description: 'Get your first perfect score',
        icon: '⭐',
        category: 'score',
        requirement: 1,
        xpReward: 75,
    },
    {
        id: 'perfect_5',
        name: 'Flawless Five',
        description: 'Get 5 perfect scores',
        icon: '🌟',
        category: 'score',
        requirement: 5,
        xpReward: 150,
    },
    {
        id: 'perfect_10',
        name: 'Perfect Ten',
        description: 'Get 10 perfect scores',
        icon: '✨',
        category: 'score',
        requirement: 10,
        xpReward: 250,
    },
    {
        id: 'perfect_25',
        name: 'Quarter Century',
        description: 'Get 25 perfect scores',
        icon: '💫',
        category: 'score',
        requirement: 25,
        xpReward: 500,
    },
    {
        id: 'perfect_50',
        name: 'Golden Standard',
        description: 'Get 50 perfect scores',
        icon: '🏅',
        category: 'score',
        requirement: 50,
        xpReward: 1000,
    },
    {
        id: 'perfect_100',
        name: 'Perfect Century',
        description: 'Get 100 perfect scores',
        icon: '👑',
        category: 'score',
        requirement: 100,
        xpReward: 1500,
    },
    {
        id: 'comeback_king',
        name: 'Comeback King',
        description: 'Get a perfect score after 3 failed quizzes',
        icon: '👊',
        category: 'score',
        requirement: 1,
        xpReward: 100,
        isSecret: true,
    },
    {
        id: 'consistency_10',
        name: 'Steady Hand',
        description: 'Score 80%+ on 10 consecutive quizzes',
        icon: '🎯',
        category: 'score',
        requirement: 10,
        xpReward: 200,
    },

    // Volume Achievements
    {
        id: 'first_quiz',
        name: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎉',
        category: 'volume',
        requirement: 1,
        xpReward: 25,
    },
    {
        id: 'questions_50',
        name: 'Half Century',
        description: 'Answer 50 questions',
        icon: '📘',
        category: 'volume',
        requirement: 50,
        xpReward: 50,
    },
    {
        id: 'questions_100',
        name: 'Century Club',
        description: 'Answer 100 questions',
        icon: '📚',
        category: 'volume',
        requirement: 100,
        xpReward: 100,
    },
    {
        id: 'questions_250',
        name: 'Bookworm',
        description: 'Answer 250 questions',
        icon: '🐛',
        category: 'volume',
        requirement: 250,
        xpReward: 200,
    },
    {
        id: 'questions_500',
        name: 'Knowledge Seeker',
        description: 'Answer 500 questions',
        icon: '📖',
        category: 'volume',
        requirement: 500,
        xpReward: 300,
    },
    {
        id: 'questions_1000',
        name: 'Quiz Enthusiast',
        description: 'Answer 1000 questions',
        icon: '🧠',
        category: 'volume',
        requirement: 1000,
        xpReward: 750,
    },
    {
        id: 'questions_2500',
        name: 'Scholar Supreme',
        description: 'Answer 2500 questions',
        icon: '📜',
        category: 'volume',
        requirement: 2500,
        xpReward: 1500,
    },
    {
        id: 'questions_5000',
        name: 'Quiz Master',
        description: 'Answer 5000 questions',
        icon: '🎓',
        category: 'volume',
        requirement: 5000,
        xpReward: 2000,
    },
    {
        id: 'quizzes_5',
        name: 'Warming Up',
        description: 'Complete 5 quizzes',
        icon: '🌱',
        category: 'volume',
        requirement: 5,
        xpReward: 50,
    },
    {
        id: 'quizzes_10',
        name: 'Getting Comfortable',
        description: 'Complete 10 quizzes',
        icon: '📝',
        category: 'volume',
        requirement: 10,
        xpReward: 100,
    },
    {
        id: 'quizzes_25',
        name: 'Quiz Regular',
        description: 'Complete 25 quizzes',
        icon: '📋',
        category: 'volume',
        requirement: 25,
        xpReward: 200,
    },
    {
        id: 'quizzes_50',
        name: 'Quiz Addict',
        description: 'Complete 50 quizzes',
        icon: '🎯',
        category: 'volume',
        requirement: 50,
        xpReward: 350,
    },
    {
        id: 'quizzes_100',
        name: 'Centurion',
        description: 'Complete 100 quizzes',
        icon: '🏆',
        category: 'volume',
        requirement: 100,
        xpReward: 750,
    },
    {
        id: 'quizzes_250',
        name: 'Quiz Legend',
        description: 'Complete 250 quizzes',
        icon: '⚜️',
        category: 'volume',
        requirement: 250,
        xpReward: 1500,
    },

    // Speed Achievements
    {
        id: 'quick_thinker',
        name: 'Quick Thinker',
        description: 'Complete a quiz with avg 5 seconds per question',
        icon: '💨',
        category: 'speed',
        requirement: 5, // avg seconds per question
        xpReward: 100,
    },
    {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Answer 10 questions correctly in under 60 seconds',
        icon: '⚡',
        category: 'speed',
        requirement: 60, // seconds
        xpReward: 200,
    },
    {
        id: 'lightning_fast',
        name: 'Lightning Fast',
        description: 'Complete a 10-question quiz in under 30 seconds',
        icon: '🌩️',
        category: 'speed',
        requirement: 30, // seconds
        xpReward: 500,
    },
    {
        id: 'sonic_speed',
        name: 'Sonic Speed',
        description: 'Complete a 10-question quiz with perfect score in under 20 seconds',
        icon: '🚀',
        category: 'speed',
        requirement: 20, // seconds
        xpReward: 1000,
        isSecret: true,
    },
    {
        id: 'speed_streak_5',
        name: 'Fast Five',
        description: 'Complete 5 quizzes in a row with avg under 5 sec/question',
        icon: '🏎️',
        category: 'speed',
        requirement: 5,
        xpReward: 300,
    },

    // Category Achievements
    {
        id: 'category_explorer',
        name: 'Category Explorer',
        description: 'Complete quizzes in 3 different categories',
        icon: '🗺️',
        category: 'special',
        requirement: 3,
        xpReward: 100,
    },
    {
        id: 'category_conqueror',
        name: 'Category Conqueror',
        description: 'Complete quizzes in 5 different categories',
        icon: '🌍',
        category: 'special',
        requirement: 5,
        xpReward: 250,
    },
    {
        id: 'category_master',
        name: 'Category Master',
        description: 'Get a perfect score in 5 different categories',
        icon: '🎭',
        category: 'special',
        requirement: 5,
        xpReward: 500,
    },
    {
        id: 'all_rounder',
        name: 'All-Rounder',
        description: 'Complete at least 3 quizzes in every category',
        icon: '🔮',
        category: 'special',
        requirement: 1,
        xpReward: 1000,
        isSecret: true,
    },

    // Special Achievements
    {
        id: 'daily_quiz_first',
        name: 'Daily Challenger',
        description: 'Complete your first Daily Quiz',
        icon: '📅',
        category: 'special',
        requirement: 1,
        xpReward: 50,
    },
    {
        id: 'daily_quiz_7',
        name: 'Weekly Regular',
        description: 'Complete 7 Daily Quizzes',
        icon: '🗓️',
        category: 'special',
        requirement: 7,
        xpReward: 200,
    },
    {
        id: 'daily_quiz_30',
        name: 'Monthly Devotee',
        description: 'Complete 30 Daily Quizzes',
        icon: '📆',
        category: 'special',
        requirement: 30,
        xpReward: 500,
    },
    {
        id: 'daily_perfect_streak_3',
        name: 'Perfect Daily Streak',
        description: 'Get perfect scores on 3 Daily Quizzes in a row',
        icon: '💎',
        category: 'special',
        requirement: 3,
        xpReward: 300,
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete a quiz after midnight',
        icon: '🦉',
        category: 'special',
        requirement: 1,
        xpReward: 50,
        isSecret: true,
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete a quiz before 6 AM',
        icon: '🐦',
        category: 'special',
        requirement: 1,
        xpReward: 50,
        isSecret: true,
    },
    {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Complete 5 quizzes on a Saturday or Sunday',
        icon: '🎊',
        category: 'special',
        requirement: 5,
        xpReward: 100,
        isSecret: true,
    },
    {
        id: 'marathon_session',
        name: 'Marathon Session',
        description: 'Complete 10 quizzes in a single day',
        icon: '🏃',
        category: 'special',
        requirement: 10,
        xpReward: 250,
    },
    {
        id: 'first_try_legend',
        name: 'First Try Legend',
        description: 'Get a perfect score on a quiz you never played before',
        icon: '🍀',
        category: 'special',
        requirement: 1,
        xpReward: 150,
    },
    {
        id: 'no_hints',
        name: 'Pure Knowledge',
        description: 'Complete 10 quizzes without using any hints',
        icon: '🎩',
        category: 'special',
        requirement: 10,
        xpReward: 200,
    },
    {
        id: 'level_10',
        name: 'Level 10 Achieved',
        description: 'Reach level 10',
        icon: '🎖️',
        category: 'special',
        requirement: 10,
        xpReward: 500,
    },
    {
        id: 'level_25',
        name: 'Elite Status',
        description: 'Reach level 25',
        icon: '🏅',
        category: 'special',
        requirement: 25,
        xpReward: 2000,
        isSecret: true,
    },
    {
        id: 'xp_1000',
        name: 'XP Collector',
        description: 'Earn 1000 total XP',
        icon: '💰',
        category: 'special',
        requirement: 1000,
        xpReward: 100,
    },
    {
        id: 'xp_10000',
        name: 'XP Hoarder',
        description: 'Earn 10000 total XP',
        icon: '💎',
        category: 'special',
        requirement: 10000,
        xpReward: 500,
    },
    {
        id: 'xp_50000',
        name: 'XP Baron',
        description: 'Earn 50000 total XP',
        icon: '👑',
        category: 'special',
        requirement: 50000,
        xpReward: 2000,
        isSecret: true,
    },
];

// ============ Helper Functions ============
export const getDefaultGamificationStats = (): GamificationStats => ({
    streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastQuizDate: null,
        totalDaysPlayed: 0,
    },
    xp: {
        totalXP: 0,
        currentLevel: 1,
        xpForNextLevel: 100,
        xpInCurrentLevel: 0,
    },
    achievements: DEFAULT_ACHIEVEMENTS.map(a => ({
        achievementId: a.id,
        currentProgress: 0,
        isUnlocked: false,
    })),
    dailyQuiz: null,
    questionsAnsweredToday: 0,
    perfectScoresCount: 0,
    totalQuizzesCompleted: 0,
});

export const calculateLevel = (totalXP: number): XPData => {
    let currentLevel = 1;
    let xpForNextLevel = LEVEL_CONFIGS[1]?.xpRequired || 100;
    let xpInCurrentLevel = totalXP;

    for (let i = LEVEL_CONFIGS.length - 1; i >= 0; i--) {
        if (totalXP >= LEVEL_CONFIGS[i].xpRequired) {
            currentLevel = LEVEL_CONFIGS[i].level;
            const nextLevelConfig = LEVEL_CONFIGS[i + 1];
            xpForNextLevel = nextLevelConfig
                ? nextLevelConfig.xpRequired - LEVEL_CONFIGS[i].xpRequired
                : 0;
            xpInCurrentLevel = totalXP - LEVEL_CONFIGS[i].xpRequired;
            break;
        }
    }

    return {
        totalXP,
        currentLevel,
        xpForNextLevel,
        xpInCurrentLevel,
    };
};

export const getLevelTitle = (level: number): string => {
    const config = LEVEL_CONFIGS.find(l => l.level === level);
    return config?.title || 'Beginner';
};

export const getTodayDateString = (): string => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const isConsecutiveDay = (lastDate: string | null): boolean => {
    if (!lastDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);

    return last.getTime() === yesterday.getTime();
};

export const isSameDay = (dateString: string | null): boolean => {
    if (!dateString) return false;
    return dateString === getTodayDateString();
};
