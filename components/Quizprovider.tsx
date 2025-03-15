import React, {createContext, ReactNode, useContext, useState} from 'react';

type QuizContextType = {
  selectedQuizName: string | null;
  setSelectedQuizName: (name: string | null) => void;
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [selectedQuizName, setSelectedQuizName] = useState<string | null>(null);

  return (
    <QuizContext.Provider value={{selectedQuizName, setSelectedQuizName}}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
