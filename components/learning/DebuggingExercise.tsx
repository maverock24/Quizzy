import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DebuggingExercise as DebuggingExerciseType } from '../types';

// Import debugging exercises data
import debuggingData from '../../debugging_exercises.json';

interface DebuggingExerciseProps {
    onBack: () => void;
}

export const DebuggingExercise: React.FC<DebuggingExerciseProps> = ({ onBack }) => {
    const [exercises] = useState<DebuggingExerciseType[]>(debuggingData as DebuggingExerciseType[]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedLine, setSelectedLine] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [showFix, setShowFix] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [completed, setCompleted] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [currentIndex]);

    const handleLineSelect = (lineIndex: number) => {
        if (showResult) return;

        setSelectedLine(lineIndex);
        setShowResult(true);

        if (lineIndex === exercises[currentIndex].buggyLineIndex) {
            setCorrectCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedLine(null);
            setShowResult(false);
            setShowFix(false);
        } else {
            setCompleted(true);
        }
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setSelectedLine(null);
        setShowResult(false);
        setShowFix(false);
        setCorrectCount(0);
        setCompleted(false);
    };

    if (completed) {
        const percentage = Math.round((correctCount / exercises.length) * 100);
        return (
            <View style={styles.container}>
                <View style={styles.completedState}>
                    <Ionicons
                        name={percentage >= 70 ? "bug" : "search"}
                        size={80}
                        color={percentage >= 70 ? "#4CAF50" : "#f44336"}
                    />
                    <Text style={styles.completedTitle}>Bug Hunt Complete!</Text>
                    <Text style={styles.scoreText}>
                        {correctCount} / {exercises.length} bugs found ({percentage}%)
                    </Text>
                    <Text style={styles.encouragementText}>
                        {percentage >= 90 ? "You're a debugging master! 🐛🔍" :
                            percentage >= 70 ? "Great bug detection skills! 🎯" :
                                percentage >= 50 ? "Keep hunting those bugs! 💪" :
                                    "Practice makes a better debugger! 🔧"}
                    </Text>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
                            <Ionicons name="arrow-back" size={20} color="white" />
                            <Text style={styles.buttonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryButton} onPress={resetQuiz}>
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    const currentExercise = exercises[currentIndex];
    const codeLines = currentExercise.code.split('\n');
    const isCorrect = selectedLine === currentExercise.buggyLineIndex;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🐛 Bug Hunter</Text>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {exercises.length}
                </Text>
            </View>

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${((currentIndex + 1) / exercises.length) * 100}%` }
                    ]}
                />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View style={[styles.problemCard, { opacity: fadeAnim }]}>
                    <Text style={styles.problemTitle}>{currentExercise.title}</Text>
                    <Text style={styles.problemDescription}>{currentExercise.description}</Text>
                </Animated.View>

                <Text style={styles.instruction}>
                    👆 Tap the line with the bug
                </Text>

                <View style={styles.codeCard}>
                    <View style={styles.codeHeader}>
                        <View style={styles.codeHeaderDot} />
                        <View style={[styles.codeHeaderDot, { backgroundColor: '#FFBD2E' }]} />
                        <View style={[styles.codeHeaderDot, { backgroundColor: '#27C93F' }]} />
                        <Text style={styles.codeHeaderTitle}>buggy_code.js</Text>
                    </View>
                    <ScrollView
                        style={styles.codeContent}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View>
                            {codeLines.map((line, idx) => {
                                const isBuggyLine = idx === currentExercise.buggyLineIndex;
                                const isSelected = idx === selectedLine;

                                let lineStyle = styles.codeLine;
                                if (showResult) {
                                    if (isBuggyLine) {
                                        lineStyle = { ...styles.codeLine, ...styles.correctLine };
                                    } else if (isSelected) {
                                        lineStyle = { ...styles.codeLine, ...styles.wrongLine };
                                    }
                                } else if (isSelected) {
                                    lineStyle = { ...styles.codeLine, ...styles.selectedLine };
                                }

                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={lineStyle}
                                        onPress={() => handleLineSelect(idx)}
                                        disabled={showResult}
                                    >
                                        <Text style={styles.lineNumber}>{idx + 1}</Text>
                                        <Text style={styles.codeText}>{line || ' '}</Text>
                                        {showResult && isBuggyLine && (
                                            <Ionicons name="bug" size={16} color="#f44336" style={styles.bugIcon} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>

                {showResult && (
                    <View style={[styles.resultCard, isCorrect ? styles.correctResult : styles.wrongResult]}>
                        <Text style={styles.resultTitle}>
                            {isCorrect ? '🎯 Bug Found!' : '❌ Wrong Line'}
                        </Text>
                        <Text style={styles.explanationText}>
                            {currentExercise.explanation}
                        </Text>

                        <TouchableOpacity
                            style={styles.showFixButton}
                            onPress={() => setShowFix(!showFix)}
                        >
                            <Ionicons name={showFix ? "chevron-up" : "chevron-down"} size={20} color="white" />
                            <Text style={styles.showFixButtonText}>
                                {showFix ? 'Hide Fix' : 'Show Fixed Code'}
                            </Text>
                        </TouchableOpacity>

                        {showFix && (
                            <View style={styles.fixedCodeCard}>
                                <Text style={styles.fixedCodeTitle}>✅ Fixed Code:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <Text style={styles.fixedCodeText}>
                                        {currentExercise.fixedCode}
                                    </Text>
                                </ScrollView>
                            </View>
                        )}

                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentIndex < exercises.length - 1 ? 'Next Bug' : 'See Results'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
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
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 16,
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#f44336',
        borderRadius: 2,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    problemCard: {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.3)',
    },
    problemTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    problemDescription: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
    },
    instruction: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginBottom: 12,
    },
    codeCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
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
        padding: 8,
    },
    codeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    selectedLine: {
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
    },
    correctLine: {
        backgroundColor: 'rgba(76, 175, 80, 0.25)',
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    wrongLine: {
        backgroundColor: 'rgba(244, 67, 54, 0.25)',
        borderLeftWidth: 3,
        borderLeftColor: '#f44336',
    },
    lineNumber: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        width: 24,
        textAlign: 'right',
        marginRight: 12,
        fontFamily: 'monospace',
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 13,
        color: '#E0E0E0',
        flex: 1,
    },
    bugIcon: {
        marginLeft: 8,
    },
    resultCard: {
        borderRadius: 16,
        padding: 20,
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
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 12,
    },
    explanationText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 22,
        marginBottom: 16,
    },
    showFixButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
    },
    showFixButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    fixedCodeCard: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    fixedCodeTitle: {
        color: '#4CAF50',
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 14,
    },
    fixedCodeText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#E0E0E0',
        lineHeight: 18,
    },
    nextButton: {
        backgroundColor: '#f44336',
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
        backgroundColor: '#f44336',
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

export default DebuggingExercise;
