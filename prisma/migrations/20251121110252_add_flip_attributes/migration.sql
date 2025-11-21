-- AlterTable
ALTER TABLE "games" ADD COLUMN     "boss_needs_flipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "main_character_needs_flipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monsters_needs_flipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pet_needs_flipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weapon_needs_flipping" BOOLEAN NOT NULL DEFAULT false;
