import z from "zod";

export const types = {
  questions: z.array(
    z.discriminatedUnion("responseType", [
      z.object({
        label: z.string(),
        responseType: z.literal("free"),
      }),
      z.object({
        label: z.string(),
        responseType: z.literal("multipleChoice"),
        choices: z.array(z.string()),
      }),
    ])
  ),
  prompts: z.object({
    mainCharacter: z.string(),
    background: z.string(),
    pet: z.string(),
    weapon: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("melee"),
        prompt: z.string(),
      }),
      z.object({
        type: z.literal("ranged"),
        prompt: z.string(),
        projectile: z.string(),
      }),
    ]),
    monsters: z.string(),
    boss: z.string(),
    ground: z.string(),
  }),
};

export const formSchemas = {
  createGame: z.object({
    responses: z.array(z.string()),
  }),
};
