import {useQuiz} from '@/components/Quizprovider';
import {Button, ButtonText} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Heading} from '@/components/ui/heading';
import {Text} from '@/components/ui/text';
import {VStack} from '@/components/ui/vstack';
import {useState} from 'react';
import {FlatList, StyleSheet} from 'react-native';

const quizzes = require('../../assets/quizzes.json');

type Quiz = {
  name: string;
  questions: Question[];
};

type Answer = {
  answer: string;
};

type Question = {
  question: string;
  answers: Answer[];
  answer: string;
  explanation: string;
};

export default function TabOneScreen() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz>();
  const [selectedQuizAnswersAmount, setSelectedQuizAnswersAmount] = useState<
    number
  >(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [scoreVisible, setScoreVisible] = useState<boolean>(false);

  const {selectedQuizName, setSelectedQuizName} = useQuiz();
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const [anserIsCorrect, setAnswerIsCorrect] = useState<boolean>(false);

  const handleQuizSelection = (quiz: any) => {
    const selectedQuiz = quizzes.find((q: Quiz) => q.name === quiz.name);
    console.log(selectedQuiz);
    setSelectedQuiz(selectedQuiz);
    setSelectedQuizAnswersAmount(selectedQuiz?.questions.length!);
    setScore(0);
    setScoreVisible(false);
    setSelectedQuizName(quiz.name);
  };

  const handleAnswerSelection = (answer: string) => {
    if (selectedQuiz) {
      const question = selectedQuiz.questions[currentQuestionIndex];
      if (question.answer === answer) {
        setAnswerIsCorrect(true);
        setScore(score + 1);
      } else {
        console.log('Incorrect');
      }
      setShowExplanation(true);
    }
    if (currentQuestionIndex < selectedQuiz?.questions.length! - 1) {
      //setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      console.log('Quiz finished');
      setShowExplanation(false);
      setSelectedQuiz(undefined);
      setSelectedQuizName(null);
      setCurrentQuestionIndex(0);
      setScoreVisible(true);
    }
  };

  const handleBack = () => {
    setSelectedQuiz(undefined);
    setSelectedQuizName(null);
    setCurrentQuestionIndex(0);
    setScoreVisible(false);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  return (
    <VStack>
      {!selectedQuiz && (
        <FlatList
          data={quizzes}
          renderItem={({item}) => (
            <Button
              className='m-2 p-2 min-w-full bg-blue-500'
              size='lg'
              variant='solid'
              action='primary'
              key={item.name}
              onPress={() => handleQuizSelection(item)}
            >
              <ButtonText
                adjustsFontSizeToFit={true}
                minimumFontScale={0.2}
                ellipsizeMode='clip'
                numberOfLines={1}
              >
                {item.name}
              </ButtonText>
            </Button>
          )}
        />
      )}

      {showExplanation && (
        <VStack>
          <Card size='md' variant='filled' className='m-3'>
            <Heading size='md' className='mb-1'>
              Your anser is {anserIsCorrect ? 'correct' : 'incorrect'}
            </Heading>
            <Text size='sm'>
              {anserIsCorrect
                ? selectedQuiz?.questions[currentQuestionIndex].explanation
                : "Try again next time. Don't give up"}
            </Text>
          </Card>
          <Button
            className='m-2 p-2 bg-blue-800 min-w-full'
            size='lg'
            variant='solid'
            action='primary'
            onPress={() => handleNext()}
          >
            <ButtonText
              adjustsFontSizeToFit
              minimumFontScale={0.5}
              numberOfLines={1}
            >
              Next
            </ButtonText>
          </Button>
        </VStack>
      )}

      {selectedQuiz && !showExplanation && (
        <VStack space='lg' className='p-3 m-3'>
          <Card
            size='md'
            variant='filled'
            className='min-w-full m-3 bg-stone-800 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5'
          >
            <Heading size='md' className='mb-1 text-white'>
              Question {currentQuestionIndex + 1}
            </Heading>
            <Text size='sm' className='text-white'>
              {selectedQuiz.questions[currentQuestionIndex].question}
            </Text>
          </Card>
          {selectedQuiz.questions[currentQuestionIndex].answers.map(
            (answer, index) => (
              console.log(answer.answer),
              (
                <Button
                  className='m-2 p-2 min-w-full'
                  size='lg'
                  variant='outline'
                  action='primary'
                  key={index}
                  onPress={() => {
                    handleAnswerSelection(answer.answer);
                  }}
                >
                  <ButtonText
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    numberOfLines={1}
                  >
                    {answer.answer}
                  </ButtonText>
                </Button>
              )
            )
          )}
        </VStack>
      )}
      {scoreVisible && (
        <Text>
          Score: {score} / {selectedQuizAnswersAmount}
        </Text>
      )}
      {selectedQuiz && (
        <Button
          className='m-2'
          size='lg'
          variant='solid'
          action='secondary'
          onPress={() => handleBack()}
        >
          <ButtonText
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
            numberOfLines={1}
          >
            Back
          </ButtonText>
        </Button>
      )}
    </VStack>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    alignItems: 'center',
  },
  answerButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 5,
    minWidth: '80%',
    margin: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  button: {
    backgroundColor: 'blue',
    padding: 20,
    borderRadius: 5,
    width: '80%',
    margin: 10,
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'blue',
    borderRadius: 50,
    padding: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
