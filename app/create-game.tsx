"use server";

import { generateImage } from "@/lib/comfyui";
import { openai } from "@/lib/openai";
import { questions } from "@/lib/questions";
import { createSafeAction } from "@/lib/safe-action";
import { formSchemas, types } from "@/lib/types";

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
  "mainCharacterPrompt": string,
  "backgroundPrompt": string,
  "weapon": {
    "prompt": string,
    "type": "melee" | "ranged",
    "projectilePrompt": string (optionnel)
  },
  "monstersPrompt": string,
  "bossPrompt": string,
  "groundPrompt": string
}

DIRECTIVES DE STYLE (MASTER STYLE) :
Tous les prompts doivent inclure ces mots-clés pour garantir une cohérence visuelle :
"detailed pixel art, high-end 32-bit style, vibrant colors, sharp focus, professional game asset"

RÈGLES SPÉCIFIQUES PAR ASSET :

1. LES SPRITES (Personnage, Arme, Projectile, Monstres, Boss) :
   * CRUCIAL : Ils doivent être impérativement sur un FOND BLANC PUR ("isolated on pure white background").
   * CRUCIAL : UN SEUL ÉLÉMENT PAR IMAGE. Pas de groupes, pas de multiples ("single isolated subject").
   * CRUCIAL : Aucun élément parasite, pas d'ombre portée, pas de poussière.
   * Si le joueur mentionne un univers connu (ex: Mario, Star Wars), décris précisément les éléments visuels iconiques de cet univers.

   * **mainCharacterPrompt** : Décris le héros. Il doit regarder vers la DROITE. Ajoute : ", single character only, full body, side profile looking to the right, isolated on pure white background, clean edges".
   * **weapon.prompt** : Décris l'arme. Elle doit pointer vers la DROITE. Ajoute : ", single weapon only, side view pointing to the right, isolated on pure white background".
   * **weapon.projectilePrompt** (si type='ranged') : Décris le projectile. Il doit aller de la GAUCHE vers la DROITE. Ajoute : ", single projectile only, flying from left to right, horizontal orientation, isolated on pure white background".
   * **monstersPrompt** : Décris un ennemi type. Il doit regarder vers la GAUCHE. Ajoute : ", single monster only, full body, side profile looking to the left, isolated on pure white background".
   * **bossPrompt** : Utilise spécifiquement la réponse du joueur concernant son "pire cauchemar" pour concevoir ce boss. Transforme cette peur en un monstre tangible qui regarde vers la GAUCHE. Ajoute : ", single massive boss sprite only, full body, side profile looking to the left, isolated on pure white background".

2. LES ENVIRONNEMENTS (Fond, Sol) :
   * NE DOIVENT PAS être sur fond blanc. Ils doivent remplir toute l'image.
   * **backgroundPrompt** : Décris le paysage. Ajoute : ", seamless horizontal background, no characters, highly detailed scenery, fills the entire frame".
   * **groundPrompt** : Décris une tuile de sol en vue de coupe (ex: herbe dessus, terre dessous). Ajoute : ", seamless repeating texture tile, cross-section view, flat top surface, fills the whole image frame, no white background".

LOGIQUE DE REMPLISSAGE :
* Weapon Type : 'melee' (corps à corps) ou 'ranged' (distance).
* Si le joueur ne répond pas à une question (sauf le cauchemar), utilise ton imagination pour combler le vide de manière cohérente avec le thème.
* Ne fais jamais référence au fait que "le joueur a dit". Décris directement l'objet visuel.

Exemple de réponse (JSON BRUT uniquement) :
{"mainCharacterPrompt": "Cyborg ninja with glowing red eye, detailed pixel art, high-end 32-bit style, single character only, full body, side profile looking to the right, isolated on pure white background, clean edges", "bossPrompt": "Giant spider with metal legs representing arachnophobia, detailed pixel art, high-end 32-bit style, single massive boss sprite only, side profile looking to the left, isolated on pure white background", ...}`,
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
    throw new Error("Failed to parse OpenAI response: " + JSON.stringify(parsedResponse.error.format()));
  }

  console.log(`Voici les questions posées au joueur : ${JSON.stringify(questions)}.
        Voici les réponses du joueur au questionnaire : ${JSON.stringify(parsedInput.responses)}.`);
  console.log(parsedResponse.data);

  const [mainCharacter, background, weapon, projectile, monsters, boss, ground] = await Promise.all([
    generateImage(parsedResponse.data.mainCharacterPrompt, 512, 512, true),
    generateImage(parsedResponse.data.backgroundPrompt, 1024, 512),
    generateImage(parsedResponse.data.weapon.prompt, 512, 512, true),
    parsedResponse.data.weapon.type === "ranged"
      ? generateImage(parsedResponse.data.weapon.projectilePrompt || "", 512, 512, true)
      : Promise.resolve(undefined),
    generateImage(parsedResponse.data.monstersPrompt, 512, 512, true),
    generateImage(parsedResponse.data.bossPrompt, 512, 512, true),
    generateImage(parsedResponse.data.groundPrompt, 1024, 256),
  ]);

  // push to prisma

  const assets = {
    mainCharacter,
    background,
    weapon,
    projectile,
    monsters,
    boss,
    ground,
  };

  return { assets, prompts: parsedResponse.data };
});
