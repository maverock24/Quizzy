import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { useQuiz } from '@/components/Quizprovider';
import { Quiz } from '@/components/types';
import { useTranslation } from 'react-i18next';

// Import learning components
import SRSDailyWarmup from '@/components/learning/SRSDailyWarmup';
import CodeTracing from '@/components/learning/CodeTracing';
import ParsonsProblems from '@/components/learning/ParsonsProblems';
import FadedExamples from '@/components/learning/FadedExamples';
import DebuggingExercise from '@/components/learning/DebuggingExercise';

type LearningMode =
  | 'menu'
  | 'daily-warmup'
  | 'code-tracing'
  | 'parsons'
  | 'faded-examples'
  | 'debugging';

interface LearningOption {
  id: LearningMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tier: 1 | 2;
}

export default function LearnScreen() {
  const { quizzes } = useQuiz();
  const { t } = useTranslation();
  const [currentMode, setCurrentMode] = useState<LearningMode>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract unique categories from quizzes
  const categories = useMemo(() => {
    const cats = new Set<string>();
    quizzes.forEach((quiz: Quiz) => {
      if (quiz.category) {
        cats.add(quiz.category);
      }
    });
    return ['all', ...Array.from(cats).sort()];
  }, [quizzes]);

  // Filter quizzes by selected category
  const filteredQuizzes = useMemo(() => {
    if (selectedCategory === 'all') {
      return quizzes;
    }
    return quizzes.filter((quiz: Quiz) => quiz.category === selectedCategory);
  }, [quizzes, selectedCategory]);

  // Translations resolve here rather than at module scope, where a `t()` call
  // would freeze the language at import time.
  const learningOptions: LearningOption[] = [
    {
      id: 'daily-warmup',
      title: t('learn_mode_warmup_title'),
      description: t('learn_mode_warmup_desc'),
      icon: <Ionicons name="flash" size={32} color="#4FC3F7" />,
      color: '#4FC3F7',
      tier: 1,
    },
    {
      id: 'code-tracing',
      title: t('learn_mode_compiler_title'),
      description: t('learn_mode_compiler_desc'),
      icon: <MaterialCommunityIcons name="brain" size={32} color="#9C27B0" />,
      color: '#9C27B0',
      tier: 1,
    },
    {
      id: 'parsons',
      title: t('learn_mode_parsons_title'),
      description: t('learn_mode_parsons_desc'),
      icon: <MaterialCommunityIcons name="puzzle" size={32} color="#FF9800" />,
      color: '#FF9800',
      tier: 1,
    },
    {
      id: 'faded-examples',
      title: t('learn_mode_faded_title'),
      description: t('learn_mode_faded_desc'),
      icon: <Ionicons name="school" size={32} color="#00BCD4" />,
      color: '#00BCD4',
      tier: 2,
    },
    {
      id: 'debugging',
      title: t('learn_mode_bughunter_title'),
      description: t('learn_mode_bughunter_desc'),
      icon: <FontAwesome5 name="bug" size={28} color="#f44336" />,
      color: '#f44336',
      tier: 2,
    },
  ];

  const tier1Options = learningOptions.filter((o) => o.tier === 1);
  const tier2Options = learningOptions.filter((o) => o.tier === 2);

  const handleBack = () => {
    setCurrentMode('menu');
  };

  // Get short category name (remove emoji prefix)
  const getCategoryDisplayName = (cat: string) => {
    if (cat === 'all') return t('learn_category_all');
    // Remove emoji prefix if present
    const parts = cat.split(' ');
    if (parts.length > 1 && /\p{Emoji}/u.test(parts[0])) {
      return parts.slice(1).join(' ');
    }
    return cat;
  };

  // Render learning mode component
  if (currentMode !== 'menu') {
    return (
      <View style={styles.outerContainer}>
        <SafeAreaLinearGradient
          colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
          style={styles.safeArea}
        >
          {currentMode === 'daily-warmup' && (
            <SRSDailyWarmup onBack={handleBack} />
          )}
          {currentMode === 'code-tracing' && (
            <CodeTracing
              onBack={handleBack}
              category={selectedCategory}
              quizzes={filteredQuizzes}
            />
          )}
          {currentMode === 'parsons' && (
            <ParsonsProblems
              onBack={handleBack}
              category={selectedCategory}
              quizzes={filteredQuizzes}
            />
          )}
          {currentMode === 'faded-examples' && (
            <FadedExamples
              onBack={handleBack}
              category={selectedCategory}
              quizzes={filteredQuizzes}
            />
          )}
          {currentMode === 'debugging' && (
            <DebuggingExercise
              onBack={handleBack}
              category={selectedCategory}
              quizzes={filteredQuizzes}
            />
          )}
        </SafeAreaLinearGradient>
      </View>
    );
  }

  // Render menu
  return (
    <View style={styles.outerContainer}>
      <SafeAreaLinearGradient
        colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
        style={styles.safeArea}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {`🧠 `}
              {t('learn_title')}
            </Text>
            <Text style={styles.headerSubtitle}>{t('learn_subtitle')}</Text>
          </View>

          {/* Category Filter */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>
              {`📚 `}
              {t('learn_category_filter')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat &&
                        styles.categoryChipTextSelected,
                    ]}
                  >
                    {getCategoryDisplayName(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.categoryCount}>
              {t('learn_count_quizzes', { count: filteredQuizzes.length })}
              {' • '}
              {t('learn_count_questions', {
                count: filteredQuizzes.reduce(
                  (acc: number, q: Quiz) => acc + (q.questions?.length || 0),
                  0,
                ),
              })}
            </Text>
          </View>

          {/* Tier 1 Section */}
          <View style={styles.tierSection}>
            <View style={styles.tierHeader}>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>
                  {t('learn_tier_1_label')}
                </Text>
              </View>
              <Text style={styles.tierTitle}>{t('learn_tier_1_title')}</Text>
            </View>
            <Text style={styles.tierDescription}>{t('learn_tier_1_desc')}</Text>

            <View style={styles.optionsGrid}>
              {tier1Options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    { borderColor: option.color + '40' },
                  ]}
                  onPress={() => setCurrentMode(option.id)}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: option.color + '20' },
                    ]}
                  >
                    {option.icon}
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tier 2 Section */}
          <View style={styles.tierSection}>
            <View style={styles.tierHeader}>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: 'rgba(156, 39, 176, 0.2)' },
                ]}
              >
                <Text style={[styles.tierBadgeText, { color: '#CE93D8' }]}>
                  {t('learn_tier_2_label')}
                </Text>
              </View>
              <Text style={styles.tierTitle}>{t('learn_tier_2_title')}</Text>
            </View>
            <Text style={styles.tierDescription}>{t('learn_tier_2_desc')}</Text>

            <View style={styles.optionsGrid}>
              {tier2Options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    { borderColor: option.color + '40' },
                  ]}
                  onPress={() => setCurrentMode(option.id)}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: option.color + '20' },
                    ]}
                  >
                    {option.icon}
                  </View>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="rgba(255,255,255,0.5)"
            />
            <Text style={styles.infoText}>{t('learn_footer')}</Text>
          </View>
        </ScrollView>
      </SafeAreaLinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    maxWidth: 550,
    width: '100%',
    borderLeftColor: 'rgb(129, 129, 129)',
    borderRightColor: 'rgb(141, 141, 141)',
    borderTopColor: 'rgb(26, 26, 26)',
    borderBottomColor: 'rgb(26, 26, 26)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  tierSection: {
    marginBottom: 28,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tierBadge: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  tierBadgeText: {
    color: '#4FC3F7',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  tierDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
    marginLeft: 2,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 19,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  categoryList: {
    paddingVertical: 4,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(79, 195, 247, 0.25)',
    borderColor: '#4FC3F7',
  },
  categoryChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#4FC3F7',
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 10,
  },
});
