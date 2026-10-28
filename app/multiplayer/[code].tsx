import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  multiplayerService,
  Player,
  GameState,
} from '../../services/MultiplayerService';
import { presenceService } from '../../services/PresenceService';
import { failureMessage } from '../../services/multiplayerFailures';
import {
  allFinished as allFinishedIn,
  applyJoin,
  cappedLinkName,
  isValidQuiz,
  normalizeAnswer,
  shouldPublishRoomCode,
  winnerOf,
} from '../../services/multiplayerRules';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuiz } from '../../components/Quizprovider';
import { Question } from '../../components/Question';
import { Answer, Quiz, QuizQuestion } from '../../components/types';
import { QuizSelection } from '../../components/QuizSelection';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';
import { MultiplayerScoreboard } from '@/components/MultiplayerScoreboard';

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const showAlert = (
  title: string,
  message: string,
  buttons?: { text: string; onPress?: () => void; style?: string }[],
) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const action = buttons.find((b) => b.style !== 'cancel');
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
  const {
    code,
    isHost: isHostParam,
    name: nameParam,
  } = useLocalSearchParams<{
    code: string;
    name: string;
    isHost: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { quizzes, multiplayerName, setMultiplayerName } = useQuiz();
  const isHost = isHostParam === 'true';
  // The name the link carried, capped once here so every use of it, the join
  // and the remembered name and the retry button, sees the same value.
  const linkName = cappedLinkName(nameParam);

  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    currentQuestionIndex: 0,
  });
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [randomizedQuestions, setRandomizedQuestions] = useState<
    QuizQuestion[]
  >([]);
  const [randomizedAnswers, setRandomizedAnswers] = useState<Answer[]>([]);
  const [myFinished, setMyFinished] = useState(false);

  // Results State
  const [, setResults] = useState<
    {
      playerId: string;
      name: string;
      score: number;
      finishTime: number;
      finished: boolean;
    }[]
  >([]);

  // Host-only state
  const [isQuizSelectorVisible, setIsQuizSelectorVisible] = useState(false);

  // Rejoin state: the host dropped mid-game and one tap tries the slot again
  const [hostGone, setHostGone] = useState(false);
  const [rejoinError, setRejoinError] = useState('');
  // Bumped after a join, because joinRoom destroys the old listeners
  const [sessionEpoch, setSessionEpoch] = useState(0);

  // Deep-link state: a room link without a name asks for one before joining
  const [needsName, setNeedsName] = useState(false);
  const [typedName, setTypedName] = useState('');
  // The remembered name arrives from the provider, so the prompt starts empty
  // and fills from an effect. Typing flips this, so the fill never overwrites
  // a name the player is entering here.
  const typedNameTouched = useRef(false);
  // The name this session actually joined with, so a rejoin carries it even
  // when the link had none
  const [joinedName, setJoinedName] = useState('');
  // A link joins once on mount, not on every render this effect re-runs on
  const joinedOnMount = useRef(false);

  const handleLeave = useCallback(() => {
    showAlert(t('multiplayer_leave_title'), t('multiplayer_leave_body'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('multiplayer_leave'),
        onPress: () => {
          multiplayerService.destroy();
          if (isHost) presenceService.setRoomCode(null);
          router.replace('/multiplayer');
        },
      },
    ]);
    return true;
  }, [router, isHost, t]);

  useEffect(() => {
    // The lobby is a shared list, so only the tab that really owns the room
    // publishes the code: a link carrying ?isHost=true must not put a room
    // this tab does not hold into it before the redirect undoes the claim.
    if (shouldPublishRoomCode(isHost, multiplayerService.getIsHost())) {
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

  // A refreshed host tab has no peer: the page load reset the module
  // singleton, so the lobby would render but nobody could ever join it (D8).
  useEffect(() => {
    if (isHost && !multiplayerService.getIsHost()) {
      router.replace('/multiplayer');
    }
  }, [isHost, router]);

  useEffect(() => {
    // Clear any stale listeners from previous renders
    multiplayerService.removeAllListeners();

    // Setup listeners
    multiplayerService.onPlayerJoin((player) => {
      setPlayers((prev) => applyJoin(prev, player));
    });

    multiplayerService.onGameStateChange((newState) => {
      setGameState(newState);
      // The quiz rides inside the state, so the joiner renders the host's
      // questions instead of looking a quiz name up in its own list (D7).
      const incoming = newState.quiz;
      if (incoming && newState.status === 'playing') {
        // The quiz comes off a data channel, so it is checked before it is
        // rendered: a question the view cannot draw would wedge this screen.
        if (!isValidQuiz(incoming)) {
          console.warn('Ignored a quiz payload that is not a quiz');
          return;
        }
        setSelectedQuiz({ name: incoming.name, questions: incoming.questions });
        setRandomizedQuestions(shuffleArray(incoming.questions));
        setCurrentQuestionIndex(0);
        setScore(0);
        setMyFinished(false);
        setResults([]);
      }
    });

    multiplayerService.onScoreUpdate((playerId, newScore) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, score: newScore } : p)),
      );
    });

    multiplayerService.onQuizSelect((quizId) => {
      const found = quizzes.find((q) => q.name === quizId);
      if (found) {
        setSelectedQuiz(found);
        setRandomizedQuestions(shuffleArray(found.questions));
      }
    });

    multiplayerService.onPlayerProgress(
      (playerId, progress, totalQuestions) => {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId ? { ...p, progress, totalQuestions } : p,
          ),
        );
      },
    );

    multiplayerService.onPlayerFinish((playerId, finalScore, finishTime) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, finished: true, score: finalScore, finishTime }
            : p,
        ),
      );
      setResults((prev) => {
        if (prev.find((r) => r.playerId === playerId)) return prev;
        return [
          ...prev,
          { playerId, name: '', score: finalScore, finishTime, finished: true },
        ];
      });
    });

    multiplayerService.onPlayerLeft((playerId) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, left: true } : p)),
      );
      if (
        playerId === 'host' &&
        multiplayerService.getGameState().status === 'playing'
      ) {
        setHostGone(true);
      }
    });

    // Initial state from service
    setPlayers(multiplayerService.getPlayers());
    const currentState = multiplayerService.getGameState();
    setGameState(currentState);

    const currentQuiz = currentState.quiz;
    if (currentQuiz && currentState.status === 'playing') {
      // The same check as the message path: this is the state a WELCOME left
      // behind, which is the other way a quiz reaches this screen.
      if (isValidQuiz(currentQuiz)) {
        setSelectedQuiz({
          name: currentQuiz.name,
          questions: currentQuiz.questions,
        });
        setRandomizedQuestions(shuffleArray(currentQuiz.questions));
      } else {
        console.warn('Ignored a quiz payload that is not a quiz');
      }
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleLeave,
    );
    return () => {
      backHandler.remove();
      multiplayerService.removeAllListeners();
    };
  }, [quizzes, handleLeave, sessionEpoch]);

  const handleEnterRoom = async (enteringName: string) => {
    setRejoinError('');
    const result = await multiplayerService.joinRoom(code, enteringName);
    if (result.ok) {
      // A rejoin has to resume from the entry the host kept, or the next
      // answer would overwrite the score it holds with a lower one (D18).
      const mine = result.players.find(
        (p) => p.id === multiplayerService.getPlayerId(),
      );
      if (mine) {
        setScore(mine.score);
        setCurrentQuestionIndex(mine.progress);
        setMyFinished(mine.finished);
      }
      setJoinedName(enteringName);
      setPlayers(result.players);
      setGameState(result.gameState);
      setHostGone(false);
      setNeedsName(false);
      // A successful join is a real game action, so this is the name to
      // remember. It covers the prompt, a link that carried a name, and a
      // rejoin, since all three come through here.
      setMultiplayerName(enteringName);
      setSessionEpoch((epoch) => epoch + 1);
    } else {
      setRejoinError(failureMessage(result.failure));
    }
  };

  // A room link is a session start, so it joins once on mount. The players
  // guard keeps the create-then-push and join-then-push flows from joining a
  // second time (D8).
  useEffect(() => {
    if (isHost || joinedOnMount.current) return;
    if (multiplayerService.getPlayers().length > 0) return;
    joinedOnMount.current = true;
    if (!linkName) {
      setNeedsName(true);
      return;
    }
    void handleEnterRoom(linkName);
  }, [isHost, linkName, handleEnterRoom]);

  // Pre-fill the name prompt the link asked for, from the name last played with
  useEffect(() => {
    if (!needsName || typedNameTouched.current) return;
    setTypedName((current) => (current === '' ? multiplayerName : current));
  }, [needsName, multiplayerName]);

  const handleStartGame = () => {
    if (!selectedQuiz) {
      showAlert(
        t('multiplayer_select_quiz_title'),
        t('multiplayer_select_quiz_first'),
      );
      setIsQuizSelectorVisible(true);
      return;
    }
    multiplayerService.startGame({
      name: selectedQuiz.name,
      questions: selectedQuiz.questions,
    });
  };

  const handleQuizSelection = (quiz: Quiz) => {
    const fullQuiz = quizzes.find((q) => q.name === quiz.name);
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
    // The same comparison the host scores with, so the feedback shown here and
    // the point the host records cannot disagree.
    const isCorrect =
      normalizeAnswer(question.answer) === normalizeAnswer(answerText);
    const newScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      setScore(newScore);
    }

    // The host is the scorer: this reports which option was picked, and the
    // host compares it against the quiz it holds. A score is never sent.
    multiplayerService.submitAnswer(currentQuestionIndex, answerText);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < randomizedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      multiplayerService.updateProgress(nextIndex, randomizedQuestions.length);
    } else {
      // Finished!
      setMyFinished(true);
      multiplayerService.updateProgress(
        randomizedQuestions.length,
        randomizedQuestions.length,
      );
      multiplayerService.finishGame();
    }
  };

  useEffect(() => {
    if (
      randomizedQuestions.length > 0 &&
      randomizedQuestions[currentQuestionIndex]
    ) {
      setRandomizedAnswers(
        shuffleArray(randomizedQuestions[currentQuestionIndex].answers),
      );
    }
  }, [currentQuestionIndex, randomizedQuestions]);

  // Check if all players finished
  const allFinished = allFinishedIn(players);

  // The duration keys carry the unit, so the format is per language. Defined
  // inside the component, never at module scope, so it follows the language.
  const durationLabel = (ms: number): string => {
    const total = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return minutes > 0
      ? t('multiplayer_time_min_sec', { minutes, seconds })
      : t('multiplayer_time_sec', { seconds });
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
    const winner = winnerOf(players);
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
              {allFinished ? '🏆 ' : '⏳ '}
              {allFinished
                ? t('multiplayer_game_over')
                : t('multiplayer_waiting_opponent')}
            </Text>

            {allFinished && winner && (
              <View style={styles.winnerCard}>
                <Text style={styles.winnerEmoji}>
                  {iAmWinner ? '🎉' : '💪'}
                </Text>
                <Text style={styles.winnerText}>
                  {iAmWinner
                    ? t('multiplayer_you_win')
                    : t('multiplayer_player_wins', { name: winner.name })}
                </Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.subtitle}>
                {t('multiplayer_final_scores')}
              </Text>
              {[...players]
                .filter((p) => !p.left)
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <View
                    key={p.id}
                    style={[styles.resultRow, i === 0 && styles.firstPlace]}
                  >
                    <View style={styles.resultLeft}>
                      <Text style={styles.rankText}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </Text>
                      <View>
                        <Text style={styles.resultName}>
                          {p.name} {p.isHost ? '👑' : ''}{' '}
                          {p.id === myId ? t('multiplayer_you_suffix') : ''}
                        </Text>
                        {p.finished ? (
                          <Text style={styles.resultTime}>
                            {t('multiplayer_finished_in', {
                              time: durationLabel(p.finishTime ?? 0),
                            })}
                          </Text>
                        ) : (
                          <Text style={styles.resultTime}>
                            {t('multiplayer_still_playing')}
                          </Text>
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

            <TouchableOpacity
              onPress={handlePlayAgain}
              style={[styles.button, styles.primaryBtn]}
            >
              <Text style={styles.buttonText}>
                {'🏠 '}
                {t('multiplayer_back_to_lobby')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaLinearGradient>
      </View>
    );
  }

  // RENDER: GAME (playing)
  if (
    gameState.status === 'playing' &&
    randomizedQuestions.length > 0 &&
    !myFinished
  ) {
    if (hostGone) {
      return (
        <View style={styles.outerContainer}>
          <SafeAreaLinearGradient
            colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
            style={styles.safeArea}
          >
            <View style={styles.gameContainer}>
              <View style={[styles.card, { marginTop: 80 }]}>
                <Text style={styles.subtitle}>
                  {t('multiplayer_host_dropped')}
                </Text>
                <TouchableOpacity
                  onPress={() => handleEnterRoom(joinedName)}
                  style={[styles.button, styles.primaryBtn]}
                >
                  <Text style={styles.buttonText}>
                    {t('multiplayer_rejoin')}
                  </Text>
                </TouchableOpacity>
                {rejoinError !== '' && (
                  <Text style={styles.rejoinError}>{rejoinError}</Text>
                )}
              </View>
            </View>
          </SafeAreaLinearGradient>
        </View>
      );
    }

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
            <MultiplayerScoreboard
              players={players}
              myId={multiplayerService.getPlayerId()}
              totalQuestions={randomizedQuestions.length}
            />

            <Question
              question={
                randomizedQuestions[currentQuestionIndex]?.question || ''
              }
              correctAnswer={
                randomizedQuestions[currentQuestionIndex]?.answer || ''
              }
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

  // RENDER: NAME (a room link that arrived without one)
  if (needsName) {
    return (
      <View style={styles.outerContainer}>
        <SafeAreaLinearGradient
          colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
          style={styles.safeArea}
        >
          <View style={styles.container}>
            <View style={styles.lobby}>
              <View style={styles.card}>
                <Text style={styles.subtitle}>
                  {t('multiplayer_enter_name_join')}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('multiplayer_enter_name')}
                  value={typedName}
                  onChangeText={(text) => {
                    typedNameTouched.current = true;
                    setTypedName(text);
                  }}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  returnKeyType="go"
                  onSubmitEditing={() => handleEnterRoom(typedName)}
                />
                <TouchableOpacity
                  onPress={() => handleEnterRoom(typedName)}
                  disabled={typedName.trim().length === 0}
                  style={[
                    styles.button,
                    styles.primaryBtn,
                    typedName.trim().length === 0 && styles.disabledBtn,
                  ]}
                >
                  <Text style={styles.buttonText}>{t('multiplayer_join')}</Text>
                </TouchableOpacity>
                {rejoinError !== '' && (
                  <>
                    <Text style={styles.rejoinError}>{rejoinError}</Text>
                    <TouchableOpacity
                      onPress={() => handleEnterRoom(typedName)}
                      style={[styles.button, styles.secondaryBtn]}
                    >
                      <Text style={styles.buttonText}>
                        {t('multiplayer_retry')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </SafeAreaLinearGradient>
      </View>
    );
  }

  // RENDER: LOBBY (waiting)
  // A departed player keeps its slot for a minute, so every start or full
  // decision counts only the players who are still here.
  const presentCount = players.filter((p) => !p.left).length;
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
            <Text style={styles.title}>{t('multiplayer_title')}</Text>

            <View style={styles.card}>
              <Text style={styles.subtitle}>{t('multiplayer_players')}</Text>
              <View style={styles.playerList}>
                {players.map((p, i) => (
                  <View key={i} style={styles.playerRow}>
                    <Text style={styles.playerText}>
                      {p.name} {p.isHost ? '👑' : ''}
                    </Text>
                    <Text
                      style={[
                        styles.readyText,
                        p.left ? styles.leftText : null,
                      ]}
                    >
                      {p.left
                        ? t('multiplayer_left')
                        : `✅ ${t('multiplayer_ready')}`}
                    </Text>
                  </View>
                ))}
                {presentCount < 2 && (
                  <View style={styles.playerRow}>
                    <Text style={[styles.playerText, { opacity: 0.4 }]}>
                      {t('multiplayer_waiting_opponent')}
                    </Text>
                    <ActivityIndicator
                      size="small"
                      color="rgba(255,255,255,0.4)"
                    />
                  </View>
                )}
              </View>
            </View>

            {isHost && (
              <View style={styles.card}>
                <Text style={styles.label}>
                  {t('multiplayer_selected_quiz')}{' '}
                  {selectedQuiz?.name || t('multiplayer_none_selected')}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsQuizSelectorVisible(true)}
                  style={[styles.button, styles.secondaryBtn]}
                >
                  <Text style={styles.buttonText}>
                    {'📚 '}
                    {t('multiplayer_select_quiz')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStartGame}
                  disabled={!selectedQuiz || presentCount < 2}
                  style={[
                    styles.button,
                    styles.primaryBtn,
                    (!selectedQuiz || presentCount < 2) && styles.disabledBtn,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {'🎮 '}
                    {t('multiplayer_start_game')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!isHost && (
              <View
                style={[styles.card, { alignItems: 'center', marginTop: 20 }]}
              >
                {rejoinError !== '' ? (
                  // A link that failed to join must say so, or the spinner
                  // leaves the joiner waiting on a room they never entered.
                  <>
                    <Text style={styles.rejoinError}>{rejoinError}</Text>
                    <TouchableOpacity
                      onPress={() => handleEnterRoom(linkName)}
                      disabled={linkName.length === 0}
                      style={[
                        styles.button,
                        styles.secondaryBtn,
                        linkName.length === 0 && styles.disabledBtn,
                      ]}
                    >
                      <Text style={styles.buttonText}>
                        {t('multiplayer_retry')}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <ActivityIndicator size="large" color="rgb(52, 211, 153)" />
                    <Text
                      style={{
                        color: 'white',
                        marginTop: 15,
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      {t('multiplayer_waiting_host')}
                    </Text>
                    {selectedQuiz && (
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.6)',
                          marginTop: 5,
                        }}
                      >
                        {t('multiplayer_quiz_label')} {selectedQuiz.name}
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Quiz Selector Overlay for Host */}
            {isQuizSelectorVisible && (
              <View style={styles.selectorOverlay}>
                <SafeAreaView style={{ flex: 1 }}>
                  <Text
                    style={[styles.title, { marginBottom: 10, marginTop: 10 }]}
                  >
                    {t('multiplayer_select_quiz_overlay')}
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
                    <Text style={styles.buttonText}>{t('cancel')}</Text>
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
  input: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
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
  rejoinError: {
    color: '#fca5a5',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  leftText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
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
