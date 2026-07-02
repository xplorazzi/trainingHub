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

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function savePendingQuiz(
  moduleId: string,
  answers: PendingQuizAnswer[],
) {
  const storage = readStorage();
  if (!storage) return;
  const payload: PendingQuiz = { answers, savedAt: Date.now() };
  storage.setItem(storageKey(moduleId), JSON.stringify(payload));
}

export function loadPendingQuiz(moduleId: string): PendingQuiz | null {
  const storage = readStorage();
  if (!storage) return null;
  const raw = storage.getItem(storageKey(moduleId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingQuiz;
  } catch {
    return null;
  }
}

export function clearPendingQuiz(moduleId: string) {
  const storage = readStorage();
  if (!storage) return;
  storage.removeItem(storageKey(moduleId));
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
