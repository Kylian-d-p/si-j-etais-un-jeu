"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { questions } from "@/lib/questions";
import { Gamepad2, Loader2, Sparkles, Zap } from "lucide-react";
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

  const loadingMessages = [
    "Génération de votre univers magique... ✨",
    "Création de personnages épiques... 🦸",
    "Invocation de monstres terrifiants... 👾",
    "Forge d'armes légendaires... ⚔️",
    "Assemblage du boss final... 🐉",
    "Préparation de votre aventure... 🎮",
  ];

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(0);

  useState(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentLoadingMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  });

  return (
    <main className="min-h-screen bg-linear-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-bounce">
          <Sparkles className="w-8 h-8 text-yellow-300 opacity-70" />
        </div>
        <div className="absolute top-40 right-20 animate-pulse">
          <Gamepad2 className="w-12 h-12 text-white opacity-50" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-bounce delay-100">
          <Zap className="w-10 h-10 text-yellow-200 opacity-60" />
        </div>
        <div className="absolute top-1/2 right-10 animate-pulse delay-200">
          <Sparkles className="w-6 h-6 text-pink-300 opacity-70" />
        </div>
        <div className="absolute top-60 left-1/3 animate-spin-slow">
          <Sparkles className="w-7 h-7 text-orange-300 opacity-60" />
        </div>
        <div className="absolute bottom-40 right-1/3 animate-bounce delay-300">
          <Gamepad2 className="w-10 h-10 text-pink-200 opacity-40" />
        </div>
        <div className="absolute top-1/3 left-20 animate-pulse delay-500">
          <Zap className="w-8 h-8 text-white opacity-50" />
        </div>
        <div className="absolute bottom-1/3 right-40 animate-bounce delay-700">
          <Sparkles className="w-9 h-9 text-yellow-400 opacity-65" />
        </div>
        <div className="absolute top-80 right-1/4 animate-pulse delay-400">
          <Gamepad2 className="w-11 h-11 text-orange-200 opacity-45" />
        </div>
        <div className="absolute bottom-60 left-1/2 animate-spin-slow">
          <Zap className="w-6 h-6 text-pink-400 opacity-55" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col h-screen justify-center items-center gap-10 max-w-2xl mx-auto p-4 relative z-10">
          {/* Single clean spinner with icon */}
          <div className="relative w-40 h-40">
            <div className="w-40 h-40 border-8 border-white/30 border-t-white rounded-full animate-spin"></div>
            <Gamepad2 className="w-20 h-20 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>

          {/* Clean text display */}
          <div className="text-center space-y-6 w-full">
            <h2 className="font-bold text-5xl text-white drop-shadow-2xl">Création en cours...</h2>
            <p className="text-2xl text-white/95 drop-shadow-lg font-medium min-h-8">{loadingMessages[currentLoadingMessage]}</p>

            {/* Simple dots animation */}
            <div className="flex justify-center gap-3 pt-4">
              <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-white rounded-full animate-bounce delay-100"></div>
              <div className="w-4 h-4 bg-white rounded-full animate-bounce delay-200"></div>
            </div>
          </div>

          {/* Clean info card */}
          <div className="mt-4 p-6 bg-white/25 backdrop-blur-lg rounded-2xl border-2 border-white/40 shadow-xl">
            <p className="text-white text-center text-lg">🎨 Création d&apos;un jeu unique basé sur vos réponses...</p>
          </div>
        </div>
      ) : activeQuestionIndex < 0 ? (
        <div className="flex flex-col h-screen justify-center gap-8 max-w-2xl mx-auto p-4 relative z-10 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="inline-block animate-bounce">
              <Gamepad2 className="w-20 h-20 text-white mx-auto drop-shadow-2xl" />
            </div>
            <h1 className="font-bold text-6xl text-white drop-shadow-2xl animate-slide-up">Bonjour ! 👋</h1>
            <p className="text-2xl text-white/90 drop-shadow-lg animate-slide-up delay-100">
              Avant de commencer, on va répondre ensemble à quelques questions !
            </p>
            <p className="text-lg text-white/80 drop-shadow animate-slide-up delay-200">Préparez-vous à créer VOTRE jeu unique ! ✨</p>
          </div>
          <Button
            onClick={() => setActiveQuestionIndex(0)}
            className="bg-white text-purple-600 hover:bg-purple-100 text-xl py-6 rounded-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 animate-slide-up"
          >
            <Sparkles />
            Commencer l&apos;aventure
          </Button>
        </div>
      ) : (
        <div className="flex flex-col h-screen justify-center gap-6 max-w-2xl mx-auto p-4 relative z-10 animate-fade-in">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-white/40 shadow-2xl space-y-6 transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-white text-purple-600 rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shadow-lg">
                {activeQuestionIndex + 1}
              </div>
              <h2 className="font-bold text-3xl text-white drop-shadow-lg">
                Question {activeQuestionIndex + 1} / {questions.length}
              </h2>
            </div>

            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-yellow-400 to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${((activeQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            <p className="text-xl text-white/95 drop-shadow">{questions[activeQuestionIndex].label}</p>

            {questions[activeQuestionIndex].responseType === "free" ? (
              <div className="relative">
                <Textarea
                  onKeyDown={(e) => {
                    if (e.key == "Enter" && e.shiftKey == false) {
                      e.preventDefault();
                      nextQuestion();
                    }
                  }}
                  className="border-2 border-purple-300 p-6 rounded-2xl min-h-[140px] bg-white text-gray-900 text-lg font-normal transition-all shadow-lg placeholder:text-gray-500 resize-none"
                  placeholder="Laissez libre cours à votre imagination... ✨"
                  value={responses[activeQuestionIndex] || ""}
                  onChange={(e) =>
                    setResponses((prev) => {
                      const newResponses = [...prev];
                      newResponses[activeQuestionIndex] = e.target.value;
                      return newResponses;
                    })
                  }
                />
                {responses[activeQuestionIndex] && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 text-sm text-purple-600 font-semibold">
                    <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                    Super !
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {questions[activeQuestionIndex].choices.map((choice, index) => (
                  <Button
                    key={choice}
                    variant="outline"
                    className="bg-white/90 hover:bg-white border-2 border-white/40 text-purple-700 hover:text-purple-900 text-lg py-6 rounded-xl font-semibold shadow-lg transform hover:scale-105 hover:shadow-xl transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      setResponses((prev) => {
                        const newResponses = [...prev];
                        newResponses[activeQuestionIndex] = choice;
                        return newResponses;
                      });
                      setTimeout(() => nextQuestion(), 200);
                    }}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-6 gap-4">
              {activeQuestionIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                  className="bg-white/80 hover:bg-white border-2 border-white/40 text-purple-700 font-semibold py-5 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  ← Précédent
                </Button>
              )}
              <Button
                onClick={nextQuestion}
                disabled={loading || !responses[activeQuestionIndex]}
                className="bg-linear-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-5 px-8 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Chargement...
                  </>
                ) : activeQuestionIndex < questions.length - 1 ? (
                  <>Suivant →</>
                ) : (
                  <>
                    <Sparkles />
                    Créer mon jeu !
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
