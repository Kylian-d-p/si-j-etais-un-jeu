-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "main_character_image_url" TEXT NOT NULL,
    "background_image_url" TEXT NOT NULL,
    "weapon_image_url" TEXT NOT NULL,
    "projectile_image_url" TEXT,
    "monsters_image_url" TEXT NOT NULL,
    "boss_image_url" TEXT NOT NULL,
    "ground_image_url" TEXT NOT NULL,
    "pet_image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);
