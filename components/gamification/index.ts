/**
 * Gamification Components Export Index
 */

// Types
export * from './types';

// Provider
export {
    GamificationProvider,
    useGamification,
    type NewlyUnlockedAchievement,
} from './GamificationProvider';

// Components
export { StreakDisplay } from './StreakDisplay';
export { XPProgress } from './XPProgress';
export { AchievementBadge } from './AchievementBadge';
export { AchievementModal } from './AchievementModal';
export { DailyQuiz } from './DailyQuiz';
export { GamificationStats } from './GamificationStats';
