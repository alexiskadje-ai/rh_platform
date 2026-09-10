"use client";

import { useActionState, useMemo, useState } from "react";
import {
  COURSE_ACCESS_LABELS,
  COURSE_CATEGORIES,
} from "@/lib/constants";
import type { CourseModule, QuizQuestion } from "@/lib/learning";
import { createCourse, updateCourse, type ActionState } from "@/server/actions/courses";
import { FileUrlField } from "@/components/employees/file-url-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const TABS = ["Infos", "Contenu", "Évaluation"] as const;

function newId() {
  return crypto.randomUUID();
}

export function CourseForm({
  courseId,
  initial,
}: {
  courseId?: string;
  initial?: {
    title: string;
    description: string;
    category: string;
    price: number;
    passingScore: number;
    accessMode: string;
    modules: CourseModule[];
    documents: string[];
    quiz: QuizQuestion[];
  };
}) {
  const action = courseId ? updateCourse : createCourse;
  const [state, formAction] = useActionState(action, {} as ActionState);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Infos");
  const [modules, setModules] = useState<CourseModule[]>(
    initial?.modules?.length
      ? initial.modules
      : [{ id: newId(), title: "", videoUrl: "" }],
  );
  const [documents, setDocuments] = useState<string[]>(
    initial?.documents?.length ? initial.documents : [],
  );
  const [quiz, setQuiz] = useState<QuizQuestion[]>(
    initial?.quiz?.length
      ? initial.quiz
      : [{ prompt: "", choices: ["", "", "", ""], correctIndex: 0 }],
  );

  const modulesJson = useMemo(() => JSON.stringify(modules), [modules]);
  const documentsJson = useMemo(
    () => JSON.stringify(documents.filter(Boolean)),
    [documents],
  );
  const quizJson = useMemo(
    () =>
      JSON.stringify(
        quiz.map((item) => ({
          ...item,
          choices: item.choices.filter((choice) => choice.trim()),
        })),
      ),
    [quiz],
  );

  function moveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setModules(next);
  }

  return (
    <form action={formAction} className="space-y-6">
      {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
      <input type="hidden" name="modules" value={modulesJson} />
      <input type="hidden" name="documents" value={documentsJson} />
      <input type="hidden" name="quiz" value={quizJson} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={tab === item ? "default" : "outline"}
            onClick={() => setTab(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className={tab === "Infos" ? "space-y-4" : "hidden"}>
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" required defaultValue={initial?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={8}
              defaultValue={initial?.description}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <select
                name="category"
                required
                defaultValue={initial?.category ?? COURSE_CATEGORIES[0]}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {COURSE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Prix (0 = gratuit)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                defaultValue={initial?.price ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Parcours</Label>
              <select
                name="accessMode"
                defaultValue={initial?.accessMode ?? "LINEAR"}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {Object.entries(COURSE_ACCESS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
      </div>

      <div className={tab === "Contenu" ? "space-y-6" : "hidden"}>
          {modules.map((module, index) => (
            <div key={module.id} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Module {index + 1}</p>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => moveModule(index, -1)}>
                    Monter
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => moveModule(index, 1)}>
                    Descendre
                  </Button>
                  {modules.length > 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setModules(modules.filter((item) => item.id !== module.id))}
                    >
                      Retirer
                    </Button>
                  ) : null}
                </div>
              </div>
              <Input
                placeholder="Titre du module"
                value={module.title}
                onChange={(event) =>
                  setModules(
                    modules.map((item) =>
                      item.id === module.id ? { ...item, title: event.target.value } : item,
                    ),
                  )
                }
              />
              <FileUrlField
                name={`video-${module.id}`}
                folder="courses/videos"
                label="Vidéo"
                accept="video/*"
                defaultUrl={module.videoUrl}
                onUploaded={(videoUrl) =>
                  setModules((current) =>
                    current.map((item) => (item.id === module.id ? { ...item, videoUrl } : item)),
                  )
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setModules([...modules, { id: newId(), title: "", videoUrl: "" }])}
          >
            Ajouter un module
          </Button>
          <div className="space-y-3">
            <p className="text-sm font-medium">Documents PDF (optionnel)</p>
            {documents.map((url, index) => (
              <FileUrlField
                key={`doc-${index}`}
                name={`document-${index}`}
                folder="courses/documents"
                label={`Document ${index + 1}`}
                accept="application/pdf"
                defaultUrl={url}
                onUploaded={(fileUrl) =>
                  setDocuments((current) =>
                    current.map((item, itemIndex) => (itemIndex === index ? fileUrl : item)),
                  )
                }
              />
            ))}
            <Button type="button" variant="outline" onClick={() => setDocuments([...documents, ""])}>
              Ajouter un document
            </Button>
          </div>
      </div>

      <div className={tab === "Évaluation" ? "space-y-6" : "hidden"}>
          <div className="space-y-2">
            <Label htmlFor="passingScore">Seuil de réussite (%)</Label>
            <Input
              id="passingScore"
              name="passingScore"
              type="number"
              min={0}
              max={100}
              defaultValue={initial?.passingScore ?? 70}
            />
          </div>
          {quiz.map((question, qIndex) => (
            <div key={qIndex} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Question {qIndex + 1}</p>
                {quiz.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setQuiz(quiz.filter((_, index) => index !== qIndex))}
                  >
                    Retirer
                  </Button>
                ) : null}
              </div>
              <Textarea
                placeholder="Intitulé"
                value={question.prompt}
                onChange={(event) =>
                  setQuiz(
                    quiz.map((item, index) =>
                      index === qIndex ? { ...item, prompt: event.target.value } : item,
                    ),
                  )
                }
              />
              {question.choices.map((choice, cIndex) => (
                <label key={cIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={question.correctIndex === cIndex}
                    onChange={() =>
                      setQuiz(
                        quiz.map((item, index) =>
                          index === qIndex ? { ...item, correctIndex: cIndex } : item,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder={`Choix ${cIndex + 1}`}
                    value={choice}
                    onChange={(event) =>
                      setQuiz(
                        quiz.map((item, index) => {
                          if (index !== qIndex) return item;
                          const choices = [...item.choices];
                          choices[cIndex] = event.target.value;
                          return { ...item, choices };
                        }),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setQuiz([...quiz, { prompt: "", choices: ["", "", "", ""], correctIndex: 0 }])
            }
          >
            Ajouter une question
          </Button>
      </div>

      {state.errors ? (
        <ul className="space-y-1 text-sm text-destructive">
          {Object.values(state.errors)
            .flat()
            .filter(Boolean)
            .map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
        </ul>
      ) : null}
      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton>{courseId ? "Enregistrer" : "Créer la formation"}</SubmitButton>
    </form>
  );
}
