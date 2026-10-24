// Correção determinística: compara as respostas com o gabarito definido em data/courses.js.
// Formato das respostas: mc -> índice; vf -> boolean; assoc -> array de índices de definição, um por par.

export const PASS_PERCENT = 70;

export function gradeQuiz(quiz, answers) {
  const details = quiz.questions.map((question, i) => {
    const given = answers[i];
    let correct = false;

    if (question.type === 'mc') {
      correct = given === question.answer;
    } else if (question.type === 'vf') {
      correct = given === question.answer;
    } else if (question.type === 'assoc') {
      correct =
        Array.isArray(given) &&
        given.length === question.pairs.length &&
        question.pairs.every((_, pairIndex) => given[pairIndex] === pairIndex);
    }

    return { question, correct, answered: given !== undefined && given !== null };
  });

  const total = quiz.questions.length;
  const score = details.filter((d) => d.correct).length;
  const percent = total ? Math.round((score / total) * 100) : 0;

  return { score, total, percent, passed: percent >= PASS_PERCENT, details };
}

// Definições exibidas em associação, em ordem rotacionada (o gabarito não fica alinhado com os conceitos).
// Cada item guarda o índice original, que é o que a correção compara.
export function assocOptions(question) {
  const n = question.pairs.length;
  return Array.from({ length: n }, (_, i) => {
    const index = (i + 1) % n;
    return { text: question.pairs[index][1], index };
  });
}
