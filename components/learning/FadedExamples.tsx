import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Animated,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadedExample, FadedExampleStage } from '../types';

// Import faded examples data
import fadedExamplesData from '../../faded_examples.json';

interface FadedExamplesProps {
    onBack: () => void;
}

export const FadedExamples: React.FC<FadedExamplesProps> = ({ onBack }) => {
    const [examples] = useState<FadedExample[]>(fadedExamplesData as FadedExample[]);
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [userInputs, setUserInputs] = useState<Record<number, string>>({});
    const [showResult, setShowResult] = useState(false);
    const [allCorrect, setAllCorrect] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [currentExampleIndex, currentStageIndex]);

    const currentExample = examples[currentExampleIndex];
    const currentStage = currentExample?.stages[currentStageIndex];
    const isReadOnlyStage = currentStage?.blanks.length === 0;

    const handleInputChange = (index: number, value: string) => {
        setUserInputs(prev => ({ ...prev, [index]: value }));
    };

    const checkAnswers = () => {
        const blanks = currentStage.blanks;
        const correct = blanks.every((blank, idx) => {
            const userAnswer = userInputs[idx]?.trim().toLowerCase() || '';
            const correctAnswer = blank.answer.toLowerCase();
            return userAnswer === correctAnswer;
        });

        setAllCorrect(correct);
        setShowResult(true);

        if (correct) {
            setCorrectCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        setUserInputs({});
        setShowResult(false);

        if (currentStageIndex < currentExample.stages.length - 1) {
            // Next stage of current example
            setCurrentStageIndex(prev => prev + 1);
        } else if (currentExampleIndex < examples.length - 1) {
            // Next example
            setCurrentExampleIndex(prev => prev + 1);
            setCurrentStageIndex(0);
        } else {
            // Completed all
            setCompleted(true);
        }
    };

    const resetAll = () => {
        setCurrentExampleIndex(0);
        setCurrentStageIndex(0);
        setUserInputs({});
        setShowResult(false);
        setAllCorrect(false);
        setCorrectCount(0);
        setCompleted(false);
    };

    const renderCodeWithBlanks = () => {
        if (!currentStage) return null;

        const lines = currentStage.code.split('\n');
        let blankIndex = 0;

        return lines.map((line, lineIdx) => {
            if (line.includes('___BLANK___')) {
                const blank = currentStage.blanks[blankIndex];
                const currentBlankIndex = blankIndex;
                blankIndex++;

                const parts = line.split('___BLANK___');
                const userValue = userInputs[currentBlankIndex] || '';
                const isCorrect = showResult && userValue.trim().toLowerCase() === blank.answer.toLowerCase();
                const isWrong = showResult && userValue.trim().toLowerCase() !== blank.answer.toLowerCase();

                return (
                    <View key={lineIdx} style={styles.codeLine}>
                        <Text style={styles.lineNumber}>{lineIdx + 1}</Text>
                        <View style={styles.lineContent}>
                            <Text style={styles.codeText}>{parts[0]}</Text>
                            <TextInput
                                style={[
                                    styles.blankInput,
                                    isCorrect && styles.correctInput,
                                    isWrong && styles.wrongInput,
                                ]}
                                value={userValue}
                                onChangeText={(text) => handleInputChange(currentBlankIndex, text)}
                                placeholder="fill in..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                editable={!showResult}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <Text style={styles.codeText}>{parts[1] || ''}</Text>
                        </View>
                    </View>
                );
            }

            return (
                <View key={lineIdx} style={styles.codeLine}>
                    <Text style={styles.lineNumber}>{lineIdx + 1}</Text>
                    <Text style={styles.codeText}>{line}</Text>
                </View>
            );
        });
    };

    if (completed) {
        const totalStagesWithBlanks = examples.reduce((acc, ex) =>
            acc + ex.stages.filter(s => s.blanks.length > 0).length, 0
        );
        const percentage = Math.round((correctCount / totalStagesWithBlanks) * 100);

        return (
            <View style={styles.container}>
                <View style={styles.completedState}>
                    <Ionicons
                        name={percentage >= 70 ? "school" : "book"}
                        size={80}
                        color={percentage >= 70 ? "#4CAF50" : "#4FC3F7"}
                    />
                    <Text style={styles.completedTitle}>Scaffolding Complete!</Text>
                    <Text style={styles.scoreText}>
                        {correctCount} / {totalStagesWithBlanks} stages correct ({percentage}%)
                    </Text>
                    <Text style={styles.encouragementText}>
                        {percentage >= 90 ? "You've mastered these patterns! 🏆" :
                            percentage >= 70 ? "Great understanding! 🎯" :
                                "Keep practicing these patterns! 📚"}
                    </Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
                            <Ionicons name="arrow-back" size={20} color="white" />
                            <Text style={styles.buttonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryButton} onPress={resetAll}>
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text style={styles.buttonText}>Start Over</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📖 Faded Examples</Text>
                <Text style={styles.progressText}>
                    {currentExampleIndex + 1}.{currentStageIndex + 1}
                </Text>
            </View>

            {/* Stage progress dots */}
            <View style={styles.stageProgress}>
                {currentExample.stages.map((_, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.stageDot,
                            idx === currentStageIndex && styles.stageDotActive,
                            idx < currentStageIndex && styles.stageDotComplete,
                        ]}
                    />
                ))}
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View style={[styles.exampleCard, { opacity: fadeAnim }]}>
                    <Text style={styles.exampleTitle}>{currentExample.title}</Text>
                    <Text style={styles.stageDescription}>{currentStage.description}</Text>
                </Animated.View>

                <View style={styles.codeCard}>
                    <View style={styles.codeHeader}>
                        <View style={styles.codeHeaderDot} />
                        <View style={[styles.codeHeaderDot, { backgroundColor: '#FFBD2E' }]} />
                        <View style={[styles.codeHeaderDot, { backgroundColor: '#27C93F' }]} />
                        <Text style={styles.codeHeaderTitle}>
                            Stage {currentStageIndex + 1} of {currentExample.stages.length}
                        </Text>
                    </View>
                    <ScrollView
                        style={styles.codeContent}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View style={styles.codeInner}>
                            {renderCodeWithBlanks()}
                        </View>
                    </ScrollView>
                </View>

                {showResult && (
                    <View style={[styles.resultCard, allCorrect ? styles.correctResult : styles.wrongResult]}>
                        <Text style={styles.resultTitle}>
                            {allCorrect ? '✅ Perfect!' : '❌ Not quite right'}
                        </Text>
                        {!allCorrect && (
                            <View style={styles.correctAnswers}>
                                <Text style={styles.correctAnswersTitle}>Correct answers:</Text>
                                {currentStage.blanks.map((blank, idx) => (
                                    <Text key={idx} style={styles.correctAnswerText}>
                                        {idx + 1}. <Text style={styles.codeInline}>{blank.answer}</Text>
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {!showResult && !isReadOnlyStage && (
                    <TouchableOpacity style={styles.checkButton} onPress={checkAnswers}>
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.checkButtonText}>Check Answers</Text>
                    </TouchableOpacity>
                )}

                {(showResult || isReadOnlyStage) && (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>
                            {currentStageIndex < currentExample.stages.length - 1
                                ? 'Next Stage'
                                : currentExampleIndex < examples.length - 1
                                    ? 'Next Example'
                                    : 'Finish'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerBack: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    progressText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    stageProgress: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    stageDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    stageDotActive: {
        backgroundColor: '#00BCD4',
        transform: [{ scale: 1.2 }],
    },
    stageDotComplete: {
        backgroundColor: '#4CAF50',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    exampleCard: {
        backgroundColor: 'rgba(0, 188, 212, 0.15)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 188, 212, 0.3)',
    },
    exampleTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    stageDescription: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
    },
    codeCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
    },
    codeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#323232',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    codeHeaderDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF5F56',
    },
    codeHeaderTitle: {
        marginLeft: 10,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    codeContent: {
        padding: 16,
        maxHeight: 350,
    },
    codeInner: {
        minWidth: '100%',
    },
    codeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 28,
        marginBottom: 2,
    },
    lineNumber: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        width: 28,
        textAlign: 'right',
        marginRight: 12,
        fontFamily: 'monospace',
    },
    lineContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 13,
        color: '#E0E0E0',
    },
    blankInput: {
        backgroundColor: 'rgba(0, 188, 212, 0.2)',
        borderWidth: 1,
        borderColor: '#00BCD4',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 120,
        fontFamily: 'monospace',
        fontSize: 13,
        color: 'white',
    },
    correctInput: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
    },
    wrongInput: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderColor: '#f44336',
    },
    checkButton: {
        backgroundColor: '#00BCD4',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    checkButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    resultCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    correctResult: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderColor: 'rgba(76, 175, 80, 0.4)',
    },
    wrongResult: {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        borderColor: 'rgba(244, 67, 54, 0.4)',
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    correctAnswers: {
        marginTop: 8,
    },
    correctAnswersTitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginBottom: 8,
    },
    correctAnswerText: {
        color: 'white',
        fontSize: 14,
        marginBottom: 4,
    },
    codeInline: {
        fontFamily: 'monospace',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 6,
        borderRadius: 4,
    },
    nextButton: {
        backgroundColor: '#00BCD4',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    completedState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    completedTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: 'white',
        marginTop: 16,
        marginBottom: 12,
    },
    scoreText: {
        fontSize: 20,
        color: 'white',
        fontWeight: '600',
        marginBottom: 8,
    },
    encouragementText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 32,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    primaryButton: {
        backgroundColor: '#00BCD4',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FadedExamples;
