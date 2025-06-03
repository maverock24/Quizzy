import React, { useState } from 'react';
import { Text, View, StyleSheet, Platform, ScrollView, TextStyle, StyleProp, ViewStyle } from 'react-native';
import { decode } from 'html-entities'; // Ensure this is installed (npm install html-entities)

/**
 * Defines the structure for a segment of text, which can either be
 * plain text or a code block.
 */
interface FormattedSegment {
  type: 'text' | 'code';
  content: string;
  language?: string; // Optional language for the code block (e.g., "typescript")
}

// Default styles for math text segments if no custom style is provided
const defaultMathRenderStyles = StyleSheet.create({
  mathText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Or your preferred math-friendly font
    backgroundColor: 'rgba(220, 220, 220, 0.3)', // Subtle background for math
    color: '#1a202c', // Darker color, adjust to your theme
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    // fontSize and lineHeight will ideally be inherited or explicitly set
  },
});

/**
 * Renders text, replacing simple LaTeX commands within $...$ delimiters
 * with Unicode characters.
 * @param text The string to render.
 * @param baseTextStyle The base style to apply to non-math parts and as a base for math parts.
 * @param customMathTextStyle Optional custom styles to merge specifically for math parts.
 * @returns An array of React.ReactNode (Text components).
 */
export function renderMathInText(
  text: string,
  baseTextStyle?: StyleProp<TextStyle>,
  customMathTextStyle?: StyleProp<TextStyle>
): React.ReactNode[] {
  if (text === null || text === undefined) {
    return [<Text key="empty-text" style={baseTextStyle}></Text>];
  }
  const decoded = decode(String(text)); // Ensure text is a string

  const latexToUnicode: { [key: string]: string } = {
    '\\times': '×', '\\sqrt': '√', '\\leq': '≤', '\\geq': '≥', '\\neq': '≠',
    '\\pm': '±', '\\div': '÷', '\\cdot': '·', '\\infty': '∞', '\\rightarrow': '→',
    '\\leftarrow': '←', '\\degree': '°', '\\%': '%',
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\pi': 'π', '\\theta': 'θ',
    // Add more simple Unicode mappings as needed
  };

  const mathRegex = /\$(.+?)\$/g; // Non-greedy match for content inside $...$
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(decoded)) !== null) {
    // Text part before the math block
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={baseTextStyle}>
          {decoded.substring(lastIndex, match.index)}
        </Text>
      );
    }

    // Math part
    let mathContent = match[1];
    // Replace \text{...} with just the content inside
    mathContent = mathContent.replace(/\\text\s*{([^}]*)}/g, '$1');

    mathContent = mathContent.replace(/\\frac\s*{([^}]*)}\s*{([^}]*)}/g, '$1/$2');

    for (const [latex, uni] of Object.entries(latexToUnicode)) {
      const escapedLatex = latex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape for RegExp
      mathContent = mathContent.replace(new RegExp(escapedLatex, 'g'), uni);
    }

    parts.push(
      <Text
        key={`math-${match.index}`}
        style={StyleSheet.flatten([
          baseTextStyle, // Inherit base styles (like fontSize, lineHeight, color)
          defaultMathRenderStyles.mathText, // Apply default math-specific styles
          customMathTextStyle, // Apply user-provided custom math styles (can override)
        ])}
      >
        {mathContent}
      </Text>
    );
    lastIndex = mathRegex.lastIndex;
  }

  // Text part after the last math block (if any)
  if (lastIndex < decoded.length) {
    parts.push(
      <Text key={`text-${lastIndex}-end`} style={baseTextStyle}>
        {decoded.substring(lastIndex)}
      </Text>
    );
  }
  
  // If no math blocks were found, and the input text itself is not empty,
  // return the original text wrapped in a single Text component with base style.
  if (parts.length === 0 && decoded.length > 0) {
     return [<Text key="full-text-segment" style={baseTextStyle}>{decoded}</Text>];
  }

  return parts;
}

interface FormattedSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
}

const parseTextAndCode = (text: string): FormattedSegment[] => {
  const segments: FormattedSegment[] = [];
  let lastIndex = 0;
  const codeBlockRegex = /```([a-zA-Z]*)?\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    const language = match[1] || undefined;
    const codeContent = match[2];
    segments.push({ type: 'code', content: codeContent.trim(), language });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.substring(lastIndex) });
  }
  return segments;
};

interface CodeFormatterProps {
  text: string;
  containerStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>; // For non-math, non-code text parts
  codeBlockContainerStyle?: StyleProp<ViewStyle>; // Corrected to ViewStyle
  codeBlockTextStyle?: StyleProp<TextStyle>;
  mathTextStyle?: StyleProp<TextStyle>; // Custom style for math segments
}

export const CodeFormatter: React.FC<CodeFormatterProps> = ({
  text,
  containerStyle,
  textStyle,
  codeBlockContainerStyle,
  codeBlockTextStyle,
  mathTextStyle, // This will be passed to renderMathInText
}) => {
  if (!text || !text.trim()) {
    return null;
  }

  const segments = parseTextAndCode(text);
  const [fontSizes, setFontSizes] = useState<{ [key: string]: number }>({}); // For code block font adjustment

  // Dynamic font size logic for code blocks (remains unchanged)
  const handleContentSizeChange = (
    index: number,
    contentWidth: number,
    containerWidth: number
  ) => {
    // This logic is for code blocks; math text is handled differently
    if (contentWidth > containerWidth && containerWidth > 0) { // ensure containerWidth is positive
      setFontSizes((prev) => ({
        ...prev,
        [index]: Math.max(8, (prev[index] || 14) * 0.95 ), // Example adjustment
      }));
    } else if (fontSizes[index] && fontSizes[index]! < 14 && containerWidth > contentWidth){
       setFontSizes((prev) => ({
        ...prev,
        [index]: 14, 
      }));
    }
  };
  
  // Base style for regular text parts (non-code, non-math)
  const combinedBaseTextStyle = StyleSheet.flatten([styles.regularText, textStyle]);

  // If no code blocks are found, process the entire text for math formulas
  if (segments.length === 0 && text && text.trim()) {
     return (
        <View style={[styles.defaultContainerStyle]}>
            {renderMathInText(text, combinedBaseTextStyle, mathTextStyle)}
        </View>
     );
  }

  return (
    <View style={[styles.defaultContainerStyle]}>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <View
              key={`code-${index}`}
              style={[styles.codeBlockContainer, codeBlockContainerStyle]}
              onLayout={event => {
                const { width } = event.nativeEvent.layout;
                setFontSizes((prev) => ({
                  ...prev,
                  [`container-${index}`]: width,
                }));
              }}
            >
              <ScrollView
                style={{ flex: 1, width: '100%' }} // Ensure ScrollView takes full width
                horizontal
                showsHorizontalScrollIndicator={true} // Often useful for code
                onContentSizeChange={(contentWidth, contentHeight) => { // contentHeight also available
                  const containerWidth = fontSizes[`container-${index}`] || 0;
                  // Consider triggering handleContentSizeChange only if containerWidth is known
                  if (containerWidth > 0) {
                    handleContentSizeChange(index, contentWidth, containerWidth);
                  }
                }}
              >
                <Text
                  style={[
                    styles.codeBlockText,
                    codeBlockTextStyle,
                    { fontSize: fontSizes[index] || 10 },
                  ]}
                >
                  {segment.content}
                </Text>
              </ScrollView>
            </View>
          );
        } else { // segment.type === 'text'
          // renderMathInText returns an array of <Text> nodes.
          // React can render an array of elements.
          // Provide a key for the React.Fragment that groups these text parts for this segment.
          return (
            <React.Fragment key={`text-segment-${index}`}>
              {renderMathInText(segment.content, combinedBaseTextStyle, mathTextStyle)}
            </React.Fragment>
          );
        }
      })}
    </View>
  );
};

// Default styles for CodeFormatter
const styles = StyleSheet.create({
  defaultContainerStyle: {
    marginVertical: 5,
  },
  regularText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333', // Default dark grey for text
    marginVertical: 2, 
  },
  codeBlockContainer: {
    backgroundColor: '#f0f0f0', // Slightly different shade for distinction
    padding: 15, // Uniform padding
    borderRadius: 6,
    marginVertical: 8,      
    borderWidth: 1,
    borderColor: '#d1d1d1', 
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', 
    color: '#2d3748', // Darker text for code
    fontSize: 14, // Default code font size
    lineHeight: 21,     
  },
});