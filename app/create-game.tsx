"use server";

import { generateImage } from "@/lib/comfyui";
import { openai } from "@/lib/openai";
import { createSafeAction } from "@/lib/safe-action";
import { formSchemas, types } from "@/lib/types";

export const createGame = createSafeAction.inputSchema(formSchemas.createGame).action(async ({ parsedInput }) => {
  console.log("Creating game with responses");
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Tu agis comme un Directeur Artistique Senior pour un jeu vidéo rétro-moderne. Ta mission est de transformer les réponses d'un joueur en prompts techniques pour une IA génératrice d'images (type Midjourney/DALL-E).

RÈGLE ABSOLUE DE FORMAT :
Tu dois répondre UNIQUEMENT par une chaîne de caractères JSON brute.
INTERDICTION d'utiliser des balises de code (\`\`\`json ou \`\`\`).
INTERDICTION d'écrire du texte avant ou après le JSON.

Format attendu :
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

DIRECTIVES ARTISTIQUES (COHÉRENCE) :
Pour garantir que tous les éléments appartiennent au même jeu, tu dois injecter les mots-clés de style suivants DANS CHAQUE PROMPT généré :
"high-end detailed pixel art, 32-bit style, vibrant colors, sharp focus, professional game asset"

RÈGLES DE CONTENU SPÉCIFIQUES :

1.  **ENTITÉS (Personnage, Monstres, Boss, Arme)** :
    * Doivent être sur fond blanc pour le détourage.
    * Si le joueur cite un univers connu (ex: Star Wars, Zelda), tu DOIS décrire visuellement les traits caractéristiques de cet univers.
    * **mainCharacterPrompt** : Description du héros + ", full body, side profile facing right, isolated on white background".
    * **weapon.prompt** : Description de l'arme + ", weapon sprite, side view facing right, isolated on white background".
    * **monstersPrompt** : Description des ennemis + ", full body, side profile facing left, isolated on white background".
    * **bossPrompt** : Description du boss + ", massive boss sprite, full body, side profile facing left, isolated on white background".

2.  **ENVIRONNEMENT (Fond, Sol)** :
    * NE DOIVENT PAS être sur fond blanc. Ils doivent remplir l'image.
    * **backgroundPrompt** : Description du paysage/ambiance. Doit être immersif et sans personnages. Ajoute : ", seamless horizontal background for side-scrolling game, no characters, highly detailed scenery".
    * **groundPrompt** : Description de la texture du sol en vue de coupe (herbe/pierre dessus, terre dessous). Ajoute : ", seamless repeating texture tile, cross-section view, flat top edge, fills the whole image frame".

3.  **LOGIQUE** :
    * Weapon Type : 'melee' ou 'ranged'. Si 'ranged', remplir 'projectilePrompt' (ex: "pixel art plasma bolt, isolated on white background").
    * Si réponse vide : Invente un concept cohérent avec le reste des réponses.

Exemple de structure de réponse (JSON BRUT uniquement) :
{"mainCharacterPrompt": "Cyberpunk knight with neon helmet, high-end detailed pixel art, 32-bit style, full body, side profile facing right, isolated on white background", "backgroundPrompt": "Futuristic neon city skyline at night, high-end detailed pixel art, 32-bit style, seamless horizontal background...", ...}`,
      },
      {
        role: "user",
        content: `Voici les questions posées au joueur : ${JSON.stringify(types.questions)}.
        Voici les réponses du joueur au questionnaire : ${JSON.stringify(parsedInput.responses)}.`,
      },
    ],
    model: "deepseek-chat",
  });

  const parsedResponse = types.prompts.safeParse(JSON.parse(completion.choices[0].message.content || "{}"));

  if (!parsedResponse.success) {
    throw new Error("Failed to parse OpenAI response: " + JSON.stringify(parsedResponse.error.format()));
  }

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
