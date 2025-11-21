import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { gameId, field, value } = await request.json();

    if (!gameId || !field || typeof value !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Validate that the field is a valid flipping field
    const validFields = ["mainCharacterNeedsFlipping", "weaponNeedsFlipping", "monstersNeedsFlipping", "bossNeedsFlipping", "petNeedsFlipping"];

    if (!validFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: { [field]: value },
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error("Failed to update game:", error);
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
  }
}
