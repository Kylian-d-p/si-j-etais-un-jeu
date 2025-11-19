import z from "zod";
import { types } from "./types";

export const questions: z.infer<typeof types.questions> = [
  {
    label: "Quel est ton film préféré ?",
    responseType: "free",
  },
  {
    label: "Quel est ton pire cauchemar ?",
    responseType: "free",
  },
  {
    label: "Si tu avais un pouvoir lequel serait-il ?",
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
