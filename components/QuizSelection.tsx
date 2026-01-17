import React, { useRef, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Animated,
  Pressable,
  SectionList,
} from 'react-native';
import { useTranslation } from 'react-i18next';

type QuizSelectionProps = {
  quizzes: any[];
  handleQuizSelection: (quiz: any) => void;
};

const CategoryHeader: React.FC<{
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ title, count, isExpanded, onToggle }) => {
  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Pressable onPress={onToggle} style={styles.categoryHeader}>
      <View style={styles.categoryHeaderContent}>
        <Animated.Text
          style={[styles.categoryArrow, { transform: [{ rotate: rotation }] }]}
        >
          ▶
        </Animated.Text>
        <Text style={styles.categoryTitle}>{title}</Text>
        <View style={styles.categoryCountBadge}>
          <Text style={styles.categoryCountText}>{count}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const QuizButton: React.FC<{ item: any; onPress: (quiz: any) => void }> = ({
  item,
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = React.useState(false);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ alignItems: 'center' }}
    >
      <Animated.View
        style={[
          styles.answerButton,
          {
            width: '100%',
            backgroundColor: pressed
              ? 'rgb(30, 100, 130)' // darker when pressed
              : 'rgb(46, 150, 194)',
            transform: [{ scale }],
            shadowColor: '#000',
            shadowOffset: pressed
              ? { width: 0, height: 1 }
              : { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: pressed ? 2 : 6,
            elevation: pressed ? 2 : 8, // Android shadow
          },
        ]}
      >
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
        // Remove emoji prefix for sorting (emojis are typically followed by a space)
        const textA = a.replace(/^[\p{Emoji}\s]+/u, '').toLowerCase();
        const textB = b.replace(/^[\p{Emoji}\s]+/u, '').toLowerCase();
        return textA.localeCompare(textB);
      })
      .map((category) => ({
        title: category,
        data: groups[category],
        count: groups[category].length, // Store original count
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
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <QuizButton item={item} onPress={handleQuizSelection} />
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
        <Text style={styles.normalText}>{t('select_quiz')}</Text>
        <FlatList
          style={{ padding: 10 }}
          data={quizzes}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
        />
      </View>
    );
  }

  return (
    <View style={styles.quizSelectionContainer}>
      <Text style={styles.normalText}>{t('select_quiz')}</Text>
      <SectionList
        style={{ padding: 10 }}
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
  },
  normalText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
  },
  categoryHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 4,
  },
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryArrow: {
    color: 'white',
    fontSize: 12,
    marginRight: 10,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  categoryCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  answerButton: {
    backgroundColor: 'rgb(46, 150, 194)',
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  questionCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
