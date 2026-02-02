import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParsonsProblem, ParsonsLine } from '../types';

// Import Parsons problems data
import parsonsData from '../../parsons_data.json';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ParsonsProblemsProps {
    onBack: () => void;
}

interface DraggableLine extends ParsonsLine {
    isPlaced: boolean;
    position: number;
}

export const ParsonsProblems: React.FC<ParsonsProblemsProps> = ({ onBack }) => {
    const [problems] = useState<ParsonsProblem[]>(parsonsData as ParsonsProblem[]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [availableLines, setAvailableLines] = useState<DraggableLine[]>([]);
    const [placedLines, setPlacedLines] = useState<DraggableLine[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [completed, setCompleted] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        initializeProblem();
    }, [currentIndex]);

    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [currentIndex]);

    const initializeProblem = () => {
        const problem = problems[currentIndex];
        // Shuffle the lines for the available pool
        const shuffled = [...problem.scrambledLines]
            .sort(() => Math.random() - 0.5)
            .map((line, idx) => ({
                ...line,
                isPlaced: false,
                position: idx,
            }));
        setAvailableLines(shuffled);
        setPlacedLines([]);
        setShowResult(false);
        setIsCorrect(false);
    };

    const handleLineTap = (line: DraggableLine, isFromPlaced: boolean) => {
        if (showResult) return;

        if (isFromPlaced) {
            // Move from placed back to available
            setPlacedLines(prev => prev.filter(l => l.id !== line.id));
            setAvailableLines(prev => [...prev, { ...line, isPlaced: false }]);
        } else {
            // Move from available to placed
            setAvailableLines(prev => prev.filter(l => l.id !== line.id));
            setPlacedLines(prev => [...prev, { ...line, isPlaced: true, position: prev.length }]);
        }
    };

    const checkAnswer = () => {
        const problem = problems[currentIndex];
        const placedIds = placedLines.map(l => l.id);
        const correct = JSON.stringify(placedIds) === JSON.stringify(problem.correctOrder);

        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            setCorrectCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < problems.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCompleted(true);
        }
    };

    const resetProblem = () => {
        initializeProblem();
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setCorrectCount(0);
        setCompleted(false);
        initializeProblem();
    };

    if (completed) {
        const percentage = Math.round((correctCount / problems.length) * 100);
        return (
            <View style={styles.container}>
                <View style={styles.completedState}>
                    <Ionicons
                        name={percentage >= 70 ? "code-working" : "code-slash"}
                        size={80}
                        color={percentage >= 70 ? "#4CAF50" : "#4FC3F7"}
                    />
                    <Text style={styles.completedTitle}>Parsons Complete!</Text>
                    <Text style={styles.scoreText}>
                        {correctCount} / {problems.length} correct ({percentage}%)
                    </Text>
                    <Text style={styles.encouragementText}>
                        {percentage >= 90 ? "Master code organizer! 🏆" :
                            percentage >= 70 ? "Great logical thinking! 🎯" :
                                percentage >= 50 ? "Good progress! Keep practicing 💪" :
                                    "Focus on the structure! 📚"}
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

    const currentProblem = problems[currentIndex];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📦 Parsons Problems</Text>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {problems.length}
                </Text>
            </View>

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${((currentIndex + 1) / problems.length) * 100}%` }
                    ]}
                />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View style={[styles.problemCard, { opacity: fadeAnim }]}>
                    <Text style={styles.problemTitle}>{currentProblem.title}</Text>
                    <Text style={styles.problemDescription}>{currentProblem.description}</Text>
                </Animated.View>

                <Text style={styles.sectionTitle}>📝 Your Solution (tap to remove)</Text>
                <View style={styles.placedContainer}>
                    {placedLines.length === 0 ? (
                        <Text style={styles.placeholderText}>Tap lines below to add them here...</Text>
                    ) : (
                        placedLines.map((line, index) => (
                            <TouchableOpacity
                                key={line.id}
                                style={[
                                    styles.codeLine,
                                    styles.placedLine,
                                    showResult && (
                                        problems[currentIndex].correctOrder[index] === line.id
                                            ? styles.correctLine
                                            : styles.incorrectLine
                                    ),
                                    { marginLeft: line.indent * 16 },
                                ]}
                                onPress={() => handleLineTap(line, true)}
                                disabled={showResult}
                            >
                                <Text style={styles.lineNumber}>{index + 1}</Text>
                                <Text style={styles.codeText}>{line.code}</Text>
                                {showResult && (
                                    <Ionicons
                                        name={problems[currentIndex].correctOrder[index] === line.id ? "checkmark" : "close"}
                                        size={18}
                                        color={problems[currentIndex].correctOrder[index] === line.id ? "#4CAF50" : "#f44336"}
                                    />
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <Text style={styles.sectionTitle}>🧩 Available Lines (tap to add)</Text>
                <View style={styles.availableContainer}>
                    {availableLines.map((line) => (
                        <TouchableOpacity
                            key={line.id}
                            style={[styles.codeLine, styles.availableLine]}
                            onPress={() => handleLineTap(line, false)}
                            disabled={showResult}
                        >
                            <Text style={styles.codeText}>{line.code}</Text>
                        </TouchableOpacity>
                    ))}
                    {availableLines.length === 0 && !showResult && (
                        <Text style={styles.allPlacedText}>All lines placed! Check your answer.</Text>
                    )}
                </View>

                {!showResult && placedLines.length > 0 && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.resetButton} onPress={resetProblem}>
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.checkButton,
                                availableLines.length > 0 && styles.checkButtonDisabled
                            ]}
                            onPress={checkAnswer}
                            disabled={availableLines.length > 0}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                            <Text style={styles.actionButtonText}>Check Answer</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showResult && (
                    <View style={[styles.resultCard, isCorrect ? styles.correctResult : styles.incorrectResult]}>
                        <Text style={styles.resultTitle}>
                            {isCorrect ? '✅ Perfect Order!' : '❌ Not Quite Right'}
                        </Text>
                        <Text style={styles.resultText}>
                            {isCorrect
                                ? 'You arranged all the code lines correctly!'
                                : 'Some lines are in the wrong position. The correct positions are highlighted.'}
                        </Text>
                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentIndex < problems.length - 1 ? 'Next Problem' : 'See Results'}
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
        backgroundColor: '#FF9800',
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
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.3)',
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
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    placedContainer: {
        minHeight: 120,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 152, 0, 0.3)',
        borderStyle: 'dashed',
    },
    placeholderText: {
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        paddingVertical: 40,
        fontStyle: 'italic',
    },
    allPlacedText: {
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        paddingVertical: 20,
        fontStyle: 'italic',
    },
    availableContainer: {
        minHeight: 80,
        marginBottom: 20,
        gap: 8,
    },
    codeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 6,
    },
    placedLine: {
        backgroundColor: 'rgba(255, 152, 0, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 152, 0, 0.3)',
    },
    availableLine: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    correctLine: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
    },
    incorrectLine: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderColor: '#f44336',
    },
    lineNumber: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '600',
        marginRight: 12,
        width: 20,
    },
    codeText: {
        flex: 1,
        fontFamily: 'monospace',
        fontSize: 13,
        color: '#E0E0E0',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    checkButton: {
        flex: 2,
        backgroundColor: '#FF9800',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    checkButtonDisabled: {
        opacity: 0.5,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    resultCard: {
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
    },
    correctResult: {
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderColor: 'rgba(76, 175, 80, 0.4)',
    },
    incorrectResult: {
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        borderColor: 'rgba(244, 67, 54, 0.4)',
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    resultText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
        marginBottom: 16,
    },
    nextButton: {
        backgroundColor: '#FF9800',
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
        backgroundColor: '#FF9800',
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

export default ParsonsProblems;
