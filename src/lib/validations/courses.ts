import { z } from "zod";
import { COURSE_CATEGORIES } from "@/lib/constants";

const moduleSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, "Titre de module obligatoire."),
  videoUrl: z.string().trim().min(1, "Vidéo obligatoire pour chaque module."),
});

const questionSchema = z
  .object({
    prompt: z.string().trim().min(1, "Question obligatoire."),
    choices: z.array(z.string().trim().min(1)).min(2).max(6),
    correctIndex: z.coerce.number().int().min(0),
  })
  .refine((data) => data.correctIndex < data.choices.length, {
    message: "La bonne réponse doit correspondre à un choix.",
    path: ["correctIndex"],
  });

export const courseSchema = z.object({
  title: z.string().trim().min(1, "Titre obligatoire."),
  description: z.string().trim().min(1, "Description obligatoire."),
  category: z.enum(COURSE_CATEGORIES),
  price: z.coerce.number().int().min(0),
  passingScore: z.coerce.number().int().min(0).max(100).default(70),
  accessMode: z.enum(["LINEAR", "OPEN"]),
  modules: z.array(moduleSchema).min(1, "Au moins un module est requis."),
  documents: z.array(z.string().trim().min(1)).default([]),
  quiz: z.array(questionSchema).min(1, "Au moins une question de quiz est requise."),
});

export const quizAttemptSchema = z.object({
  courseId: z.string().min(1),
  answers: z.array(z.coerce.number().int().min(0)),
});

export const enrollSchema = z.object({
  courseId: z.string().min(1),
});

export const completeModuleSchema = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
});
