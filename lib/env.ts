import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DEEPSEEK_API_KEY: z.string().min(1),
    COMFYUI_URL: z.string().min(1),
    OLLAMA_URL: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    COMFYUI_URL: process.env.COMFYUI_URL,
    OLLAMA_URL: process.env.OLLAMA_URL,
  },
});
