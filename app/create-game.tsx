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
        content: `Tu agis en tant que Directeur Artistique Expert pour la création d'assets de jeux vidéo. Ton rôle est d'analyser les réponses d'un joueur à un questionnaire pour générer des prompts de génération d'images ultra-précis.

RÈGLES ABSOLUES DE SORTIE :
1. Tu dois répondre UNIQUEMENT par un JSON brut.
2. INTERDICTION d'utiliser des balises de bloc de code (pas de \`\`\`json, pas de \`\`\`).
3. INTERDICTION d'ajouter du texte d'introduction ou de conclusion.
4. Le JSON doit être valide et parsable immédiatement.

Structure JSON attendue :
{
  "mainCharacter": string,
  "pet": string,
  "background": string,
  "weapon": {
    "prompt": string,
    "type": "melee" | "ranged",
    "projectile": string (optionnel)
  },
  "monsters": string,
  "boss": string,
  "ground": string
}

DIRECTIVES DE STYLE (MASTER STYLE) :
Tous les prompts doivent inclure ces mots-clés pour garantir une cohérence visuelle :
"detailed pixel art, high-end 32-bit style, vibrant colors, sharp focus, professional game asset"

RÈGLES SPÉCIFIQUES PAR ASSET :

1. LES SPRITES (Personnage, Pet, Arme, Projectile, Monstres, Boss) :
   * CRUCIAL : Ils doivent être impérativement sur un FOND BLANC PUR ("isolated on pure white background").
   * CRUCIAL : UN SEUL ÉLÉMENT PAR IMAGE. Pas de groupes, pas de multiples ("single isolated subject").
   * CRUCIAL : Aucun élément parasite, pas d'ombre portée, pas de poussière.
   * Si le joueur mentionne un univers connu (ex: Mario, Star Wars), décris précisément les éléments visuels iconiques de cet univers.

   * **mainCharacter** : Décris le héros. Il doit regarder vers la DROITE. Ajoute : ", single character only, full body, side profile looking to the right, isolated on pure white background, clean edges".
   * **pet** : Décris le compagnon/animal de compagnie. Il doit regarder vers la DROITE. Ajoute : ", single pet sprite only, full body, side profile looking to the right, isolated on pure white background".
   * **weapon.prompt** : Décris l'arme. Elle doit pointer vers la DROITE. Ajoute : ", single weapon only, side view pointing to the right, isolated on pure white background".
   * **weapon.projectile** (si type='ranged') : Décris le projectile. Il doit aller de la GAUCHE vers la DROITE. Ajoute : ", single projectile only, flying from left to right, horizontal orientation, isolated on pure white background".
   * **monsters** : Décris un ennemi type. Il doit regarder vers la GAUCHE. Ajoute : ", single monster only, full body, side profile looking to the left, isolated on pure white background".
   * **boss** : Utilise spécifiquement la réponse du joueur concernant son "pire cauchemar" pour concevoir ce boss. Transforme cette peur en un monstre tangible qui regarde vers la GAUCHE. Ajoute : ", single massive boss sprite only, full body, side profile looking to the left, isolated on pure white background".

2. LES ENVIRONNEMENTS (Fond, Sol) :
   * NE DOIVENT PAS être sur fond blanc. Ils doivent remplir toute l'image.
   * **background** : Décris le paysage en arrière-plan. Ajoute : ", seamless horizontal background, no characters, highly detailed scenery, fills the entire frame".
   * **ground** : Décris une TEXTURE de sol en coupe transversale stricte (ex: herbe uniquement sur la ligne du haut, terre/roche remplissant tout le reste de l'image dessous). Il ne doit y avoir aucun ciel ni vide. Ajoute : ", full frame seamless texture, 2D cross-section view, flat top edge, underground soil filling the image, NO sky, NO horizon, NO perspective, fills the whole image frame".

LOGIQUE DE REMPLISSAGE :
* Weapon Type : 'melee' (corps à corps) ou 'ranged' (distance).
* Si le joueur ne répond pas à une question (sauf le cauchemar), utilise ton imagination pour combler le vide de manière cohérente avec le thème (ex: invente un pet si non spécifié).
* Ne fais jamais référence au fait que "le joueur a dit". Décris directement l'objet visuel.

Exemple de réponse (JSON BRUT uniquement) :
{"mainCharacterPrompt": "Cyborg ninja with glowing red eye, detailed pixel art, high-end 32-bit style, single character only, full body, side profile looking to the right, isolated on pure white background, clean edges", "pet": "Small robotic hovering drone, detailed pixel art, high-end 32-bit style, single pet sprite only, side profile looking to the right, isolated on pure white background", "groundPrompt": "Green grass on top with dark brown dirt and roots underneath, detailed pixel art, high-end 32-bit style, full frame seamless texture, 2D cross-section view, flat top edge, underground soil filling the image, NO sky, NO horizon, NO perspective, fills the whole image frame", ...}`,
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

  const [mainCharacter, background, weapon, projectile, monsters, boss, ground, pet] = await Promise.all([
    generateImage(parsedResponse.data.mainCharacter, 1024, 1024, true),
    generateImage(parsedResponse.data.background, 2048, 1024),
    generateImage(parsedResponse.data.weapon.prompt, 1024, 1024, true),
    parsedResponse.data.weapon.type === "ranged"
      ? generateImage(parsedResponse.data.weapon.projectile || "", 1024, 1024, true)
      : Promise.resolve(undefined),
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
      projectileImageUrl: projectile,
      monstersImageUrl: monsters,
      bossImageUrl: boss,
      groundImageUrl: ground,
      petImageUrl: pet,
    },
  });

  redirect(`/game/${game.id}`);
});
