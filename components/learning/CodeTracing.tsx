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
import { CodeTracingQuestion } from '../types';

// Import code tracing data
import codeTracingData from '../../code_tracing.json';

interface CodeTracingProps {
    onBack: () => void;
}

export const CodeTracing: React.FC<CodeTracingProps> = ({ onBack }) => {
    const [questions] = useState<CodeTracingQuestion[]>(codeTracingData as CodeTracingQuestion[]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
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

    const handleAnswerSelect = (answer: string) => {
        if (showResult) return;

        setSelectedAnswer(answer);
        setShowResult(true);

        if (answer === questions[currentIndex].correctAnswer) {
            setCorrectCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            setCompleted(true);
        }
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setCorrectCount(0);
        setCompleted(false);
    };

    if (completed) {
        const percentage = Math.round((correctCount / questions.length) * 100);
        return (
            <View style={styles.container}>
                <View style={styles.completedState}>
                    <Ionicons
                        name={percentage >= 70 ? "bulb" : "code-slash"}
                        size={80}
                        color={percentage >= 70 ? "#FFD700" : "#4FC3F7"}
                    />
                    <Text style={styles.completedTitle}>Code Tracing Complete!</Text>
                    <Text style={styles.scoreText}>
                        {correctCount} / {questions.length} correct ({percentage}%)
                    </Text>
                    <Text style={styles.encouragementText}>
                        {percentage >= 90 ? "You're a mental compiler! 🧠" :
                            percentage >= 70 ? "Great mental model! 🎯" :
                                percentage >= 50 ? "Keep building that mental model 💪" :
                                    "Practice makes the mental compiler stronger! 🔧"}
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

    const currentQuestion = questions[currentIndex];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🧠 Mental Compiler</Text>
                <Text style={styles.progressText}>
                    {currentIndex + 1} / {questions.length}
                </Text>
            </View>

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${((currentIndex + 1) / questions.length) * 100}%` }
                    ]}
                />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View style={[styles.codeCard, { opacity: fadeAnim }]}>
                    <View style={styles.codeHeader}>
                        <View style={styles.codeHeaderDot} />
                        <View style={[styles.codeHeaderDot, { backgroundColor: '#FFBD2E' }]} />
                        <View style={[styles.codeHeaderDot, { backgroundColor: '#27C93F' }]} />
                        <Text style={styles.codeHeaderTitle}>script.js</Text>
                    </View>
                    <ScrollView
                        style={styles.codeContent}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <Text style={styles.codeText}>
                            {currentQuestion.code}
                        </Text>
                    </ScrollView>
                </Animated.View>

                <View style={styles.questionCard}>
                    <Ionicons name="help-circle" size={24} color="#4FC3F7" style={styles.questionIcon} />
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>

                <View style={styles.answersContainer}>
                    {currentQuestion.options.map((option, index) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrect = option === currentQuestion.correctAnswer;

                        let buttonStyle = styles.answerButton;
                        let textStyle = styles.answerText;

                        if (showResult) {
                            if (isCorrect) {
                                buttonStyle = { ...styles.answerButton, ...styles.correctButton };
                                textStyle = { ...styles.answerText, ...styles.correctText };
                            } else if (isSelected && !isCorrect) {
                                buttonStyle = { ...styles.answerButton, ...styles.incorrectButton };
                                textStyle = { ...styles.answerText, ...styles.incorrectText };
                            }
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                style={buttonStyle}
                                onPress={() => handleAnswerSelect(option)}
                                disabled={showResult}
                            >
                                <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)}.</Text>
                                <Text style={[textStyle, styles.optionText]}>{option}</Text>
                                {showResult && isCorrect && (
                                    <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                                )}
                                {showResult && isSelected && !isCorrect && (
                                    <Ionicons name="close-circle" size={22} color="#f44336" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {showResult && (
                    <View style={styles.explanationCard}>
                        <Text style={styles.explanationTitle}>
                            {selectedAnswer === currentQuestion.correctAnswer
                                ? '✅ Correct! You traced it right.'
                                : '❌ Not quite. Here\'s the trace:'}
                        </Text>
                        <Text style={styles.explanationText}>
                            {currentQuestion.explanation}
                        </Text>
                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentIndex < questions.length - 1 ? 'Next Challenge' : 'See Results'}
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
        backgroundColor: '#9C27B0',
        borderRadius: 2,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
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
        padding: 16,
        maxHeight: 200,
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#E0E0E0',
        lineHeight: 22,
    },
    questionCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(156, 39, 176, 0.15)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(156, 39, 176, 0.3)',
    },
    questionIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    questionText: {
        flex: 1,
        fontSize: 17,
        color: 'white',
        fontWeight: '600',
        lineHeight: 24,
    },
    answersContainer: {
        gap: 10,
    },
    answerButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    optionLabel: {
        color: '#9C27B0',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        width: 24,
    },
    answerText: {
        fontSize: 15,
        color: 'white',
    },
    optionText: {
        flex: 1,
        marginRight: 8,
    },
    correctButton: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
    },
    correctText: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    incorrectButton: {
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        borderColor: '#f44336',
    },
    incorrectText: {
        color: '#f44336',
        fontWeight: '600',
    },
    explanationCard: {
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(156, 39, 176, 0.3)',
    },
    explanationTitle: {
        fontSize: 17,
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
    nextButton: {
        backgroundColor: '#9C27B0',
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
        backgroundColor: '#9C27B0',
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

export default CodeTracing;
