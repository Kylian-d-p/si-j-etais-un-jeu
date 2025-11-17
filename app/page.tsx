"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function Home() {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(-1);

  const questions: ({ label: string; responseType: "free" } | { label: string; responseType: "multipleChoice"; choices: string[] })[] = [
    {
      label: "Quel est ton film préféré ?",
      responseType: "free",
    },
  ];

  const responses: string[] = [];

  return (
    <main>
      {activeQuestionIndex < 0 ? (
        <div className="flex flex-col h-screen justify-center gap-5 max-w-2xl mx-auto p-4">
          <h1 className="font-bold text-3xl">Bonjour !</h1>
          <p>Avant de commencer, on va répondre ensemble à quelques questions !</p>
          <Button onClick={() => setActiveQuestionIndex(0)}>Commencer</Button>
        </div>
      ) : (
        <div className="flex flex-col h-screen justify-center gap-5 max-w-2xl mx-auto p-4">
          <h2 className="font-bold text-3xl">Question {activeQuestionIndex + 1} :</h2>
          <p>{questions[activeQuestionIndex].label}</p>
          {questions[activeQuestionIndex].responseType === "free" ? (
            <Textarea className="border p-2 rounded-md min-h-[100px]" />
          ) : (
            <div className="flex flex-col gap-3">
              {questions[activeQuestionIndex].choices.map((choice) => (
                <Button key={choice} variant="outline">
                  {choice}
                </Button>
              ))}
            </div>
          )}
          <div className="flex justify-between mt-4">
            {activeQuestionIndex > 0 && (
              <Button variant="outline" onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}>
                Précédent
              </Button>
            )}
            <Button
              onClick={() => {
                if (activeQuestionIndex < questions.length - 1) {
                  setActiveQuestionIndex(activeQuestionIndex + 1);
                } else {
                  // Finish
                }
              }}
            >
              {activeQuestionIndex < questions.length - 1 ? "Suivant" : "Terminer"}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
