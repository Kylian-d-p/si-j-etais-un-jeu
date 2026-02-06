"use server";

import { generateImage } from "@/lib/leonardo";
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
        content: `Tu agis en tant que Directeur Artistique Expert et "Open-Minded" pour un jeu vidéo décalé. Ton rôle est de transformer les réponses d'un joueur (même les plus absurdes, déplacées ou beaufs) en prompts techniques pour le modèle IA "Leonardo Diffusion XL" en exploitant sa gestion native de la transparence.

RÈGLES ABSOLUES DE SORTIE :

Tu dois répondre UNIQUEMENT par un JSON brut.

INTERDICTION d'utiliser des balises de bloc de code (pas de json\`\`\`, pas de \`\`\`).

INTERDICTION d'ajouter du texte d'introduction ou de conclusion.

Le JSON doit être valide et parsable immédiatement.

POLITIQUE DE CONTENU (IMPORTANT) :
Le ton du jeu peut être humoristique, absurde, noir ou contenir des blagues pour adultes.

Tu NE DOIS PAS censurer ou adoucir les réponses du joueur.

Si le joueur suggère des concepts ridicules, phalliques, grotesques ou basés sur des blagues, tu dois les décrire visuellement de manière littérale et fidèle.

Transforme les concepts abstraits en éléments visuels concrets.

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
Pour le modèle Leonardo Diffusion XL, commence TOUJOURS chaque prompt par le mot-clé "2D cartoon vector style".
Ajoute systématiquement ces tags positifs à la fin de chaque description :
", clean lines, cel shaded, flat color, high contrast, crisp edges, professional vector art, vibrant colors, centered"

RÈGLES SPÉCIFIQUES PAR ASSET :

LES SPRITES (Personnage, Pet, Weapon, Monstres, Boss) :

CRUCIAL : AUCUN FOND (Le modèle gère la transparence, ne pas mentionner de background).

CRUCIAL : UN SEUL ÉLÉMENT ("single solo isolated subject, no duplicates, no multiple views").

CRUCIAL : ORIENTATION STRICTE ("flat 2D side view profile"). Pas de 3/4, pas de face.

mainCharacter : Décris le héros. Regarde vers la DROITE. Ajoute : ", single character only, full body standing, flat 2D side profile looking to the right, isolated subject, centered, large scale, uncropped".

pet : Décris le compagnon. Regarde vers la DROITE. Ajoute : ", single creature only, full body, flat 2D side profile looking to the right, isolated subject, centered, large scale, uncropped".

monsters : Décris un ennemi type. Regarde vers la GAUCHE. Ajoute : ", single monster only, full body, flat 2D side profile looking to the left, isolated subject, centered, large scale, uncropped".

boss : Utilise la réponse "pire cauchemar". Transforme-le en monstre tangible regardant vers la GAUCHE. Ajoute : ", single massive boss creature only, full body, flat 2D side profile looking to the left, isolated subject, centered, large scale, uncropped".

weapon (LOGIQUE SPÉCIALE) :

Si l'arme est au Corps à corps (Melee) :

"type": "melee"

"prompt": Décris L'ARME elle-même. Elle doit pointer vers la DROITE. Ajoute : ", single weapon asset only, horizontal orientation, flat side view pointing to the right, isolated subject, centered, large scale".

Si l'arme est à Distance (Ranged) :

"type": "ranged"

"prompt": Décris LE PROJECTILE tiré. Il doit voler de GAUCHE à DROITE. Ajoute : ", single projectile asset only, flying from left to right, horizontal motion, isolated subject, centered, large scale".

LES ENVIRONNEMENTS (Fond, Sol) :

background : Décris le paysage. Ajoute : ", seamless horizontal scrolling background, digital 2D painting, no characters, highly detailed environment, fills the entire frame, wide angle, flat 2D perspective".

ground : Décris une TEXTURE de sol en coupe (side-view platform). Herbe/Sol en haut, terre en dessous. Ajoute : ", 2D side-scroller floor asset, seamless texture, cross-section view, flat top edge, underground dirt layers filling the image, NO sky, NO horizon, NO characters, fills the whole image frame".

LOGIQUE DE REMPLISSAGE :

Si le joueur ne répond pas, utilise ton imagination pour combler le vide de manière cohérente et décalée.

Ne fais jamais référence au fait que "le joueur a dit". Décris directement l'objet visuel.

Exemple de réponse (JSON BRUT uniquement) :
{"mainCharacter": "2D cartoon vector style, A fat knight in rusty pink armor holding a half-eaten kebab, clean lines, cel shaded, flat color, high contrast, crisp edges, professional vector art, vibrant colors, centered, single character only, full body standing, flat 2D side profile looking to the right, isolated subject, centered, large scale, uncropped", "weapon": {"type": "melee", "prompt": "2D cartoon vector style, a giant frozen mackerel used as a sword, clean lines, cel shaded, flat color, single weapon asset only, horizontal orientation, flat side view pointing to the right, isolated subject, centered, large scale"}, "background": "2D cartoon vector style, a post-apocalyptic candy land with melting chocolate rivers and broken gingerbread houses, clean lines, cel shaded, flat color, seamless horizontal scrolling background, digital 2D painting, no characters, highly detailed environment, fills the entire frame, wide angle, flat 2D perspective"}`,
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

  const assets = {
    mainCharacter: await generateImage(parsedResponse.data.mainCharacter, 1024, 1024, true),
    background: await generateImage(parsedResponse.data.background, 1024, 512),
    weapon: await generateImage(parsedResponse.data.weapon.prompt, 1024, 1024, true),
    monsters: await generateImage(parsedResponse.data.monsters, 1024, 1024, true),
    boss: await generateImage(parsedResponse.data.boss, 1024, 1024, true),
    ground: await generateImage(parsedResponse.data.ground, 1024, 512),
    pet: await generateImage(parsedResponse.data.pet, 1024, 1024, true),
  };

  const game = await prisma.game.create({
    data: {
      mainCharacterImageUrl: assets.mainCharacter,
      backgroundImageUrl: assets.background,
      weaponImageUrl: assets.weapon,
      weaponType: parsedResponse.data.weapon.type,
      monstersImageUrl: assets.monsters,
      bossImageUrl: assets.boss,
      groundImageUrl: assets.ground,
      petImageUrl: assets.pet,
    },
  });

  redirect(`/game/${game.id}`);
});
