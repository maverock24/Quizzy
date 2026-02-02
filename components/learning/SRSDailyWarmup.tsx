import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuiz } from '../Quizprovider';
import {
    getDueQuestions,
    recordAnswer,
    getSRSStats,
    SRSReviewQuestion,
} from './SRSManager';

interface SRSDailyWarmupProps {
    onBack: () => void;
}

export const SRSDailyWarmup: React.FC<SRSDailyWarmupProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const { quizzes } = useQuiz();

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<SRSReviewQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [stats, setStats] = useState({ totalTracked: 0, dueToday: 0, masteredCount: 0 });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        loadQuestions();
    }, [quizzes]);

    useEffect(() => {
        // Animate in when question changes
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [currentIndex]);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const dueQuestions = await getDueQuestions(quizzes, 10);
            const srsStats = await getSRSStats();
            setQuestions(dueQuestions);
            setStats(srsStats);
        } catch (error) {
            console.error('Failed to load SRS questions:', error);
        }
        setLoading(false);
    };

    const handleAnswerSelect = async (answer: string) => {
        if (showResult) return;

        setSelectedAnswer(answer);
        setShowResult(true);

        const currentQuestion = questions[currentIndex];
        const isCorrect = answer === currentQuestion.correctAnswer;

        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
        }

        // Record answer for SRS
        await recordAnswer(
            currentQuestion.quizName,
            currentQuestion.question,
            isCorrect
        );
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

    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#4FC3F7" />
                <Text style={styles.loadingText}>Loading your daily warmup...</Text>
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                    <Text style={styles.emptyTitle}>All caught up! 🎉</Text>
                    <Text style={styles.emptySubtitle}>
                        No questions due for review right now.
                    </Text>
                    <Text style={styles.statsText}>
                        📊 {stats.totalTracked} questions tracked • {stats.masteredCount} mastered
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Ionicons name="arrow-back" size={20} color="white" />
                        <Text style={styles.backButtonText}>Back to Learn</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (completed) {
        const percentage = Math.round((correctCount / questions.length) * 100);
        return (
            <View style={styles.container}>
                <View style={styles.completedState}>
                    <Ionicons
                        name={percentage >= 70 ? "trophy" : "fitness"}
                        size={80}
                        color={percentage >= 70 ? "#FFD700" : "#4FC3F7"}
                    />
                    <Text style={styles.completedTitle}>Warmup Complete!</Text>
                    <Text style={styles.scoreText}>
                        {correctCount} / {questions.length} correct ({percentage}%)
                    </Text>
                    <Text style={styles.encouragementText}>
                        {percentage >= 90 ? "Outstanding! 🌟" :
                            percentage >= 70 ? "Great job! 👏" :
                                percentage >= 50 ? "Good effort! Keep practicing 💪" :
                                    "Keep at it! Practice makes perfect 📚"}
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Ionicons name="arrow-back" size={20} color="white" />
                        <Text style={styles.backButtonText}>Back to Learn</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const currentQuestion = questions[currentIndex];
    const shuffledAnswers = React.useMemo(
        () => shuffleArray(currentQuestion.answers),
        [currentIndex]
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBack}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Warmup</Text>
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
                <Animated.View
                    style={[
                        styles.questionCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.quizName}>{currentQuestion.quizName}</Text>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </Animated.View>

                <View style={styles.answersContainer}>
                    {shuffledAnswers.map((ans, index) => {
                        const isSelected = selectedAnswer === ans.answer;
                        const isCorrect = ans.answer === currentQuestion.correctAnswer;

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
                                onPress={() => handleAnswerSelect(ans.answer)}
                                disabled={showResult}
                            >
                                <Text style={textStyle}>{ans.answer}</Text>
                                {showResult && isCorrect && (
                                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                )}
                                {showResult && isSelected && !isCorrect && (
                                    <Ionicons name="close-circle" size={24} color="#f44336" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {showResult && (
                    <View style={styles.explanationCard}>
                        <Text style={styles.explanationTitle}>
                            {selectedAnswer === currentQuestion.correctAnswer ? '✅ Correct!' : '❌ Incorrect'}
                        </Text>
                        <Text style={styles.explanationText}>
                            {currentQuestion.explanation}
                        </Text>
                        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                            <Text style={styles.nextButtonText}>
                                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
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
        fontSize: 20,
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
        backgroundColor: '#4FC3F7',
        borderRadius: 2,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    quizName: {
        fontSize: 12,
        color: '#4FC3F7',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    questionText: {
        fontSize: 18,
        color: 'white',
        lineHeight: 26,
        fontWeight: '500',
    },
    answersContainer: {
        gap: 12,
    },
    answerButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    answerText: {
        fontSize: 16,
        color: 'white',
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
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        borderRadius: 16,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(79, 195, 247, 0.3)',
    },
    explanationTitle: {
        fontSize: 18,
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
        backgroundColor: '#4FC3F7',
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
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: 16,
    },
    statsText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 32,
    },
    backButton: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    completedState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    completedTitle: {
        fontSize: 28,
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
    },
});

export default SRSDailyWarmup;
