import { env } from "./env";

// Définition du Workflow (constante pour éviter de recréer l'objet à chaque fois)
const WORKFLOW_BASE = {
  "13": {
    inputs: { ckpt_name: "pixelArtDiffusionXL.safetensors" },
    class_type: "CheckpointLoaderSimple",
  },
  "14": {
    inputs: { text: "", clip: ["13", 1] },
    class_type: "CLIPTextEncode",
  },
  "15": {
    inputs: {
      seed: 0,
      steps: 20,
      cfg: 8,
      sampler_name: "euler",
      scheduler: "simple",
      denoise: 1,
      model: ["13", 0],
      positive: ["14", 0],
      negative: ["21", 0],
      latent_image: ["20", 0],
    },
    class_type: "KSampler",
  },
  "16": {
    inputs: { samples: ["15", 0], vae: ["13", 2] },
    class_type: "VAEDecode",
  },
  "17": {
    inputs: { model: "u2net: general purpose", providers: "CPU" },
    class_type: "RemBGSession+",
  },
  "18": {
    inputs: { rembg_session: ["17", 0], image: ["16", 0] },
    class_type: "ImageRemoveBackground+",
  },
  "19": {
    inputs: { filename_prefix: "Browser_Output", images: ["16", 0] },
    class_type: "SaveImage",
  },
  "20": {
    inputs: { width: 1024, height: 1024, batch_size: 1 },
    class_type: "EmptyLatentImage",
  },
  "21": {
    inputs: {
      text: "blur, fuzzy, anti-aliasing, photographic, realistic, vector, svg, low quality, jpeg artifacts, cropped, out of frame, cut off, duplicate, multiple, army, crowd, extra limbs, deformed, glitch, shadow, drop shadow, text, watermark, signature, bad anatomy, disfigured, messy, noise, complex background, gradient",
      clip: ["13", 1],
    },
    class_type: "CLIPTextEncode",
  },
};

/**
 * Génère une image via ComfyUI avec gestion des dimensions.
 * @param prompt La description de l'image
 * @param width Largeur (défaut: 1024)
 * @param height Hauteur (défaut: 1024)
 * @param transparent Si vrai, active le détourage
 */
export async function generateImage(prompt: string, width: number = 1024, height: number = 1024, transparent: boolean = false): Promise<string> {
  if (!prompt) throw new Error("Le prompt est vide");

  // 1. Copie profonde du workflow pour ne pas modifier l'original
  const workflow = JSON.parse(JSON.stringify(WORKFLOW_BASE));

  // --- CHANGEMENT ICI : Injection des dimensions (Node 20) ---
  workflow["20"].inputs.width = width;
  workflow["20"].inputs.height = height;

  // 2. Injection des paramètres
  // Node 14: Prompt positif
  workflow["14"].inputs.text = prompt + (transparent ? ", white background" : "");

  // Node 15: Seed aléatoire
  workflow["15"].inputs.seed = Math.floor(Math.random() * 1_000_000_000);

  // 3. Logique de branchement (Switch)
  if (transparent) {
    // Save -> RemBg
    workflow["19"].inputs.images = ["18", 0];
  } else {
    // Save -> VAE Decode (Comportement par défaut)
    workflow["19"].inputs.images = ["16", 0];
  }

  try {
    // 4. Envoi de la requête à ComfyUI
    const response = await fetch(`${env.COMFYUI_URL}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
      cache: "no-store", // Important pour Next.js
    });

    if (!response.ok) {
      throw new Error(`Erreur ComfyUI: ${response.statusText}`);
    }

    const data = await response.json();
    const promptId = data.prompt_id;

    // 5. Attente du résultat (Polling)
    return await waitForImage(promptId);
  } catch (error) {
    console.error("Erreur lors de la génération:", error);
    throw error;
  }
}

async function waitForImage(promptId: string): Promise<string> {
  let isFinished = false;

  while (!isFinished) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause 1s

    try {
      const historyRes = await fetch(`${env.COMFYUI_URL}/history/${promptId}`, { cache: "no-store" });
      const historyData = await historyRes.json();

      // Si l'ID existe dans l'historique, c'est fini
      if (historyData[promptId]) {
        isFinished = true;

        // Récupération des infos de l'image (Node 19 est notre SaveImage)
        const outputs = historyData[promptId].outputs["19"].images;
        if (!outputs || outputs.length === 0) {
          throw new Error("Aucune image de sortie trouvée dans le node 19");
        }

        const img = outputs[0];
        // Construction de l'URL
        return `${env.COMFYUI_URL}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
      }
    } catch (e) {
      // On continue d'attendre si l'API history échoue momentanément
      console.warn("Waiting for history...", e);
    }
  }

  throw new Error("Timeout: La génération a pris trop de temps.");
}
