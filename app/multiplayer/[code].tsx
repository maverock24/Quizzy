import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, BackHandler, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { multiplayerService, Player, GameState } from '../../services/MultiplayerService';
import { presenceService } from '../../services/PresenceService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuiz } from '../../components/Quizprovider';
import { Question } from '../../components/Question';
import { Answer, QuizQuestion } from '../../components/types';
import { QuizSelection } from '../../components/QuizSelection';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';

const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
};

const showAlert = (title: string, message: string, buttons?: { text: string; onPress?: () => void; style?: string }[]) => {
    if (Platform.OS === 'web') {
        if (buttons && buttons.length > 1) {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                const action = buttons.find(b => b.style !== 'cancel');
                action?.onPress?.();
            }
        } else {
            window.alert(`${title}\n\n${message}`);
            buttons?.[0]?.onPress?.();
        }
    } else {
        const { Alert } = require('react-native');
        Alert.alert(title, message, buttons);
    }
};

export default function MultiplayerRoom() {
    const { code, name, isHost: isHostParam } = useLocalSearchParams<{ code: string; name: string; isHost: string }>();
    const router = useRouter();
    const { quizzes } = useQuiz();
    const isHost = isHostParam === 'true';

    const [players, setPlayers] = useState<Player[]>([]);
    const [gameState, setGameState] = useState<GameState>({ status: 'waiting', currentQuestionIndex: 0 });
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [randomizedQuestions, setRandomizedQuestions] = useState<QuizQuestion[]>([]);
    const [randomizedAnswers, setRandomizedAnswers] = useState<Answer[]>([]);
    const [myFinished, setMyFinished] = useState(false);

    // Results State
    const [results, setResults] = useState<{ playerId: string; name: string; score: number; finishTime: number; finished: boolean }[]>([]);

    // Host-only state
    const [isQuizSelectorVisible, setIsQuizSelectorVisible] = useState(false);

    const handleLeave = useCallback(() => {
        showAlert('Leave Game?', 'Are you sure you want to leave?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave', onPress: () => {
                    multiplayerService.destroy();
                    if (isHost) presenceService.setRoomCode(null);
                    router.replace('/multiplayer');
                }
            },
        ]);
        return true;
    }, [router, isHost]);

    useEffect(() => {
        if (isHost) {
            if (gameState.status === 'waiting') {
                presenceService.setRoomCode(code);
            } else if (gameState.status === 'playing') {
                presenceService.disconnect();
            }
        }

        return () => {
            if (isHost) {
                presenceService.setRoomCode(null);
            }
        };
    }, [isHost, gameState.status, code]);

    useEffect(() => {
        // Clear any stale listeners from previous renders
        multiplayerService.removeAllListeners();

        // Setup listeners
        multiplayerService.onPlayerJoin((player) => {
            setPlayers(prev => {
                if (prev.find(p => p.id === player.id)) return prev;
                return [...prev, player];
            });
        });

        multiplayerService.onGameStateChange((newState) => {
            setGameState(newState);
            if (newState.quizId && newState.status === 'playing') {
                const found = quizzes.find(q => q.name === newState.quizId);
                if (found) {
                    setSelectedQuiz(found);
                    setRandomizedQuestions(shuffleArray(found.questions));
                    setCurrentQuestionIndex(0);
                    setScore(0);
                    setMyFinished(false);
                    setResults([]);
                }
            }
        });

        multiplayerService.onScoreUpdate((playerId, newScore) => {
            setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, score: newScore } : p));
        });

        multiplayerService.onQuizSelect((quizId) => {
            const found = quizzes.find(q => q.name === quizId);
            if (found) {
                setSelectedQuiz(found);
                setRandomizedQuestions(shuffleArray(found.questions));
            }
        });

        multiplayerService.onPlayerProgress((playerId, progress, totalQuestions) => {
            setPlayers(prev => prev.map(p =>
                p.id === playerId ? { ...p, progress, totalQuestions } : p
            ));
        });

        multiplayerService.onPlayerFinish((playerId, finalScore, finishTime) => {
            setPlayers(prev => prev.map(p =>
                p.id === playerId ? { ...p, finished: true, score: finalScore, finishTime } : p
            ));
            setResults(prev => {
                if (prev.find(r => r.playerId === playerId)) return prev;
                return [...prev, { playerId, name: '', score: finalScore, finishTime, finished: true }];
            });
        });

        multiplayerService.onPlayerLeft((playerId) => {
            setPlayers(prev => prev.map(p =>
                p.id === playerId ? { ...p, name: p.name + ' (left)' } : p
            ));
        });

        // Initial state from service
        setPlayers(multiplayerService.getPlayers());
        const currentState = multiplayerService.getGameState();
        setGameState(currentState);

        if (currentState.quizId) {
            const found = quizzes.find(q => q.name === currentState.quizId);
            if (found) {
                setSelectedQuiz(found);
                setRandomizedQuestions(shuffleArray(found.questions));
            }
        }

        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleLeave);
        return () => {
            backHandler.remove();
            multiplayerService.removeAllListeners();
        };
    }, [quizzes, handleLeave]);

    const handleStartGame = () => {
        if (!selectedQuiz) {
            showAlert('Select Quiz', 'Please select a quiz first');
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
            multiplayerService.selectQuiz(fullQuiz.name);
        }
    };

    const handleAnswer = (answerText: string) => {
        if (myFinished) return;

        const question = randomizedQuestions[currentQuestionIndex];
        const isCorrect = question.answer === answerText;
        const newScore = isCorrect ? score + 1 : score;

        if (isCorrect) {
            setScore(newScore);
            multiplayerService.updateScore(newScore);
        }

        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex < randomizedQuestions.length) {
            setCurrentQuestionIndex(nextIndex);
            multiplayerService.updateProgress(nextIndex, randomizedQuestions.length);
        } else {
            // Finished!
            setMyFinished(true);
            multiplayerService.updateProgress(randomizedQuestions.length, randomizedQuestions.length);
            multiplayerService.finishGame(newScore);
        }
    };

    useEffect(() => {
        if (randomizedQuestions.length > 0 && randomizedQuestions[currentQuestionIndex]) {
            setRandomizedAnswers(shuffleArray(randomizedQuestions[currentQuestionIndex].answers));
        }
    }, [currentQuestionIndex, randomizedQuestions]);

    // Check if all players finished
    const allFinished = players.length > 1 && players.every(p => p.finished || p.name.includes('(left)'));

    // Determine winner
    const getWinner = () => {
        const activePlayers = players.filter(p => p.finished && !p.name.includes('(left)'));
        if (activePlayers.length === 0) return null;
        // Sort by score DESC, then by finish time ASC
        const sorted = [...activePlayers].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (a.finishTime || Infinity) - (b.finishTime || Infinity);
        });
        return sorted[0];
    };

    const handlePlayAgain = () => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setMyFinished(false);
        setResults([]);
        setSelectedQuiz(null);
        setRandomizedQuestions([]);
        // Reset game state to waiting if host
        if (isHost) {
            multiplayerService.startGame(undefined); // Will set status but we need 'waiting'
        }
        // Navigate back to lobby
        multiplayerService.destroy();
        router.replace('/multiplayer');
    };

    // RENDER: RESULTS
    if ((allFinished || myFinished) && gameState.status === 'playing') {
        const winner = getWinner();
        const myId = multiplayerService.getPlayerId();
        const iAmWinner = winner?.id === myId;

        return (
            <View style={styles.outerContainer}>
                <SafeAreaLinearGradient
                    colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
                    style={styles.safeArea}
                >
                    <ScrollView contentContainerStyle={styles.resultsContainer}>
                        <Text style={styles.resultsTitle}>
                            {allFinished ? '🏆 Game Over!' : '⏳ Waiting for opponent...'}
                        </Text>

                        {allFinished && winner && (
                            <View style={styles.winnerCard}>
                                <Text style={styles.winnerEmoji}>{iAmWinner ? '🎉' : '💪'}</Text>
                                <Text style={styles.winnerText}>
                                    {iAmWinner ? 'You Win!' : `${winner.name} Wins!`}
                                </Text>
                            </View>
                        )}

                        <View style={styles.card}>
                            <Text style={styles.subtitle}>Final Scores</Text>
                            {[...players]
                                .filter(p => !p.name.includes('(left)'))
                                .sort((a, b) => b.score - a.score)
                                .map((p, i) => (
                                    <View key={p.id} style={[styles.resultRow, i === 0 && styles.firstPlace]}>
                                        <View style={styles.resultLeft}>
                                            <Text style={styles.rankText}>
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                                            </Text>
                                            <View>
                                                <Text style={styles.resultName}>
                                                    {p.name} {p.isHost ? '👑' : ''} {p.id === myId ? '(You)' : ''}
                                                </Text>
                                                {p.finishTime ? (
                                                    <Text style={styles.resultTime}>
                                                        Finished in {formatTime(p.finishTime)}
                                                    </Text>
                                                ) : (
                                                    <Text style={styles.resultTime}>Still playing...</Text>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.resultRight}>
                                            <Text style={styles.resultScore}>{p.score}</Text>
                                            <Text style={styles.resultScoreLabel}>
                                                / {randomizedQuestions.length}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                        </View>

                        <TouchableOpacity onPress={handlePlayAgain} style={[styles.button, styles.primaryBtn]}>
                            <Text style={styles.buttonText}>🏠 Back to Lobby</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaLinearGradient>
            </View>
        );
    }

    // RENDER: GAME (playing)
    if (gameState.status === 'playing' && randomizedQuestions.length > 0 && !myFinished) {
        const opponent = players.find(p => p.id !== multiplayerService.getPlayerId());

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
                        {/* Opponent Progress Bar */}
                        {opponent && (
                            <View style={styles.opponentTracker}>
                                <View style={styles.opponentInfo}>
                                    <Text style={styles.opponentName}>⚔️ {opponent.name}</Text>
                                    <Text style={styles.opponentScore}>
                                        {opponent.score} correct • Q{Math.min(opponent.progress + 1, opponent.totalQuestions || randomizedQuestions.length)}/{opponent.totalQuestions || randomizedQuestions.length}
                                    </Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${((opponent.progress) / (opponent.totalQuestions || randomizedQuestions.length)) * 100}%`
                                        }
                                    ]} />
                                </View>
                            </View>
                        )}

                        <Question
                            question={randomizedQuestions[currentQuestionIndex]?.question || ''}
                            correctAnswer={randomizedQuestions[currentQuestionIndex]?.answer || ''}
                            answers={randomizedAnswers}
                            currentQuestionIndex={currentQuestionIndex}
                            selectedQuizAnswersAmount={randomizedQuestions.length}
                            handleAnswerSelection={handleAnswer}
                        />
                    </View>
                </SafeAreaLinearGradient>
            </View>
        );
    }

    // RENDER: LOBBY (waiting)
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
                                        <Text style={styles.readyText}>✅ Ready</Text>
                                    </View>
                                ))}
                                {players.length < 2 && (
                                    <View style={styles.playerRow}>
                                        <Text style={[styles.playerText, { opacity: 0.4 }]}>Waiting for opponent...</Text>
                                        <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
                                    </View>
                                )}
                            </View>
                        </View>

                        {isHost && (
                            <View style={styles.card}>
                                <Text style={styles.label}>
                                    Selected Quiz: {selectedQuiz?.name || 'None selected'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setIsQuizSelectorVisible(true)}
                                    style={[styles.button, styles.secondaryBtn]}
                                >
                                    <Text style={styles.buttonText}>📚 Select Quiz</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleStartGame}
                                    disabled={!selectedQuiz || players.length < 2}
                                    style={[
                                        styles.button,
                                        styles.primaryBtn,
                                        (!selectedQuiz || players.length < 2) && styles.disabledBtn,
                                    ]}
                                >
                                    <Text style={styles.buttonText}>🎮 Start Game</Text>
                                </TouchableOpacity>

                                {players.length < 2 && (
                                    <Text style={styles.hintText}>
                                        Share code "{code}" with your opponent to join
                                    </Text>
                                )}
                            </View>
                        )}

                        {!isHost && (
                            <View style={[styles.card, { alignItems: 'center', marginTop: 20 }]}>
                                <ActivityIndicator size="large" color="rgb(52, 211, 153)" />
                                <Text style={{ color: 'white', marginTop: 15, fontSize: 16, fontWeight: '600' }}>
                                    Waiting for host to start...
                                </Text>
                                {selectedQuiz && (
                                    <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 5 }}>
                                        Quiz: {selectedQuiz.name}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Quiz Selector Overlay for Host */}
                        {isQuizSelectorVisible && (
                            <View style={styles.selectorOverlay}>
                                <SafeAreaView style={{ flex: 1 }}>
                                    <Text style={[styles.title, { marginBottom: 10, marginTop: 10 }]}>
                                        Select a Quiz
                                    </Text>
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
        shadowOffset: { width: 0, height: 10 },
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
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    playerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    readyText: {
        color: 'rgb(52, 211, 153)',
        fontSize: 14,
        fontWeight: '600',
    },
    label: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 14,
    },
    hintText: {
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        marginTop: 12,
        fontSize: 13,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: 'rgb(46, 150, 194)',
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
        backgroundColor: 'rgb(52, 211, 153)',
    },
    secondaryBtn: {
        backgroundColor: 'rgb(46, 150, 194)',
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
    // Opponent tracker
    opponentTracker: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginTop: 50,
        marginBottom: 8,
    },
    opponentInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    opponentName: {
        color: '#fca5a5',
        fontSize: 14,
        fontWeight: '700',
    },
    opponentScore: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ef4444',
        borderRadius: 2,
    },
    // Results screen
    resultsContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    resultsTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 24,
    },
    winnerCard: {
        backgroundColor: 'rgba(52, 211, 153, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.4)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        marginHorizontal: 8,
    },
    winnerEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    winnerText: {
        color: 'rgb(52, 211, 153)',
        fontSize: 24,
        fontWeight: '800',
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    firstPlace: {
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginHorizontal: -10,
    },
    resultLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    rankText: {
        fontSize: 24,
    },
    resultName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    resultTime: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        marginTop: 2,
    },
    resultRight: {
        alignItems: 'flex-end',
    },
    resultScore: {
        color: 'rgb(52, 211, 153)',
        fontSize: 28,
        fontWeight: '800',
    },
    resultScoreLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
    },
});
