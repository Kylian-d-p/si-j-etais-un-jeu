import prisma from "@/lib/prisma";
import Game from "./game";

export default async function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;

  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    return <div>Game not found</div>;
  }

  return <Game game={{ ...game, id: gameId }} />;
}
