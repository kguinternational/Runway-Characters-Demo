"use server";

import Runway, { TaskFailedError } from "@runwayml/sdk";

let runwayClient: Runway | null = null;

function getRunwayClient() {
  if (!runwayClient) {
    const apiKey = process.env.RUNWAYML_API_SECRET;
    if (!apiKey) {
      throw new Error(
        "Runway API Key is missing. Please add RUNWAYML_API_SECRET to your .env.local file to use the video generation features."
      );
    }
    runwayClient = new Runway({ apiKey });
  }
  return runwayClient;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  taskDetails?: any;
}

/**
 * Generates a promotional video of the Forum Buildings using Runway's gen4.5 model.
 * Supports both text-to-video and image-to-video (using base64 data URIs).
 */
export async function generatePromoVideo(
  promptText: string,
  imageBase64?: string
): Promise<VideoGenerationResult> {
  const hasKey = !!process.env.RUNWAYML_API_SECRET;

  if (!hasKey) {
    // In Demo/Mock mode, return a preset architectural render video placeholder
    console.log("[MOCK RUNWAY] Generating promo video for prompt: ", promptText);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate generation latency
    return {
      success: true,
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-buildings-architectural-shot-44026-large.mp4",
    };
  }

  try {
    const client = getRunwayClient();
    
    // Prepare creation options
    const options: any = {
      model: "gen4.5",
      promptText: promptText,
      ratio: "1280:720",
      duration: 5,
    };

    if (imageBase64) {
      // Ensure base64 prefix is correct
      options.promptImage = imageBase64.startsWith("data:") 
        ? imageBase64 
        : `data:image/png;base64,${imageBase64}`;
    }

    console.log("[RUNWAY] Creating video generation task...", options);
    const task = await client.imageToVideo.create(options).waitForTaskOutput();
    
    console.log("[RUNWAY] Video generation complete:", task);
    return {
      success: true,
      videoUrl: Array.isArray(task.output) ? task.output[0] : (task.output as any),
      taskDetails: task,
    };
  } catch (error) {
    console.error("[RUNWAY] Error generating video:", error);
    if (error instanceof TaskFailedError) {
      return {
        success: false,
        error: "The video failed to generate.",
        taskDetails: error.taskDetails,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
