"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { questions } from "@/lib/questions";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { createGame } from "./create-game";

export default function Home() {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<(string | undefined)[]>(questions.map(() => undefined));

  const nextQuestion = async () => {
    if (activeQuestionIndex < questions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    } else {
      setLoading(true);
      const res = await createGame({ responses: responses.map((r) => r || "") });
      if (res.serverError?.message) {
        alert(res.serverError.message);
        console.log(res.serverError);
      }
      setLoading(false);
    }
  };

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
            <Textarea
              onKeyDown={(e) => {
                if (e.key == "Enter" && e.shiftKey == false) {
                  e.preventDefault();
                  nextQuestion();
                }
              }}
              className="border p-2 rounded-md min-h-[100px]"
              value={responses[activeQuestionIndex] || ""}
              onChange={(e) =>
                setResponses((prev) => {
                  const newResponses = [...prev];
                  newResponses[activeQuestionIndex] = e.target.value;
                  return newResponses;
                })
              }
            />
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
            <Button onClick={nextQuestion} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {activeQuestionIndex < questions.length - 1 ? "Suivant" : "Terminer"}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
