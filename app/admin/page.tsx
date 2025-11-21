"use client";

import { useEffect, useState } from "react";

interface Game {
  id: string;
  mainCharacterImageUrl: string;
  mainCharacterNeedsFlipping: boolean;
  backgroundImageUrl: string;
  weaponImageUrl: string;
  weaponNeedsFlipping: boolean;
  weaponType: string;
  monstersImageUrl: string;
  monstersNeedsFlipping: boolean;
  bossImageUrl: string;
  bossNeedsFlipping: boolean;
  groundImageUrl: string;
  petImageUrl: string;
  petNeedsFlipping: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/admin/games");
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateFlipping = async (gameId: string, field: string, value: boolean) => {
    try {
      const response = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameId, field, value }),
      });

      if (response.ok) {
        // Refresh data
        await fetchGames();
        if (selectedGame?.id === gameId) {
          const updatedGame = games.find((g) => g.id === gameId);
          if (updatedGame) {
            setSelectedGame({ ...updatedGame, [field]: value });
          }
        }
      }
    } catch (error) {
      console.error("Failed to update flipping:", error);
    }
  };

  const SpriteCard = ({ title, imageUrl, needsFlipping, field }: { title: string; imageUrl: string; needsFlipping: boolean; field: string }) => (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="relative w-full h-64 bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} className={`object-contain max-h-full w-auto ${needsFlipping ? "scale-x-[-1]" : ""}`} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`${selectedGame?.id}-${field}`}
          checked={needsFlipping}
          onChange={(e) => selectedGame && updateFlipping(selectedGame.id, field, e.target.checked)}
          className="w-4 h-4 cursor-pointer"
        />
        <label htmlFor={`${selectedGame?.id}-${field}`} className="text-sm cursor-pointer">
          Needs Flipping
        </label>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-500 via-pink-500 to-red-500">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-500 via-pink-500 to-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Administration des Parties</h1>

        {!selectedGame ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:bg-white/20 hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={game.mainCharacterImageUrl} alt="Main Character" width={80} height={80} className="rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">Partie #{game.id.slice(0, 8)}</h3>
                    <p className="text-white/70 text-sm">
                      {new Date(game.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-white/80 text-sm">
                  <p>Type d&apos;arme: {game.weaponType === "melee" ? "Corps à corps" : "Distance"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedGame(null)}
              className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              ← Retour aux parties
            </button>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Partie #{selectedGame.id}</h2>
              <p className="text-white/70">
                Créée le{" "}
                {new Date(selectedGame.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-white/70">Type d&apos;arme: {selectedGame.weaponType === "melee" ? "Corps à corps" : "Distance"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SpriteCard
                title="Personnage Principal"
                imageUrl={selectedGame.mainCharacterImageUrl}
                needsFlipping={selectedGame.mainCharacterNeedsFlipping}
                field="mainCharacterNeedsFlipping"
              />
              <SpriteCard
                title="Arme / Projectile"
                imageUrl={selectedGame.weaponImageUrl}
                needsFlipping={selectedGame.weaponNeedsFlipping}
                field="weaponNeedsFlipping"
              />
              <SpriteCard
                title="Monstres"
                imageUrl={selectedGame.monstersImageUrl}
                needsFlipping={selectedGame.monstersNeedsFlipping}
                field="monstersNeedsFlipping"
              />
              <SpriteCard
                title="Boss"
                imageUrl={selectedGame.bossImageUrl}
                needsFlipping={selectedGame.bossNeedsFlipping}
                field="bossNeedsFlipping"
              />
              <SpriteCard
                title="Pet / Compagnon"
                imageUrl={selectedGame.petImageUrl}
                needsFlipping={selectedGame.petNeedsFlipping}
                field="petNeedsFlipping"
              />
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-3">Arrière-plan</h3>
                <div className="relative w-full h-64 bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedGame.backgroundImageUrl} alt="Background" className="object-cover w-full h-full" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-3">Sol</h3>
                <div className="relative w-full h-64 bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedGame.groundImageUrl} alt="Ground" className="object-cover w-full h-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
