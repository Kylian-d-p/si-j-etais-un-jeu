import { env } from "./env";

const LEONARDO_API_URL = "https://cloud.leonardo.ai/api/rest/v1";
const MODEL_ID = "1e60896f-3c26-4296-8ecc-53e2afecc132";
const ELEMENT_AKUUID = "5f3e58d8-7af3-4d5b-92e3-a3d04b9a3414";

interface LeonardoGenerationResponse {
  sdGenerationJob: {
    generationId: string;
  };
}

interface LeonardoGenerationResult {
  generations_by_pk: {
    status: string;
    generated_images: Array<{
      url: string;
      id: string;
    }>;
  };
}

/**
 * Génère une image via Leonardo AI avec gestion des dimensions.
 * @param prompt La description de l'image
 * @param width Largeur (défaut: 1024)
 * @param height Hauteur (défaut: 1024)
 * @param transparent Si vrai, active le détourage (foreground_only)
 */
export async function generateImage(prompt: string, width: number = 1024, height: number = 1024, transparent: boolean = false): Promise<string> {
  if (!prompt) throw new Error("Le prompt est vide");

  // Construction du body de la requête
  const body: Record<string, unknown> = {
    alchemy: false,
    prompt,
    width,
    height,
    num_images: 1,
    modelId: MODEL_ID,
    elements: [
      {
        akUUID: ELEMENT_AKUUID,
        weight: 0.5,
      },
    ],
  };

  // Ajouter la transparence si demandée
  if (transparent) {
    body.transparency = "foreground_only";
  }

  try {
    // 1. Lancer la génération
    const response = await fetch(`${LEONARDO_API_URL}/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LEONARDO_API_KEY}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Leonardo API: ${response.status} - ${errorText}`);
    }

    const data: LeonardoGenerationResponse = await response.json();
    const generationId = data.sdGenerationJob.generationId;

    // 2. Attente du résultat (Polling)
    return await waitForGeneration(generationId);
  } catch (error) {
    console.error("Erreur lors de la génération:", error);
    throw error;
  }
}

/**
 * Polling pour attendre que la génération soit terminée
 */
async function waitForGeneration(generationId: string): Promise<string> {
  const maxAttempts = 60; // 60 secondes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause 1s
    attempts++;

    try {
      const response = await fetch(`${LEONARDO_API_URL}/generations/${generationId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.LEONARDO_API_KEY}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.warn(`Polling attempt ${attempts}: ${response.status}`);
        continue;
      }

      const data: LeonardoGenerationResult = await response.json();
      const generation = data.generations_by_pk;

      if (generation.status === "COMPLETE") {
        if (!generation.generated_images || generation.generated_images.length === 0) {
          throw new Error("Aucune image générée");
        }
        return generation.generated_images[0].url;
      }

      if (generation.status === "FAILED") {
        throw new Error("La génération a échoué");
      }

      // Status PENDING ou autre, on continue d'attendre
    } catch (e) {
      console.warn(`Polling attempt ${attempts} failed:`, e);
    }
  }

  throw new Error("Timeout: La génération a pris trop de temps.");
}
