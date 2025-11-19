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
  const [response, setResponse] = useState<string | null>(null);
  const [responses, setResponses] = useState<(string | undefined)[]>(questions.map(() => undefined));

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
            <Textarea className="border p-2 rounded-md min-h-[100px]" value={response || ""} onChange={(e) => setResponse(e.target.value)} />
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
              onClick={async () => {
                if (activeQuestionIndex < questions.length - 1) {
                  setResponses((prev) => {
                    const newResponses = [...prev];
                    newResponses[activeQuestionIndex] = response || undefined;
                    return newResponses;
                  });
                  setResponse(responses[activeQuestionIndex] || null);
                  setActiveQuestionIndex(activeQuestionIndex + 1);
                } else {
                  setLoading(true);
                  const res = await createGame({ responses: responses.map((r) => r || "") });
                  setLoading(false);

                  if (!res.data) {
                    console.error("No data returned from createGame");
                    return;
                  }

                  console.log(res.data);
                }
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {activeQuestionIndex < questions.length - 1 ? "Suivant" : "Terminer"}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
