import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/files';
import { config } from './config.js';
import { Recipe } from './types.js';
import fs from 'fs/promises';

// Initialize Gemini Generative AI and File Manager
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(config.GEMINI_API_KEY);

// Define response schema for Gemini Structured Outputs
const recipeSchema = {
  type: FunctionDeclarationSchemaType.OBJECT,
  properties: {
    title: { type: FunctionDeclarationSchemaType.STRING },
    description: { type: FunctionDeclarationSchemaType.STRING },
    prepTime: { type: FunctionDeclarationSchemaType.STRING },
    cookTime: { type: FunctionDeclarationSchemaType.STRING },
    servings: { type: FunctionDeclarationSchemaType.INTEGER },
    ingredients: {
      type: FunctionDeclarationSchemaType.ARRAY,
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          name: { type: FunctionDeclarationSchemaType.STRING },
          amount: { type: FunctionDeclarationSchemaType.NUMBER },
          unit: { type: FunctionDeclarationSchemaType.STRING },
          notes: { type: FunctionDeclarationSchemaType.STRING },
        },
        required: ['name', 'amount', 'unit'],
      },
    },
    instructions: {
      type: FunctionDeclarationSchemaType.ARRAY,
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          step: { type: FunctionDeclarationSchemaType.INTEGER },
          description: { type: FunctionDeclarationSchemaType.STRING },
        },
        required: ['step', 'description'],
      },
    },
    equipment: {
      type: FunctionDeclarationSchemaType.ARRAY,
      items: { type: FunctionDeclarationSchemaType.STRING },
    },
    nutritionalEstimates: {
      type: FunctionDeclarationSchemaType.OBJECT,
      properties: {
        calories: { type: FunctionDeclarationSchemaType.INTEGER },
        protein: { type: FunctionDeclarationSchemaType.STRING },
        carbs: { type: FunctionDeclarationSchemaType.STRING },
        fat: { type: FunctionDeclarationSchemaType.STRING },
      },
      required: ['calories', 'protein', 'carbs', 'fat'],
    },
    tips: {
      type: FunctionDeclarationSchemaType.ARRAY,
      items: { type: FunctionDeclarationSchemaType.STRING },
    },
    alternativeIngredients: {
      type: FunctionDeclarationSchemaType.ARRAY,
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          original: { type: FunctionDeclarationSchemaType.STRING },
          substitute: { type: FunctionDeclarationSchemaType.STRING },
          notes: { type: FunctionDeclarationSchemaType.STRING },
        },
        required: ['original', 'substitute'],
      },
    },
    transcript: { type: FunctionDeclarationSchemaType.STRING },
  },
  required: [
    'title',
    'description',
    'prepTime',
    'cookTime',
    'servings',
    'ingredients',
    'instructions',
    'equipment',
    'transcript',
  ],
};

/**
 * Uploads an audio file to the Google AI File API, waits for it to become ACTIVE,
 * prompts Gemini 1.5 with the audio and caption, and extracts a structured recipe.
 * Automatically deletes the file from Gemini storage when done.
 */
export async function extractRecipeFromAudio(
  audioFilePath: string,
  mimeType: string,
  caption: string
): Promise<Recipe> {
  if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key is not configured in environment variables.');
  }

  let uploadResult: any;

  try {
    // If the MIME type is video/mp4 but it's audio-only, force audio/mp4 to avoid Gemini video-processing failures
    const uploadMimeType = mimeType === 'video/mp4' ? 'audio/mp4' : mimeType;

    // 1. Upload the file to Google AI File API
    uploadResult = await fileManager.uploadFile(audioFilePath, {
      mimeType: uploadMimeType,
      displayName: `instagram-reel-audio-${Date.now()}`,
    });

    // 2. Poll for file state to become ACTIVE
    let file = await fileManager.getFile(uploadResult.file.name);
    let attempts = 0;
    while (file.state === 'PROCESSING') {
      attempts++;
      if (attempts > 30) {
        throw new Error('Timeout waiting for audio file to process on Google AI File API.');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state !== 'ACTIVE') {
      throw new Error(`Google AI File API processing failed with state: ${file.state}`);
    }

    // 3. Request structured content from Gemini
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: recipeSchema,
      } as any,
    });

    const prompt = `You are an expert recipe extractor. Analyze the provided audio file (which is the audio track of an Instagram recipe Reel) and the reel's description (caption) below.
    
Combine the two sources to reconstruct the complete recipe. The creator might mention specific measurements or ingredients in the audio that are missing or abbreviated in the text, and vice versa. Resolve any contradictions by prioritizing the instructions that make the most logical sense culinary-wise.

Also, provide an accurate transcription of the spoken audio track in the "transcript" field. If there are no spoken words in the audio track (e.g., it contains only music, sound effects, background noise, or silence), you MUST set the "transcript" field to the exact string "NO_SPOKEN_WORDS". Do NOT translate this string and do NOT under any circumstances hallucinate, invent, or generate a spoken transcript based on the caption or recipe name if no one is speaking.

Translate and write the entire final recipe output (including title, description, ingredient names/notes, instruction steps, equipment list, tips, alternative ingredients names/notes, and the transcript) into the following language: ${config.RECIPE_LANGUAGE}.

Description/Caption:
"""
${caption}
"""`;

    const result = await model.generateContent([
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error('Gemini returned an empty response.');
    }

    // Parse the output schema
    const recipe: Recipe = JSON.parse(responseText);

    // Clean up transcript if there were no spoken words
    if (
      recipe.transcript === 'NO_SPOKEN_WORDS' ||
      recipe.transcript === 'Keine gesprochene Sprache' ||
      !recipe.transcript ||
      recipe.transcript.trim() === ''
    ) {
      recipe.transcript = null;
    }

    return recipe;
  } finally {
    // 4. Ensure cleanup of the uploaded file on Gemini servers
    if (uploadResult?.file?.name) {
      try {
        await fileManager.deleteFile(uploadResult.file.name);
      } catch (err: any) {
        console.error(`Failed to clean up file ${uploadResult.file.name} from Gemini File API:`, err.message);
      }
    }
  }
}

/**
 * Uploads video frames to Gemini File API, asks which shows the finished dish
 * most appetizingly, and returns the index of the best frame.
 * All uploaded files are cleaned up afterwards.
 */
export async function selectBestFoodFrame(framePaths: string[]): Promise<number> {
  const uploadedFileNames: string[] = [];

  try {
    // Upload all frames in parallel
    const uploads = await Promise.all(
      framePaths.map(async (framePath, i) => {
        const data = await fs.readFile(framePath);
        const result = await fileManager.uploadFile(framePath, {
          mimeType: 'image/jpeg',
          displayName: `frame-${i}.jpg`,
        });
        uploadedFileNames.push(result.file.name);
        return result;
      })
    );

    // Build multimodal prompt parts: all images + question
    const imageParts = uploads.map((upload) => ({
      fileData: {
        fileUri: upload.file.uri,
        mimeType: 'image/jpeg' as const,
      },
    }));

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

    const prompt =
      `You are a food photography expert. You are given ${framePaths.length} frames (numbered 0 to ${
        framePaths.length - 1
      }) from an Instagram cooking reel. ` +
      'Your task: identify which single frame best shows the FINISHED, fully plated or cooked dish in the most appetizing way. ' +
      'Prefer frames where the food fills most of the image. Ignore frames that only show the cook/presenter, raw ingredients, text overlays, or partial preparation steps. ' +
      'Respond with ONLY the integer index of the best frame (e.g. "3"). No explanation.';

    const result = await model.generateContent([...imageParts, prompt]);
    const text = result.response.text().trim();
    const index = parseInt(text, 10);

    if (isNaN(index) || index < 0 || index >= framePaths.length) {
      console.warn(`[selectBestFoodFrame] Unexpected response "${text}", defaulting to last frame`);
      return framePaths.length - 1; // last frame is often the finished dish
    }

    return index;
  } finally {
    // Cleanup all uploaded frames from Gemini File API
    await Promise.allSettled(
      uploadedFileNames.map((name) => fileManager.deleteFile(name))
    );
  }
}
