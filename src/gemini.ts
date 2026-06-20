import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/files';
import { config } from './config.js';
import { Recipe } from './types.js';
import { writeGeminiLog, estimateCost, type TokenUsage } from './logger.js';

// Initialize Gemini Generative AI and File Manager
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(config.GEMINI_API_KEY);

// Define response schema for Gemini Structured Outputs
const recipeSchema = {
  type: FunctionDeclarationSchemaType.OBJECT,
  properties: {
    isRecipe: { type: FunctionDeclarationSchemaType.BOOLEAN },
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
          items: {
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
        },
        required: ['name', 'items'],
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
    'isRecipe',
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
 * Uploads an audio file and optionally a grid image to the Google AI File API,
 * waits for them to become ACTIVE, prompts Gemini with the audio, caption, and grid image context,
 * and extracts a structured recipe.
 * Automatically deletes the files from Gemini storage when done.
 */
export async function extractRecipeFromAudio(
  audioFilePath: string,
  mimeType: string,
  caption: string,
  gridImagePath?: string
): Promise<Recipe> {
  if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key is not configured in environment variables.');
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  let uploadResult: any;
  let gridUploadResult: any;
  let rawOutput: string | undefined;

  try {
    // If the MIME type is video/mp4 but it's audio-only, force audio/mp4 to avoid Gemini video-processing failures
    const uploadMimeType = mimeType === 'video/mp4' ? 'audio/mp4' : mimeType;

    // 1. Upload the audio file to Google AI File API
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

    // 2b. If a grid image is provided, upload it as well
    const contentParts: any[] = [
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ];

    if (gridImagePath) {
      console.log('[extractRecipeFromAudio] Uploading grid image for recipe extraction context...');
      gridUploadResult = await fileManager.uploadFile(gridImagePath, {
        mimeType: 'image/jpeg',
        displayName: `instagram-reel-grid-${Date.now()}`,
      });
      contentParts.push({
        fileData: {
          fileUri: gridUploadResult.file.uri,
          mimeType: 'image/jpeg',
        },
      });
    }

    // 3. Request structured content from Gemini
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: recipeSchema,
      } as any,
    });

    const prompt = `You are an expert recipe extractor. Analyze the provided audio file (which is the audio track of an Instagram recipe Reel) and the reel's description (caption) below.${gridImagePath ? ' You are also given an image showing a 4x4 grid of 16 chronological frames extracted from the video to provide visual context (showing ingredients, cooking steps, and final plating).' : ''}

First, determine if this reel actually contains a food recipe. If it does NOT contain a recipe (e.g. it's just a vlog, comedy, or unrelated content), set the "isRecipe" field to false, and fill the remaining required fields with empty values (they will be ignored).
If it IS a recipe, set "isRecipe" to true and extract the recipe as normal.

Combine the${gridImagePath ? ' three' : ' two'} sources to reconstruct the complete recipe. The creator might mention specific measurements or ingredients in the audio that are missing or abbreviated in the text, and vice versa.${gridImagePath ? ' Use the visual frames in the grid to resolve ambiguities, confirm ingredients, verify cooking techniques, or see the final plated dish.' : ''} Resolve any contradictions by prioritizing the instructions that make the most logical sense culinary-wise.

Organize the ingredients into groups that correspond to supermarket departments/aisles to make shopping easier. Group related foods together based on where they are typically found in a grocery store (e.g., "Produce/Obst & Gemüse", "Meat & Poultry/Fleisch & Geflügel", "Dairy/Molkereiprodukte", "Pantry/Canned Goods/Konserven & Vorrat", "Grains & Pasta/Getreide & Nudeln", "Spices & Herbs/Gewürze & Kräuter", "Baking/Backzutaten", etc.). Translate these category names into the target language.

Also, provide an accurate transcription of the spoken audio track in the "transcript" field. If there are no spoken words in the audio track (e.g., it contains only music, sound effects, background noise, or silence), you MUST set the "transcript" field to the exact string "NO_SPOKEN_WORDS". Do NOT translate this string and do NOT under any circumstances hallucinate, invent, or generate a spoken transcript based on the caption or recipe name if no one is speaking.

Translate and write the entire final recipe output (including title, description, ingredient group names, ingredient names/notes, instruction steps, equipment list, tips, alternative ingredients names/notes, and the transcript) into the following language: ${config.RECIPE_LANGUAGE}.

Description/Caption:
"""
${caption}
"""`;

    contentParts.push(prompt);

    const result = await model.generateContent(contentParts);

    rawOutput = result.response.text();
    if (!rawOutput) {
      throw new Error('Gemini returned an empty response.');
    }

    // Parse the output schema
    const rawRecipe = JSON.parse(rawOutput);

    if (rawRecipe.isRecipe === false) {
      throw new Error('The provided video does not appear to contain a food recipe.');
    }

    const recipe: Recipe = rawRecipe;

    // Clean up transcript if there were no spoken words
    if (
      recipe.transcript === 'NO_SPOKEN_WORDS' ||
      recipe.transcript === 'Keine gesprochene Sprache' ||
      !recipe.transcript ||
      recipe.transcript.trim() === ''
    ) {
      recipe.transcript = null;
    }

    // Extract token usage and compute cost
    const usageMeta = result.response.usageMetadata;
    const tokenUsage: TokenUsage | undefined = usageMeta
      ? {
        promptTokens: usageMeta.promptTokenCount ?? 0,
        candidateTokens: usageMeta.candidatesTokenCount ?? 0,
        totalTokens: usageMeta.totalTokenCount ?? 0,
      }
      : undefined;
    const costEstimate = tokenUsage ? estimateCost(config.GEMINI_MODEL, tokenUsage) : undefined;

    await writeGeminiLog({
      timestamp,
      requestType: 'extract_recipe',
      model: config.GEMINI_MODEL,
      durationMs: Date.now() - startTime,
      success: true,
      input: {
        audioFilePath,
        uploadMimeType,
        captionLength: caption.length,
        captionPreview: caption.slice(0, 300),
        prompt,
      },
      rawOutput,
      parsedOutput: recipe,
      tokenUsage,
      costEstimate,
    });

    return recipe;
  } catch (err: any) {
    await writeGeminiLog({
      timestamp,
      requestType: 'extract_recipe',
      model: config.GEMINI_MODEL,
      durationMs: Date.now() - startTime,
      success: false,
      error: err?.message ?? String(err),
      input: {
        audioFilePath,
        mimeType,
        captionLength: caption.length,
        captionPreview: caption.slice(0, 300),
      },
      rawOutput,
    });
    throw err;
  } finally {
    // 4. Ensure cleanup of the uploaded files on Gemini servers
    if (uploadResult?.file?.name) {
      try {
        await fileManager.deleteFile(uploadResult.file.name);
      } catch (err: any) {
        console.error(`Failed to clean up file ${uploadResult.file.name} from Gemini File API:`, err.message);
      }
    }
    if (gridUploadResult?.file?.name) {
      try {
        await fileManager.deleteFile(gridUploadResult.file.name);
      } catch (err: any) {
        console.error(`Failed to clean up file ${gridUploadResult.file.name} from Gemini File API:`, err.message);
      }
    }
  }
}

/**
 * Uploads a combined tiled grid image of video frames to Gemini File API,
 * asks which shows the finished dish most appetizingly, and returns the top 5 indices.
 * The uploaded grid image is cleaned up afterwards.
 */
export async function selectBestFoodFrame(framePaths: string[], gridImagePath: string): Promise<number[]> {
  if (framePaths.length === 0) {
    return [];
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  let rawOutput: string | undefined;
  let uploadResult: any;

  try {
    // 1. Upload the grid image to Google AI File API
    console.log('[selectBestFoodFrame] Uploading grid image to Gemini File API...');
    uploadResult = await fileManager.uploadFile(gridImagePath, {
      mimeType: 'image/jpeg',
      displayName: `frames-grid-${Date.now()}.jpg`,
    });

    const model = genAI.getGenerativeModel({ model: config.GEMINI_MODEL });

    const prompt =
      `You are a food photography expert. You are given a grid containing ${framePaths.length} frames ` +
      `(numbered 0 to ${framePaths.length - 1}) from an Instagram cooking reel. ` +
      'Your task: identify the 5 frames that best show the FINISHED, fully plated or cooked dish in the most appetizing way. ' +
      'Prefer frames where the food fills most of the image. Ignore frames that only show the cook/presenter, raw ingredients, text overlays, or partial preparation steps. ' +
      `Respond with ONLY a comma-separated list of the 5 best frame indices, ordered from absolute best to worst (e.g. "14, 12, 15, 8, 2"). ` +
      'The FIRST index MUST be the absolute best representative of the final dish. No explanation.';

    console.log('[selectBestFoodFrame] Requesting best frames from Gemini...');
    const result = await model.generateContent([
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: 'image/jpeg',
        },
      },
      prompt,
    ]);

    rawOutput = result.response.text().trim();

    let indices = rawOutput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n < framePaths.length);

    // Extract token usage and compute cost
    const usageMeta = result.response.usageMetadata;
    const tokenUsage: TokenUsage | undefined = usageMeta
      ? {
        promptTokens: usageMeta.promptTokenCount ?? 0,
        candidateTokens: usageMeta.candidatesTokenCount ?? 0,
        totalTokens: usageMeta.totalTokenCount ?? 0,
      }
      : undefined;
    const costEstimate = tokenUsage ? estimateCost(config.GEMINI_MODEL, tokenUsage) : undefined;

    if (indices.length === 0) {
      console.warn(`[selectBestFoodFrame] Unexpected response "${rawOutput}", defaulting to last frame`);

      await writeGeminiLog({
        timestamp,
        requestType: 'select_best_frame',
        model: config.GEMINI_MODEL,
        durationMs: Date.now() - startTime,
        success: false,
        error: `Unexpected index response: "${rawOutput}"`,
        input: { frameCount: framePaths.length, framePaths, prompt },
        rawOutput,
        parsedOutput: { selectedIndices: [framePaths.length - 1], fallback: true },
        tokenUsage,
        costEstimate,
      });

      return [framePaths.length - 1]; // fallback
    }

    await writeGeminiLog({
      timestamp,
      requestType: 'select_best_frame',
      model: config.GEMINI_MODEL,
      durationMs: Date.now() - startTime,
      success: true,
      input: { frameCount: framePaths.length, framePaths, prompt },
      rawOutput,
      parsedOutput: { selectedIndices: indices },
      tokenUsage,
      costEstimate,
    });

    // Ensure we don't return more than 5
    return indices.slice(0, 5);
  } catch (err: any) {
    await writeGeminiLog({
      timestamp,
      requestType: 'select_best_frame',
      model: config.GEMINI_MODEL,
      durationMs: Date.now() - startTime,
      success: false,
      error: err?.message ?? String(err),
      input: { frameCount: framePaths.length, framePaths },
      rawOutput,
    });
    throw err;
  } finally {
    // Clean up uploaded grid image from Gemini File API
    if (uploadResult?.file?.name) {
      try {
        await fileManager.deleteFile(uploadResult.file.name);
      } catch (err: any) {
        console.error(`Failed to clean up file ${uploadResult.file.name} from Gemini File API:`, err.message);
      }
    }
  }
}
