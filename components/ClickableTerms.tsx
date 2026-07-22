import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGlossary } from './GlossaryProvider';

type ClickableTermsProps = {
  text: string;
  style?: any;
  onTermPress?: (term: string) => void;
};

type TextSegment = {
  type: 'text' | 'term';
  content: string;
  term?: string;
};

/**
 * Renders text with automatically detected glossary terms made clickable.
 * Longest-match priority for overlapping terms.
 */
export const ClickableTerms: React.FC<ClickableTermsProps> = ({
  text,
  style,
  onTermPress,
}) => {
  const { terms, setSelectedTerm, setModalVisible } = useGlossary();

  // Parse text into segments (normal text + glossary terms)
  const segments = useMemo(() => {
    if (!text) return [{ type: 'text' as const, content: '' }];

    const result: TextSegment[] = [];
    const lowerText = text.toLowerCase();
    let i = 0;

    while (i < text.length) {
      let bestMatch: { term: string; length: number } | null = null;

      // Find the longest glossary term starting at position i
      for (const entry of terms) {
        const termLower = entry.term.toLowerCase();
        if (
          lowerText.startsWith(termLower, i) &&
          termLower.length > (bestMatch?.length || 0)
        ) {
          // Verify word boundary (term should end at a word boundary, or text ends)
          const endPos = i + termLower.length;
          if (endPos === text.length || /\b|[.,;:!?)\-'"\s]/.test(text[endPos])) {
            // Also check start boundary
            if (i === 0 || /\b|[.,;:!?(\-'"\s]/.test(text[i - 1])) {
              bestMatch = { term: entry.term, length: termLower.length };
            }
          }
        }
      }

      if (bestMatch) {
        // Add the term as a clickable segment
        result.push({
          type: 'term',
          content: text.slice(i, i + bestMatch.length),
          term: bestMatch.term,
        });
        i += bestMatch.length;
      } else {
        // Add characters until next potential match or end
        result.push({
          type: 'text',
          content: text[i],
        });
        i++;
      }
    }

    // Merge adjacent text segments
    const merged: TextSegment[] = [];
    for (const seg of result) {
      if (
        merged.length > 0 &&
        merged[merged.length - 1].type === 'text' &&
        seg.type === 'text'
      ) {
        merged[merged.length - 1].content += seg.content;
      } else {
        merged.push(seg);
      }
    }

    return merged;
  }, [text, terms]);

  const handleTermPress = (term: string) => {
    if (onTermPress) {
      onTermPress(term);
    } else {
      // Default behavior: find term in glossary and show modal
      const entry = terms.find(
        (t) => t.term.toLowerCase() === term.toLowerCase(),
      );
      if (entry) {
        setSelectedTerm(entry);
        setModalVisible(true);
      }
    }
  };

  if (!text) {
    return null;
  }

  return (
    <Text style={style}>
      {segments.map((segment, idx) => {
        if (segment.type === 'term' && segment.term) {
          return (
            <Text
              key={idx}
              style={[style, styles.termLink]}
              onPress={() => handleTermPress(segment.term!)}
              suppressHighlighting
            >
              {segment.content}
            </Text>
          );
        }
        return <Text key={idx}>{segment.content}</Text>;
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  termLink: {
    color: 'rgb(100, 200, 255)',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: 'rgba(100, 200, 255, 0.6)',
  },
});
