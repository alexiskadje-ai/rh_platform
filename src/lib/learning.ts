export type CourseModule = {
  id: string;
  title: string;
  videoUrl: string;
};

export type QuizQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
};

export function parseModules(value: unknown, options?: { keepIncomplete?: boolean }): CourseModule[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const title = typeof row.title === "string" ? row.title : "";
    const videoUrl = typeof row.videoUrl === "string" ? row.videoUrl : "";
    if (!id) return [];
    if (!options?.keepIncomplete && (!title || !videoUrl)) return [];
    return [{ id, title, videoUrl }];
  });
}

export function parseQuiz(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const prompt = typeof row.prompt === "string" ? row.prompt : "";
    const rawChoices = Array.isArray(row.choices) ? row.choices : [];
    const rawIndex = Number(row.correctIndex);
    const marked =
      Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < rawChoices.length
        ? rawChoices[rawIndex]
        : null;
    const choices = rawChoices.filter(
      (choice): choice is string => typeof choice === "string" && choice.trim().length > 0,
    );
    const correctIndex = typeof marked === "string" ? choices.indexOf(marked) : -1;
    if (!prompt || choices.length < 2 || correctIndex < 0) return [];
    return [{ prompt, choices, correctIndex }];
  });
}

export function publicQuiz(questions: QuizQuestion[]) {
  return questions.map((item) => ({
    prompt: item.prompt,
    choices: item.choices,
  }));
}

export function isModuleUnlocked(
  accessMode: string,
  modules: CourseModule[],
  completedIds: string[],
  index: number,
) {
  if (accessMode === "OPEN") return true;
  if (index <= 0) return true;
  return modules.slice(0, index).every((item) => completedIds.includes(item.id));
}

export function progressPercent(completedIds: string[], moduleCount: number) {
  if (moduleCount <= 0) return 0;
  const unique = new Set(completedIds);
  return Math.min(100, Math.round((unique.size / moduleCount) * 100));
}

export function allModulesDone(completedIds: string[], modules: CourseModule[]) {
  return modules.length > 0 && modules.every((item) => completedIds.includes(item.id));
}

export function gradeQuiz(questions: QuizQuestion[], answers: number[]) {
  if (questions.length === 0) return 0;
  let correct = 0;
  questions.forEach((question, index) => {
    if (answers[index] === question.correctIndex) correct += 1;
  });
  return Math.round((correct / questions.length) * 100);
}

export function formatCoursePrice(price: number) {
  if (price <= 0) return "Gratuit";
  return `${price.toLocaleString("fr-FR")} FCFA`;
}

export function learnerHome(role: string) {
  return role === "EMPLOYEE" ? "/employee/formations" : "/candidate/formations";
}
