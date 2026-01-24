/**
 * LearningTodos Component
 * Shows questions the user got wrong and needs to review
 * Questions are removed after being answered correctly 3 times
 */
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLearningTodos, LearningTodoItem } from './LearningTodosProvider';

interface LearningTodosProps {
    onPractice?: (todoItems: LearningTodoItem[]) => void;
}

export const LearningTodos: React.FC<LearningTodosProps> = ({ onPractice }) => {
    const { t } = useTranslation();
    const { todos, clearTodo } = useLearningTodos();
    const [selectedTodo, setSelectedTodo] = useState<LearningTodoItem | null>(null);
    const [showExplanationModal, setShowExplanationModal] = useState(false);

    // Group todos by quiz name
    const todosByQuiz = todos.reduce((acc, todo) => {
        const quizName = todo.quizName || t('unknown_quiz', 'Unknown Quiz');
        if (!acc[quizName]) {
            acc[quizName] = [];
        }
        acc[quizName].push(todo);
        return acc;
    }, {} as Record<string, LearningTodoItem[]>);

    const handleViewExplanation = (todo: LearningTodoItem) => {
        setSelectedTodo(todo);
        setShowExplanationModal(true);
    };

    const handlePracticeAll = () => {
        if (onPractice && todos.length > 0) {
            onPractice(todos);
        }
    };

    if (todos.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎉</Text>
                <Text style={styles.emptyTitle}>{t('no_todos', 'All caught up!')}</Text>
                <Text style={styles.emptyText}>
                    {t('no_todos_desc', 'Questions you get wrong will appear here for review.')}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>{t('learning_todos', 'Learning To-Do\'s')}</Text>
                    <Text style={styles.subtitle}>
                        {todos.length} {todos.length === 1 ? t('question_to_review', 'question to review') : t('questions_to_review', 'questions to review')}
                    </Text>
                </View>
                {onPractice && (
                    <TouchableOpacity style={styles.practiceButton} onPress={handlePracticeAll}>
                        <Text style={styles.practiceButtonText}>{t('practice_all', 'Practice All')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Todo List */}
            <ScrollView style={styles.todoList} showsVerticalScrollIndicator={false}>
                {Object.entries(todosByQuiz).map(([quizName, quizTodos]) => (
                    <View key={quizName} style={styles.quizSection}>
                        <Text style={styles.quizName}>{quizName}</Text>
                        {quizTodos.map((todo) => (
                            <TouchableOpacity
                                key={todo.id}
                                style={styles.todoItem}
                                onPress={() => handleViewExplanation(todo)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.todoContent}>
                                    <Text style={styles.todoQuestion} numberOfLines={2}>
                                        {todo.question}
                                    </Text>
                                    <View style={styles.todoMeta}>
                                        <Text style={styles.progressText}>
                                            {todo.correctCount}/3 {t('correct', 'correct')}
                                        </Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { width: `${(todo.correctCount / 3) * 100}%` }
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.todoArrow}>→</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </ScrollView>

            {/* Explanation Modal */}
            <Modal
                visible={showExplanationModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExplanationModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedTodo && (
                            <>
                                <Text style={styles.modalTitle}>{t('question', 'Question')}</Text>
                                <Text style={styles.modalQuestion}>{selectedTodo.question}</Text>

                                <View style={styles.answerSection}>
                                    <Text style={styles.wrongAnswerLabel}>{t('your_answer', 'Your answer:')}</Text>
                                    <Text style={styles.wrongAnswer}>{selectedTodo.userAnswer}</Text>

                                    <Text style={styles.correctAnswerLabel}>{t('correct_answer', 'Correct answer:')}</Text>
                                    <Text style={styles.correctAnswer}>{selectedTodo.correctAnswer}</Text>
                                </View>

                                {selectedTodo.explanation && (
                                    <View style={styles.explanationSection}>
                                        <Text style={styles.explanationLabel}>{t('explanation', 'Explanation')}</Text>
                                        <ScrollView style={styles.explanationScroll}>
                                            <Text style={styles.explanationText}>{selectedTodo.explanation}</Text>
                                        </ScrollView>
                                    </View>
                                )}

                                <View style={styles.modalProgress}>
                                    <Text style={styles.modalProgressText}>
                                        {t('progress_info', 'Answer correctly {{remaining}} more times to master this question', { remaining: 3 - selectedTodo.correctCount })}
                                    </Text>
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowExplanationModal(false)}
                        >
                            <Text style={styles.closeButtonText}>{t('close', 'Close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 4,
    },
    practiceButton: {
        backgroundColor: '#4ECDC4',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    practiceButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    todoList: {
        flex: 1,
    },
    quizSection: {
        marginBottom: 20,
    },
    quizName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4ECDC4',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    todoItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    todoContent: {
        flex: 1,
    },
    todoQuestion: {
        fontSize: 15,
        color: 'white',
        marginBottom: 10,
        lineHeight: 22,
    },
    todoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        marginRight: 10,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4ECDC4',
        borderRadius: 2,
    },
    todoArrow: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.4)',
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'rgb(29, 40, 54)',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    modalQuestion: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
        marginBottom: 20,
        lineHeight: 26,
    },
    answerSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    wrongAnswerLabel: {
        fontSize: 12,
        color: '#FF6B6B',
        marginBottom: 4,
    },
    wrongAnswer: {
        fontSize: 15,
        color: '#FF6B6B',
        marginBottom: 12,
    },
    correctAnswerLabel: {
        fontSize: 12,
        color: '#4ECDC4',
        marginBottom: 4,
    },
    correctAnswer: {
        fontSize: 15,
        color: '#4ECDC4',
        fontWeight: '500',
    },
    explanationSection: {
        marginBottom: 16,
    },
    explanationLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    explanationScroll: {
        maxHeight: 150,
    },
    explanationText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        lineHeight: 22,
    },
    modalProgress: {
        backgroundColor: 'rgba(78, 205, 196, 0.15)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    modalProgressText: {
        fontSize: 13,
        color: '#4ECDC4',
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default LearningTodos;
