import OpenAI from "openai";
import { env } from "./env";

export const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: env.DEEPSEEK_API_KEY,
});
