"use client";

import { useActionState, useState } from "react";
import { completeModule, submitQuiz, type ActionState } from "@/server/actions/courses";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export function CompleteModuleButton({
  courseId,
  moduleId,
}: {
  courseId: string;
  moduleId: string;
}) {
  const [state, action] = useActionState(completeModule, {} as ActionState);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <SubmitButton>Marquer comme terminé</SubmitButton>
      {state.message ? (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function QuizForm({
  courseId,
  questions,
  passingScore,
}: {
  courseId: string;
  questions: { prompt: string; choices: string[] }[];
  passingScore: number;
}) {
  const [answers, setAnswers] = useState<number[]>(questions.map(() => -1));
  const [state, action] = useActionState(submitQuiz, {} as ActionState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />
      <p className="text-sm text-muted-foreground">Seuil de réussite : {passingScore} %</p>
      {questions.map((question, qIndex) => (
        <fieldset key={qIndex} className="space-y-2 rounded-xl border border-border p-4">
          <legend className="font-medium">
            {qIndex + 1}. {question.prompt}
          </legend>
          {question.choices.map((choice, cIndex) => (
            <label key={cIndex} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`q-${qIndex}`}
                checked={answers[qIndex] === cIndex}
                onChange={() =>
                  setAnswers((current) =>
                    current.map((value, index) => (index === qIndex ? cIndex : value)),
                  )
                }
              />
              {choice}
            </label>
          ))}
        </fieldset>
      ))}
      {state.message ? (
        <p className={state.passed ? "text-sm text-primary" : "text-sm text-destructive"}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit">Valider le quiz</Button>
    </form>
  );
}
