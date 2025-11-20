"use server";

import { generateImage } from "@/lib/comfyui";
import { openai } from "@/lib/openai";
import prisma from "@/lib/prisma";
import { questions } from "@/lib/questions";
import { createSafeAction } from "@/lib/safe-action";
import { formSchemas, types } from "@/lib/types";
import { redirect } from "next/navigation";

export const createGame = createSafeAction.inputSchema(formSchemas.createGame).action(async ({ parsedInput }) => {
  console.log("Creating game with responses");
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Tu agis en tant que Directeur Artistique Expert et "Open-Minded" pour un jeu vidéo décalé. Ton rôle est de transformer les réponses d'un joueur (même les plus absurdes, déplacées ou beaufs) en prompts techniques pour le modèle IA "PixelArtDiffusion".

RÈGLES ABSOLUES DE SORTIE :
1. Tu dois répondre UNIQUEMENT par un JSON brut.
2. INTERDICTION d'utiliser des balises de bloc de code (pas de \`\`\`json, pas de \`\`\`).
3. INTERDICTION d'ajouter du texte d'introduction ou de conclusion.
4. Le JSON doit être valide et parsable immédiatement.

POLITIQUE DE CONTENU (IMPORTANT) :
Le ton du jeu peut être humoristique, absurde, noir ou contenir des blagues pour adultes.
* Tu NE DOIS PAS censurer ou adoucir les réponses du joueur.
* Si le joueur suggère des concepts ridicules, phalliques, grotesques ou basés sur des blagues, tu dois les décrire visuellement de manière littérale et fidèle.
* Transforme les concepts abstraits en éléments visuels concrets.

Structure JSON attendue :
{
  "mainCharacter": string,
  "pet": string,
  "background": string,
  "weapon": {
    "type": "melee" | "ranged",
    "prompt": string
  },
  "monsters": string,
  "boss": string,
  "ground": string
}

DIRECTIVES DE STYLE (MASTER STYLE) :
Pour le modèle PixelArtDiffusion, commence TOUJOURS chaque prompt par le mot-clé "pixelart".
Ajoute systématiquement ces tags positifs à la fin de chaque description :
", detailed, high quality, 32-bit, sharp focus, vibrant, centered, uncropped"

RÈGLES SPÉCIFIQUES PAR ASSET :

1. LES SPRITES (Personnage, Pet, Weapon, Monstres, Boss) :
   * CRUCIAL : FOND BLANC PUR ("isolated on white background, simple background").
   * CRUCIAL : UN SEUL ÉLÉMENT ("single solo isolated subject").
   * CRUCIAL : ORIENTATION STRICTE ("flat 2D side view"). Pas de 3/4, pas de face.

   * **mainCharacter** : Décris le héros. Regarde vers la DROITE. Ajoute : ", single character only, full body, flat 2D side profile looking to the right, isolated on white background, centered, large scale, uncropped".
   * **pet** : Décris le compagnon. Regarde vers la DROITE. Ajoute : ", single pet sprite only, full body, flat 2D side profile looking to the right, isolated on white background, centered, large scale, uncropped".
   * **monsters** : Décris un ennemi type. Regarde vers la GAUCHE. Ajoute : ", single monster only, full body, flat 2D side profile looking to the left, isolated on white background, centered, large scale, uncropped".
   * **boss** : Utilise la réponse "pire cauchemar". Transforme-le en monstre tangible regardant vers la GAUCHE. Ajoute : ", single massive boss sprite only, full body, flat 2D side profile looking to the left, isolated on white background, centered, large scale, uncropped".

   * **weapon** (LOGIQUE SPÉCIALE) :
     * Si l'arme est au **Corps à corps (Melee)** :
       * "type": "melee"
       * "prompt": Décris L'ARME elle-même (épée, batte, etc.). Elle doit pointer vers la DROITE. Ajoute : ", single weapon only, flat side view pointing to the right, isolated on white background, centered, large scale, uncropped".
     * Si l'arme est à **Distance (Ranged)** :
       * "type": "ranged"
       * "prompt": Décris LE PROJECTILE tiré (balle, flèche, boule de feu, rayon). Il doit voler de GAUCHE à DROITE. Ajoute : ", single projectile only, flying from left to right, horizontal orientation, isolated on white background, centered, large scale".

2. LES ENVIRONNEMENTS (Fond, Sol) :
   * **background** : Décris le paysage. Ajoute : ", seamless horizontal background, no characters, highly detailed scenery, fills the entire frame, wide angle".
   * **ground** : Décris une TEXTURE de sol en coupe. Herbe/Sol en haut, terre en dessous. Ajoute : ", full frame seamless texture, 2D cross-section view, flat top edge, underground soil filling the image, NO sky, NO horizon, NO perspective, fills the whole image frame".

LOGIQUE DE REMPLISSAGE :
* Si le joueur ne répond pas, utilise ton imagination pour combler le vide de manière cohérente (et drôle si le contexte s'y prête).
* Ne fais jamais référence au fait que "le joueur a dit". Décris directement l'objet visuel.

Exemple de réponse (JSON BRUT uniquement) :
{"mainCharacter": "pixelart, Drunk superhero holding a beer bottle, detailed, high quality, 32-bit, single character only, full body, flat 2D side profile looking to the right, isolated on white background, centered, large scale, uncropped", "boss": "pixelart, Giant angry mother-in-law monster, detailed, single massive boss sprite only, flat 2D side profile looking to the left, isolated on white background, centered, large scale, uncropped", "ground": "pixelart, Green grass on top with dark brown dirt underneath, detailed, full frame seamless texture, 2D cross-section view, flat top edge, underground soil filling the image, NO sky, NO horizon, NO perspective, fills the whole image frame", "weapon": {"type": "ranged", "prompt": "pixelart, flying beer cap projectile, detailed, single projectile only, flying from left to right, horizontal orientation, isolated on white background, centered, large scale"}}`,
      },
      {
        role: "user",
        content: `Voici les questions posées au joueur : ${JSON.stringify(questions.map((question) => question.label))}.
        Voici les réponses du joueur au questionnaire : ${JSON.stringify(parsedInput.responses)}.`,
      },
    ],
    model: "deepseek-chat",
  });

  const parsedResponse = types.prompts.safeParse(JSON.parse(completion.choices[0].message.content || "{}"));

  if (!parsedResponse.success) {
    throw new Error("Failed to parse OpenAI response: " + parsedResponse.error.message + " | Response was: " + completion.choices[0].message.content);
  }

  console.log(`Voici les questions posées au joueur : ${JSON.stringify(questions)}.
        Voici les réponses du joueur au questionnaire : ${JSON.stringify(parsedInput.responses)}.`);
  console.log(parsedResponse.data);

  const [mainCharacter, background, weapon, monsters, boss, ground, pet] = await Promise.all([
    generateImage(parsedResponse.data.mainCharacter, 1024, 1024, true),
    generateImage(parsedResponse.data.background, 2048, 1024),
    generateImage(parsedResponse.data.weapon.prompt, 1024, 1024, true),
    generateImage(parsedResponse.data.monsters, 1024, 1024, true),
    generateImage(parsedResponse.data.boss, 1024, 1024, true),
    generateImage(parsedResponse.data.ground, 2048, 1024),
    generateImage(parsedResponse.data.pet, 1024, 1024, true),
  ]);

  const game = await prisma.game.create({
    data: {
      mainCharacterImageUrl: mainCharacter,
      backgroundImageUrl: background,
      weaponImageUrl: weapon,
      weaponType: parsedResponse.data.weapon.type,
      monstersImageUrl: monsters,
      bossImageUrl: boss,
      groundImageUrl: ground,
      petImageUrl: pet,
    },
  });

  redirect(`/game/${game.id}`);
});
