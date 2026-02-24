import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, BackHandler, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { multiplayerService, Player, GameState } from '../../services/MultiplayerService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuiz } from '../../components/Quizprovider';
import { Question } from '../../components/Question';
import { Answer, QuizQuestion } from '../../components/types';
import { QuizSelection } from '../../components/QuizSelection';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';

// Helper to shuffle
const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export default function MultiplayerRoom() {
    const { code, name, isHost, initialQuizId } = useLocalSearchParams<{ code: string; name: string; isHost: string, initialQuizId: string }>();
    const router = useRouter();
    const { quizzes } = useQuiz();

    const [players, setPlayers] = useState<Player[]>([]);
    const [gameState, setGameState] = useState<GameState>({ status: 'waiting', currentQuestionIndex: 0 });
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [randomizedQuestions, setRandomizedQuestions] = useState<QuizQuestion[]>([]);
    const [randomizedAnswers, setRandomizedAnswers] = useState<Answer[]>([]);

    // Host-only state
    const [isQuizSelectorVisible, setIsQuizSelectorVisible] = useState(false);

    // Unified leave handler
    const handleLeave = () => {
        Alert.alert('Leave Game?', 'Are you sure you want to leave?', [
            { text: 'Cancel', onPress: () => null, style: 'cancel' },
            {
                text: 'Leave', onPress: () => {
                    router.replace('/multiplayer');
                }
            },
        ]);
        return true;
    };

    useEffect(() => {
        // Handle explicit initial quiz (from join)
        if (initialQuizId && !selectedQuiz) {
            const found = quizzes.find(q => q.name === initialQuizId); // assuming ID is name for now
            if (found) {
                setSelectedQuiz(found);
                setRandomizedQuestions(shuffleArray(found.questions));
            }
        }

        // Setup listeners
        multiplayerService.onPlayerJoin((player) => {
            setPlayers(prev => {
                if (prev.find(p => p.id === player.id)) return prev;
                return [...prev, player];
            });
        });

        multiplayerService.onGameStateChange((newState) => {
            setGameState(newState);
            // Sync Quiz if provided in state
            if (newState.quizId && (!selectedQuiz || selectedQuiz.name !== newState.quizId)) {
                const found = quizzes.find(q => q.name === newState.quizId);
                if (found) {
                    setSelectedQuiz(found);
                    setRandomizedQuestions(shuffleArray(found.questions));
                }
            }
        });

        multiplayerService.onScoreUpdate((playerId, newScore) => {
            setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, score: newScore } : p));
        });

        // Initial state from service (avoids race condition)
        setPlayers(multiplayerService.getPlayers());
        const currentState = multiplayerService.getGameState();
        setGameState(currentState);

        // Handle init quiz from state if present
        if (currentState.quizId && !selectedQuiz) {
            const found = quizzes.find(q => q.name === currentState.quizId);
            if (found) {
                setSelectedQuiz(found);
                setRandomizedQuestions(shuffleArray(found.questions));
            }
        }

        // Back handler
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleLeave);
        return () => backHandler.remove();

    }, [quizzes, initialQuizId]);

    const handleStartGame = () => {
        if (!selectedQuiz) {
            Alert.alert('Select Quiz', 'Please select a quiz first');
            setIsQuizSelectorVisible(true);
            return;
        }
        multiplayerService.startGame(selectedQuiz.name);
    };

    const handleQuizSelection = (quiz: any) => {
        const fullQuiz = quizzes.find(q => q.name === quiz.name);
        if (fullQuiz) {
            setSelectedQuiz(fullQuiz);
            setRandomizedQuestions(shuffleArray(fullQuiz.questions));
            setIsQuizSelectorVisible(false);
        }
    };

    const handleAnswer = (answerText: string) => {
        const question = randomizedQuestions[currentQuestionIndex];
        const isCorrect = question.answer === answerText;

        if (isCorrect) {
            const newScore = score + 1;
            setScore(newScore);
            multiplayerService.updateScore(newScore);
        }

        // Auto-advance
        if (currentQuestionIndex < randomizedQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            Alert.alert('Finished!', `You scored ${score + (isCorrect ? 1 : 0)}`);
            // Could set status to finished here locally
        }
    };

    useEffect(() => {
        if (randomizedQuestions.length > 0 && randomizedQuestions[currentQuestionIndex]) {
            setRandomizedAnswers(shuffleArray(randomizedQuestions[currentQuestionIndex].answers));
        }
    }, [currentQuestionIndex, randomizedQuestions]);


    // RENDER: LOBBY
    if (gameState.status === 'waiting') {
        return (
            <View style={styles.outerContainer}>
                <SafeAreaLinearGradient
                    colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
                    style={styles.safeArea}
                >
                    <View style={styles.container}>
                        <TouchableOpacity
                            onPress={handleLeave}
                            style={{ position: 'absolute', left: 20, top: 20, zIndex: 10 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="arrow-back" size={30} color="white" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.lobby}>
                            <Text style={styles.title}>Room: {code}</Text>

                            <View style={styles.card}>
                                <Text style={styles.subtitle}>Players:</Text>
                                <View style={styles.playerList}>
                                    {players.map((p, i) => (
                                        <View key={i} style={styles.playerRow}>
                                            <Text style={styles.playerText}>{p.name} {p.isHost ? '👑' : ''}</Text>
                                            <Text style={styles.playerText}>{p.score} XP</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {isHost === 'true' && (
                                <View style={styles.card}>
                                    <Text style={styles.label}>Selected Quiz: {selectedQuiz?.name || 'None'}</Text>
                                    <TouchableOpacity
                                        onPress={() => setIsQuizSelectorVisible(true)}
                                        style={[styles.button, styles.secondaryBtn]}
                                    >
                                        <Text style={styles.buttonText}>📚 Select Quiz</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleStartGame}
                                        disabled={!selectedQuiz}
                                        style={[styles.button, styles.primaryBtn, !selectedQuiz && styles.disabledBtn]}
                                    >
                                        <Text style={styles.buttonText}>🎮 Start Game</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            {isHost !== 'true' && (
                                <View style={[styles.card, { alignItems: 'center', marginTop: 20 }]}>
                                    <ActivityIndicator size="large" color="#rgb(52, 211, 153)" />
                                    <Text style={{ color: 'white', marginTop: 15, fontSize: 16, fontWeight: '600' }}>Waiting for host...</Text>
                                    {selectedQuiz && <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>Quiz: {selectedQuiz.name}</Text>}
                                </View>
                            )}

                            {/* Quiz Selector Modal/Overlay for Host */}
                            {isQuizSelectorVisible && (
                                <View style={styles.selectorOverlay}>
                                    <SafeAreaView style={{ flex: 1 }}>
                                        <Text style={[styles.title, { marginBottom: 10, marginTop: 10 }]}>Select a Quiz</Text>
                                        <ScrollView>
                                            <QuizSelection
                                                quizzes={quizzes}
                                                handleQuizSelection={handleQuizSelection}
                                            />
                                        </ScrollView>
                                        <TouchableOpacity
                                            onPress={() => setIsQuizSelectorVisible(false)}
                                            style={[styles.button, styles.cancelBtn]}
                                        >
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </SafeAreaView>
                                </View>
                            )}

                        </View>
                    </View>
                </SafeAreaLinearGradient>
            </View>
        );
    }

    // RENDER: GAME
    return (
        <View style={styles.outerContainer}>
            <SafeAreaLinearGradient
                colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
                style={styles.safeArea}
            >
                <TouchableOpacity
                    onPress={handleLeave}
                    style={{ position: 'absolute', left: 20, top: 20, zIndex: 60 }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="arrow-back" size={30} color="white" />
                    </View>
                </TouchableOpacity>

                <View style={styles.gameContainer}>
                    <Question
                        question={randomizedQuestions[currentQuestionIndex]?.question || ''}
                        correctAnswer={randomizedQuestions[currentQuestionIndex]?.answer || ''}
                        answers={randomizedAnswers}
                        currentQuestionIndex={currentQuestionIndex}
                        selectedQuizAnswersAmount={randomizedQuestions.length}
                        handleAnswerSelection={handleAnswer}
                    />
                    {/* Minimal Leaderboard Overlay */}
                    <View style={styles.leaderboardTicker}>
                        <Text style={{ color: 'white' }}>Live Scores: {players.map(p => `${p.name}: ${p.score}`).join(' | ')}</Text>
                    </View>
                </View>
            </SafeAreaLinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'transparent',
        overflow: 'visible',
    },
    safeArea: {
        flex: 1,
        maxWidth: 550,
        width: '100%',
        borderLeftColor: 'rgb(129, 129, 129)',
        borderRightColor: 'rgb(141, 141, 141)',
        borderTopColor: 'rgb(26, 26, 26)',
        borderBottomColor: 'rgb(26, 26, 26)',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        overflow: 'visible',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    gameContainer: {
        flex: 1,
    },
    lobby: {
        flex: 1,
        justifyContent: 'center',
        width: '100%',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        color: 'white',
        fontSize: 30,
        textAlign: 'center',
        marginBottom: 30,
        fontWeight: '700',
    },
    subtitle: {
        color: 'white',
        fontSize: 20,
        marginBottom: 15,
        fontWeight: '700',
    },
    playerList: {
        width: '100%',
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    playerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    hostControls: {
        width: '100%',
        marginTop: 10,
    },
    label: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 14,
    },
    button: {
        backgroundColor: 'rgb(46, 150, 194)', // Vibrant Blue
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        marginHorizontal: 8,
        width: 'auto',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    primaryBtn: {
        backgroundColor: 'rgb(52, 211, 153)', // Green
    },
    secondaryBtn: {
        backgroundColor: 'rgb(46, 150, 194)', // Blue
    },
    cancelBtn: {
        backgroundColor: '#ef4444',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    selectorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1a1a1a',
        padding: 20,
        zIndex: 100,
    },
    leaderboardTicker: {
        position: 'absolute',
        top: 10,
        right: 20,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 12,
        alignItems: 'center',
        zIndex: 50,
    }
});
