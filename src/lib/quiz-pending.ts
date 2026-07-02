export interface PendingQuizAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface PendingQuiz {
  answers: PendingQuizAnswer[];
  savedAt: number;
}

function storageKey(moduleId: string) {
  return `trainhub-quiz-pending:${moduleId}`;
}

export function savePendingQuiz(
  moduleId: string,
  answers: PendingQuizAnswer[],
) {
  if (typeof window === "undefined") return;
  const payload: PendingQuiz = { answers, savedAt: Date.now() };
  sessionStorage.setItem(storageKey(moduleId), JSON.stringify(payload));
}

export function loadPendingQuiz(moduleId: string): PendingQuiz | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(storageKey(moduleId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingQuiz;
  } catch {
    return null;
  }
}

export function clearPendingQuiz(moduleId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(moduleId));
}

export function pendingToAnswerMap(pending: PendingQuiz) {
  const answers: Record<string, number> = {};
  for (const answer of pending.answers) {
    if (answer.selectedIndex >= 0) {
      answers[answer.questionId] = answer.selectedIndex;
    }
  }
  return answers;
}
