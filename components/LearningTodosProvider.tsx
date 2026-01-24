/**
 * LearningTodosProvider
 * Manages the learning to-do list - questions user got wrong
 * Questions are removed after 3 correct answers
 * Data is persisted to AsyncStorage for offline use
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

const STORAGE_KEY = 'quizzy_learning_todos';

export interface LearningTodoItem {
    id: string;                // Unique ID for this todo
    question: string;          // The question text
    correctAnswer: string;     // The correct answer
    userAnswer: string;        // What the user answered (wrong)
    explanation?: string;      // Explanation if available
    quizName: string;          // Which quiz this came from
    correctCount: number;      // How many times answered correctly (needs 3)
    addedAt: string;           // ISO date when added
    lastReviewedAt?: string;   // ISO date when last reviewed
}

interface LearningTodosContextType {
    todos: LearningTodoItem[];
    addWrongAnswer: (
        question: string,
        correctAnswer: string,
        userAnswer: string,
        quizName: string,
        explanation?: string
    ) => void;
    recordCorrectAnswer: (questionId: string) => void;
    clearTodo: (todoId: string) => void;
    clearAllTodos: () => void;
    getTodoByQuestion: (question: string) => LearningTodoItem | undefined;
    isLoaded: boolean;
}

const LearningTodosContext = createContext<LearningTodosContextType | undefined>(undefined);

// Generate a unique ID for a question (based on question text hash)
const generateQuestionId = (question: string, quizName: string): string => {
    let hash = 0;
    const str = `${quizName}:${question}`;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `todo_${Math.abs(hash).toString(36)}`;
};

export const LearningTodosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [todos, setTodos] = useState<LearningTodoItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load todos from storage on mount
    useEffect(() => {
        loadTodos();
    }, []);

    // Save todos whenever they change
    useEffect(() => {
        if (isLoaded) {
            saveTodos();
        }
    }, [todos, isLoaded]);

    const loadTodos = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as LearningTodoItem[];
                setTodos(parsed);
            }
        } catch (error) {
            console.error('Failed to load learning todos:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const saveTodos = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        } catch (error) {
            console.error('Failed to save learning todos:', error);
        }
    };

    // Add a wrong answer to the todo list
    const addWrongAnswer = useCallback((
        question: string,
        correctAnswer: string,
        userAnswer: string,
        quizName: string,
        explanation?: string
    ) => {
        const id = generateQuestionId(question, quizName);

        setTodos(prev => {
            // Check if this question already exists
            const existingIndex = prev.findIndex(t => t.id === id);

            if (existingIndex >= 0) {
                // Question already in list - reset correctCount since user got it wrong again
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    userAnswer,
                    correctCount: 0, // Reset progress
                    lastReviewedAt: new Date().toISOString(),
                };
                return updated;
            }

            // Add new todo
            const newTodo: LearningTodoItem = {
                id,
                question,
                correctAnswer,
                userAnswer,
                explanation,
                quizName,
                correctCount: 0,
                addedAt: new Date().toISOString(),
            };

            return [...prev, newTodo];
        });
    }, []);

    // Record when user answers a todo question correctly
    const recordCorrectAnswer = useCallback((questionId: string) => {
        setTodos(prev => {
            const updated = prev.map(todo => {
                if (todo.id === questionId) {
                    const newCorrectCount = todo.correctCount + 1;

                    // If reached 3 correct answers, this will be filtered out below
                    return {
                        ...todo,
                        correctCount: newCorrectCount,
                        lastReviewedAt: new Date().toISOString(),
                    };
                }
                return todo;
            });

            // Filter out mastered questions (3+ correct answers)
            return updated.filter(todo => todo.correctCount < 3);
        });
    }, []);

    // Find a todo by question text
    const getTodoByQuestion = useCallback((question: string): LearningTodoItem | undefined => {
        return todos.find(t => t.question === question);
    }, [todos]);

    // Clear a specific todo
    const clearTodo = useCallback((todoId: string) => {
        setTodos(prev => prev.filter(t => t.id !== todoId));
    }, []);

    // Clear all todos
    const clearAllTodos = useCallback(() => {
        setTodos([]);
    }, []);

    return (
        <LearningTodosContext.Provider
            value={{
                todos,
                addWrongAnswer,
                recordCorrectAnswer,
                clearTodo,
                clearAllTodos,
                getTodoByQuestion,
                isLoaded,
            }}
        >
            {children}
        </LearningTodosContext.Provider>
    );
};

export const useLearningTodos = (): LearningTodosContextType => {
    const context = useContext(LearningTodosContext);
    if (!context) {
        throw new Error('useLearningTodos must be used within a LearningTodosProvider');
    }
    return context;
};
