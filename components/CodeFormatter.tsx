import React, { useState } from 'react';
import { Text, View, StyleSheet, Platform, ScrollView } from 'react-native';

/**
 * Defines the structure for a segment of text, which can either be
 * plain text or a code block.
 */
interface FormattedSegment {
  type: 'text' | 'code';
  content: string;
  language?: string; // Optional language for the code block (e.g., "typescript")
}

/**
 * Parses a string to identify and separate regular text from fenced code blocks.
 * Code blocks are expected in the format: ```language\ncode\n``` or ```\ncode\n```
 *
 * @param text The input string to parse.
 * @returns An array of segments, each typed as 'text' or 'code'.
 */
const parseTextAndCode = (text: string): FormattedSegment[] => {
  const segments: FormattedSegment[] = [];
  let lastIndex = 0;
  // Regex to find fenced code blocks: ```lang\ncode\n``` or ```\ncode\n```
  // Captures: 1: language (optional), 2: code content
  const codeBlockRegex = /```([a-zA-Z]*)?\n([\s\S]*?)\n```/g;

  let match;80
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text segment before the current code block
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }

    // Add code block segment
    const language = match[1] || undefined; // Language (e.g., "typescript", "javascript")
    const codeContent = match[2]; // The actual code content
    segments.push({ type: 'code', content: codeContent.trim(), language });

    lastIndex = codeBlockRegex.lastIndex; // Update position for next search
  }

  // Add any remaining text segment after the last code block
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return segments;
};

/**
 * Props for the CodeFormatter component.
 */
interface CodeFormatterProps {
  /** The text content which may include markdown-style fenced code blocks. */
  text: string;
  /** Custom style for the root container of the formatter. */
  containerStyle?: object;
  /** Custom style for regular text segments. */
  textStyle?: object;
  /** Custom style for the code block container (the <View> wrapping code). */
  codeBlockContainerStyle?: object;
  /** Custom style for the text within code blocks. */
  codeBlockTextStyle?: object;
}

/**
 * A React Native component that formats a string containing markdown-style
 * fenced code blocks (e.g., ```typescript\ncode\n```). It renders regular
 * text normally and code blocks with a distinct style, similar to how
 * JIRA or Confluence display code.
 *
 * Note: This component formats fenced code blocks. Inline code (`like this`)
 * and other markdown (e.g., bold, italics) will be rendered as plain text.
 */
export const CodeFormatter: React.FC<CodeFormatterProps> = ({
  text,
  containerStyle,
  textStyle,
  codeBlockContainerStyle,
  codeBlockTextStyle,
}) => {
  // If the input text is empty or only whitespace, render nothing.
  if (!text || !text.trim()) {
    return null;
  }

  const segments = parseTextAndCode(text);

  // State to track dynamic font size for each code block
 const [fontSizes, setFontSizes] = useState<{ [key: string]: number }>({});

  // Helper to handle font size adjustment
  const handleContentSizeChange = (
    index: number,
    contentWidth: number,
    containerWidth: number
  ) => {
    if (contentWidth > containerWidth) {
      setFontSizes((prev) => ({
        ...prev,
        [index]: 12, // Decrease font size if overflow
      }));
    } else {
      setFontSizes((prev) => ({
        ...prev,
        [index]: 14, // Default font size
      }));
    }
  };

  // If parsing results in no segments (e.g., error or unexpected case),
  // or if text has content but no code blocks, it will be rendered as plain text.
  if (segments.length === 0) {
     return (
        <View style={containerStyle}>
            <Text style={[styles.regularText, textStyle]}>{text}</Text>
        </View>
     );
  }

  return (
    <View style={containerStyle}>
      {segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <View
              key={`code-${index}`}
              style={[styles.codeBlockContainer, codeBlockContainerStyle]}
              onLayout={event => {
                // Store container width for this code block
                const { width } = event.nativeEvent.layout;
                setFontSizes((prev) => ({
                  ...prev,
                  [`container-${index}`]: width,
                }));
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                onContentSizeChange={(contentWidth) => {
                  const containerWidth = fontSizes[`container-${index}`] || 0;
                  handleContentSizeChange(index, contentWidth, containerWidth);
                }}
              >
                <Text
                  style={[
                    styles.codeBlockText,
                    codeBlockTextStyle,
                    { fontSize: fontSizes[index] || 14 },
                  ]}
                >
                  {segment.content}
                </Text>
              </ScrollView>
            </View>
          );
        }
        return (
          <Text key={`text-${index}`} style={[styles.regularText, textStyle]}>
            {segment.content}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  regularText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333', // Default dark grey for text
    marginVertical: 2, // Small vertical margin for text flow
  },
  codeBlockContainer: {
    backgroundColor: '#f5f5f5', // Light grey background for code blocks
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 10,      // Vertical space around code blocks
    borderWidth: 1,
    borderColor: '#e0e0e0', // Subtle border for the code block
  },
  codeBlockText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', // Monospaced font
    color: '#232323', // Darker text for code, for contrast
    fontSize: 14,
    lineHeight: 20,     // Specific line height for code readability
  },
});

// To use this component:
// import { CodeFormatter } from './CodeFormatter'; // Adjust path as needed
//
// const myStringWithCode = `
// This is some introductory text.
// ```typescript
// function greet(name: string): string {
//   return \`Hello, \${name}!\`;
// }
// console.log(greet("World"));
// ```
// And this is some concluding text.
// `;
//
// <CodeFormatter text={myStringWithCode} />