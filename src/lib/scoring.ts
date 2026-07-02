import type { GradedQuestion, QuizAnswer } from "./types";

export interface QuestionForGrading {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function gradeQuiz(
  questions: QuestionForGrading[],
  answers: QuizAnswer[],
): { score: number; total: number; percentage: number; gradedQuestions: GradedQuestion[] } {
  const answerMap = new Map(
    answers.map((a) => [a.questionId, a.selectedIndex]),
  );

  const gradedQuestions: GradedQuestion[] = questions.map((q) => {
    const raw = answerMap.get(q.id);
    const selectedIndex =
      raw === undefined || raw === null || raw < 0 ? null : raw;
    const isCorrect = selectedIndex === q.correctIndex;
    return {
      questionId: q.id,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex,
      explanation: q.explanation,
      isCorrect,
    };
  });

  const score = gradedQuestions.filter((q) => q.isCorrect).length;
  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return { score, total, percentage, gradedQuestions };
}

export function computePassed(percentage: number, passThreshold: number) {
  return percentage >= passThreshold;
}
