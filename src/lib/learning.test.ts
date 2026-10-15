import { describe, expect, it } from "vitest";
import {
  allModulesDone,
  gradeQuiz,
  isModuleUnlocked,
  progressPercent,
  type CourseModule,
} from "@/lib/learning";

const modules: CourseModule[] = [
  { id: "a", title: "A", videoUrl: "https://example.com/a" },
  { id: "b", title: "B", videoUrl: "https://example.com/b" },
];

describe("parcours e-learning", () => {
  it("débloque le premier module, puis le suivant seulement s'il est terminé en mode linéaire", () => {
    expect(isModuleUnlocked("LINEAR", modules, [], 0)).toBe(true);
    expect(isModuleUnlocked("LINEAR", modules, [], 1)).toBe(false);
    expect(isModuleUnlocked("LINEAR", modules, ["a"], 1)).toBe(true);
  });

  it("ouvre tous les modules en accès libre", () => {
    expect(isModuleUnlocked("OPEN", modules, [], 1)).toBe(true);
  });

  it("calcule la progression et la note du quiz", () => {
    expect(progressPercent(["a"], 2)).toBe(50);
    expect(allModulesDone(["a", "b"], modules)).toBe(true);
    expect(
      gradeQuiz(
        [
          { prompt: "Q", choices: ["oui", "non"], correctIndex: 0 },
          { prompt: "Q2", choices: ["a", "b"], correctIndex: 1 },
        ],
        [0, 0],
      ),
    ).toBe(50);
  });
});
