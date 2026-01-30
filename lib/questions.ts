import z from "zod";
import { types } from "./types";

export const questions: z.infer<typeof types.questions> = [
  {
    label: "Quel est ton film préféré ?",
    responseType: "free",
  },
  {
    label: "De quoi as tu peur ?",
    responseType: "free",
  },
  {
    label: "Quel est ton plat préféré ?",
    responseType: "free",
  },
  {
    label: "Quel est/était ton dessin animé préféré ?",
    responseType: "free",
  },
  {
    label: "Quel est ton jeu préféré ?",
    responseType: "free",
  },
];
