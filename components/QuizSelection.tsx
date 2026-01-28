import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Animated,
  Pressable,
  SectionList,
  Easing,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

type QuizSelectionProps = {
  quizzes: any[];
  handleQuizSelection: (quiz: any) => void;
};

// Trigger haptic feedback (only on native platforms)
const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  if (Platform.OS === 'web') return;
  try {
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    // Haptics not available
  }
};

const CategoryHeader: React.FC<{
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ title, count, isExpanded, onToggle }) => {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(isExpanded ? 0.15 : 0.1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: isExpanded ? 0.18 : 0.1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    triggerHaptic('light');
    onToggle();
  };

  const backgroundColor = bgOpacity.interpolate({
    inputRange: [0.1, 0.18],
    outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(100, 180, 255, 0.18)'],
  });

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.categoryHeader,
          {
            backgroundColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.categoryHeaderContent}>
          <Animated.Text
            style={[styles.categoryArrow, { transform: [{ rotate: rotation }] }]}
          >
            ▶
          </Animated.Text>
          <Text style={styles.categoryTitle}>{title}</Text>
          <View style={[styles.categoryCountBadge, isExpanded && styles.categoryCountBadgeActive]}>
            <Text style={styles.categoryCountText}>{count}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const QuizButton: React.FC<{
  item: any;
  onPress: (quiz: any) => void;
  index: number;
  isNewlyVisible: boolean;
}> = ({ item, onPress, index, isNewlyVisible }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(isNewlyVisible ? 30 : 0)).current;
  const opacityAnim = useRef(new Animated.Value(isNewlyVisible ? 0 : 1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [pressed, setPressed] = useState(false);
  const [selecting, setSelecting] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    if (isNewlyVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay: index * 50,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isNewlyVisible]);

  const handlePressIn = () => {
    setPressed(true);
    triggerHaptic('light');
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    if (!selecting) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    setSelecting(true);
    triggerHaptic('success');

    // Selection animation sequence
    Animated.sequence([
      // Quick pulse
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.03,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        // Glow effect
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]),
      ]),
    ]).start(() => {
      onPress(item);
      setSelecting(false);
    });
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(100, 200, 255, 0)', 'rgba(100, 200, 255, 0.4)'],
  });

  const shadowOpacity = pressed ? 0.2 : 0.35;
  const shadowRadius = pressed ? 4 : 8;
  const elevation = pressed ? 3 : 10;

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={selecting}
        style={{ alignItems: 'center' }}
      >
        <Animated.View
          style={[
            styles.answerButton,
            {
              width: '100%',
              backgroundColor: pressed
                ? 'rgb(30, 110, 145)'
                : selecting
                  ? 'rgb(60, 170, 210)'
                  : 'rgb(46, 150, 194)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: pressed ? 2 : 4 },
              shadowOpacity,
              shadowRadius,
              elevation,
            },
          ]}
        >
          {/* Glow overlay */}
          <Animated.View
            style={[
              styles.glowOverlay,
              { backgroundColor: glowColor },
            ]}
          />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.questionCountBadge}>
              <Text style={styles.questionCountText}>
                {item.questions?.length || 0} 📝
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const QuizSelection: React.FC<QuizSelectionProps> = ({
  quizzes,
  handleQuizSelection,
}) => {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['all']),
  );
  const [recentlyExpanded, setRecentlyExpanded] = useState<string | null>(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  // Header entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Group quizzes by category
  const groupedQuizzes = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    const uncategorized: any[] = [];

    quizzes.forEach((quiz) => {
      if (quiz.category) {
        if (!groups[quiz.category]) {
          groups[quiz.category] = [];
        }
        groups[quiz.category].push(quiz);
      } else {
        uncategorized.push(quiz);
      }
    });

    // Sort categories alphabetically (ignoring emoji prefix)
    const sections = Object.keys(groups)
      .sort((a, b) => {
        const textA = a.replace(/^[\p{Emoji}\s]+/u, '').toLowerCase();
        const textB = b.replace(/^[\p{Emoji}\s]+/u, '').toLowerCase();
        return textA.localeCompare(textB);
      })
      .map((category) => ({
        title: category,
        data: groups[category],
        count: groups[category].length,
      }));

    // Add uncategorized at the end if any
    if (uncategorized.length > 0) {
      sections.push({
        title: t('other') || 'Other',
        data: uncategorized,
        count: uncategorized.length,
      });
    }

    return sections;
  }, [quizzes, t]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
        setRecentlyExpanded(null);
      } else {
        newSet.add(category);
        setRecentlyExpanded(category);
        // Clear recently expanded after animation completes
        setTimeout(() => setRecentlyExpanded(null), 500);
      }
      return newSet;
    });
  };

  const renderItem = ({ item, index, section }: { item: any; index: number; section: any }) => (
    <QuizButton
      item={item}
      onPress={handleQuizSelection}
      index={index}
      isNewlyVisible={recentlyExpanded === section.title}
    />
  );

  const renderSectionHeader = ({
    section,
  }: {
    section: { title: string; data: any[]; count: number };
  }) => (
    <CategoryHeader
      title={section.title}
      count={section.count}
      isExpanded={expandedCategories.has(section.title)}
      onToggle={() => toggleCategory(section.title)}
    />
  );

  // If no categories exist, use simple FlatList
  if (
    groupedQuizzes.length <= 1 &&
    groupedQuizzes[0]?.title === (t('other') || 'Other')
  ) {
    return (
      <View style={styles.quizSelectionContainer}>
        <Animated.Text
          style={[
            styles.normalText,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          {t('select_quiz')}
        </Animated.Text>
        <FlatList
          style={{ paddingVertical: 10 }}
          data={quizzes}
          keyExtractor={(item) => item.name}
          renderItem={({ item, index }) => (
            <QuizButton
              item={item}
              onPress={handleQuizSelection}
              index={index}
              isNewlyVisible={true}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.quizSelectionContainer}>
      <Animated.Text
        style={[
          styles.normalText,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        {t('select_quiz')}
      </Animated.Text>
      <SectionList
        style={{ paddingVertical: 10 }}
        sections={groupedQuizzes.map((section) => ({
          ...section,
          data: expandedCategories.has(section.title) ? section.data : [],
        }))}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  quizSelectionContainer: {
    flex: 1,
    overflow: 'visible',
  },
  normalText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
  },
  categoryHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryArrow: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginRight: 12,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  categoryCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  categoryCountBadgeActive: {
    backgroundColor: 'rgba(100, 180, 255, 0.25)',
  },
  categoryCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  answerButton: {
    backgroundColor: 'rgb(46, 150, 194)',
    padding: 18,
    borderRadius: 12,
    marginVertical: 6,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  questionCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginLeft: 10,
  },
  questionCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
