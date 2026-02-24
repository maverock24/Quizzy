export const SOUNDS: { [key: string]: any } = {
    correct_answer: require('../assets/sounds/correct_answer.mp3'),
    wrong_answer: require('../assets/sounds/wrong_answer.mp3'),
    answer_selected: require('../assets/sounds/answer_selected.mp3'),
    answer_selected1: require('../assets/sounds/answer_selected1.mp3'),
    answer_selected2: require('../assets/sounds/answer_selected2.mp3'),
    quiz_success: require('../assets/sounds/quiz_success.mp3'),
    quiz_fail: require('../assets/sounds/quiz_fail.mp3'),
};

export const SOUND_LABELS: { [key: string]: string } = {
    correct_answer: 'Correct Answer (Default)',
    wrong_answer: 'Wrong Answer (Default)',
    answer_selected: 'Selected 1 (Default)',
    answer_selected1: 'Selected 2',
    answer_selected2: 'Selected 3',
    quiz_success: 'Success Fanfare',
    quiz_fail: 'Fail Horn',
};
