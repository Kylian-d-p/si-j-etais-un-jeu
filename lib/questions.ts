import z from "zod";
import { types } from "./types";

export const questions: z.infer<typeof types.questions> = [
  {
    label: "Quel est ton film préféré ?",
    responseType: "free",
  },
];
