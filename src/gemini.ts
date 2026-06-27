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
    isRecipe: {
      type: FunctionDeclarationSchemaType.BOOLEAN,
      description: 'Whether the source content contains a food recipe. Set to false if it is unrelated content (e.g. vlog, comedy).',
    },
    title: {
      type: FunctionDeclarationSchemaType.STRING,
      description: 'The title of the recipe.',
    },
    description: {
      type: FunctionDeclarationSchemaType.STRING,
      description: 'A brief description or summary of the recipe.',
    },
    prepTime: {
      type: FunctionDeclarationSchemaType.INTEGER,
      description: 'Preparation time in minutes.',
    },
    cookTime: {
      type: FunctionDeclarationSchemaType.INTEGER,
      description: 'Cooking time in minutes.',
    },
    servings: {
      type: FunctionDeclarationSchemaType.INTEGER,
      description: 'Number of servings or portions.',
    },
    ingredients: {
      type: FunctionDeclarationSchemaType.ARRAY,
      description: 'List of ingredient groups categorized by supermarket department.',
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          name: {
            type: FunctionDeclarationSchemaType.STRING,
            description: 'The uppercase category key for the supermarket department.',
            enum: [
              'PRODUCE',
              'BAKERY',
              'MEAT_POULTRY',
              'SEAFOOD',
              'DAIRY_EGGS',
              'PANTRY',
              'GRAINS_PASTA',
              'SPICES_HERBS',
              'BAKING',
              'CONDIMENTS_OILS',
              'FROZEN',
              'BEVERAGES',
              'OTHER'
            ]
          },
          items: {
            type: FunctionDeclarationSchemaType.ARRAY,
            description: 'Individual ingredients in this category.',
            items: {
              type: FunctionDeclarationSchemaType.OBJECT,
              properties: {
                name: {
                  type: FunctionDeclarationSchemaType.STRING,
                  description: 'The clean name of the ingredient, completely stripped of quantities, numbers, units, and modifiers/specifications/processing states (e.g. use "Frischkäse" instead of "Leichter Frischkäse", "Butter" instead of "Leichte Butter", "Parmesan" instead of "Parmesan, gerieben", "Hähnchenschenkel" instead of "Hähnchenschenkel, gewürfelt"). Adjectives/specifications/states like "leicht", "mager", "gerieben", "gewürfelt", "ohne Knochen" MUST be moved to the "modifier" field. If a composite element is prepared during the recipe, list its raw ingredients individually.',
                },
                baseName: {
                  type: FunctionDeclarationSchemaType.STRING,
                  description: 'The core standard noun in singular form used as a database key to group similar ingredients (e.g. if name is "rote Zwiebeln", baseName is "Zwiebel").',
                },
                replacedOriginal: {
                  type: FunctionDeclarationSchemaType.STRING,
                  description: 'If you replaced an ingredient from the original recipe during a remix, provide the original ingredient name here so it can be crossed out.',
                },
                amount: {
                  type: FunctionDeclarationSchemaType.NUMBER,
                  description: 'The numeric quantity of the ingredient.',
                },
                unit: {
                  type: FunctionDeclarationSchemaType.STRING,
                  description: 'The unit of measurement (e.g., g, ml, EL, TL, Stück).',
                },
                notes: {
                  type: FunctionDeclarationSchemaType.STRING,
                  description: 'Optional preparation notes specific to this ingredient.',
                },
                modifier: {
                  type: FunctionDeclarationSchemaType.STRING,
                  description: 'Optional specification, adjective, attribute, or processing state of the ingredient (e.g. "leicht", "mager", "gerieben", "gewürfelt", "ohne Knochen und Haut"). Keep it clean and short, in the recipe language.',
                },
                calories: {
                  type: FunctionDeclarationSchemaType.INTEGER,
                  description: 'Estimated calories in kcal for the specified ingredient amount. Use 0 if negligible.',
                },
                protein: {
                  type: FunctionDeclarationSchemaType.NUMBER,
                  description: 'Estimated protein in grams for the specified ingredient amount. Use 0 if negligible.',
                },
                carbs: {
                  type: FunctionDeclarationSchemaType.NUMBER,
                  description: 'Estimated carbohydrates in grams for the specified ingredient amount. Use 0 if negligible.',
                },
                fat: {
                  type: FunctionDeclarationSchemaType.NUMBER,
                  description: 'Estimated fat in grams for the specified ingredient amount. Use 0 if negligible.',
                },
              },
              required: ['name', 'baseName', 'amount', 'unit', 'calories', 'protein', 'carbs', 'fat'],
            },
          },
        },
        required: ['name', 'items'],
      },
    },
    instructions: {
      type: FunctionDeclarationSchemaType.ARRAY,
      description: 'Chronological list of step-by-step instructions.',
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          step: {
            type: FunctionDeclarationSchemaType.INTEGER,
            description: 'Chronological step number, starting from 1.',
          },
          description: {
            type: FunctionDeclarationSchemaType.STRING,
            description: 'The detailed description of the instruction step.',
          },
        },
        required: ['step', 'description'],
      },
    },
    equipment: {
      type: FunctionDeclarationSchemaType.ARRAY,
      description: 'List of kitchen tools or equipment needed.',
      items: { type: FunctionDeclarationSchemaType.STRING },
    },
    nutritionalValues: {
      type: FunctionDeclarationSchemaType.OBJECT,
      description: 'Nutritional values per single serving/portion. Only populated if hasExplicitNutritionalValues is true. If the source specifies overall/total nutritional values for the entire recipe, you MUST divide them by the number of servings/portions to get the values per single serving.',
      properties: {
        calories: {
          type: FunctionDeclarationSchemaType.INTEGER,
          description: 'Calories in kcal per single serving.',
        },
        protein: {
          type: FunctionDeclarationSchemaType.NUMBER,
          description: 'Protein in grams per single serving.',
        },
        carbs: {
          type: FunctionDeclarationSchemaType.NUMBER,
          description: 'Carbohydrates in grams per single serving.',
        },
        fat: {
          type: FunctionDeclarationSchemaType.NUMBER,
          description: 'Fat in grams per single serving.',
        },
      },
    },
    tips: {
      type: FunctionDeclarationSchemaType.ARRAY,
      description: 'Additional cooking tips or suggestions.',
      items: { type: FunctionDeclarationSchemaType.STRING },
    },
    alternativeIngredients: {
      type: FunctionDeclarationSchemaType.ARRAY,
      description: 'List of potential ingredient substitutions.',
      items: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: {
          original: {
            type: FunctionDeclarationSchemaType.STRING,
            description: 'The original ingredient name.',
          },
          substitute: {
            type: FunctionDeclarationSchemaType.STRING,
            description: 'The substitute ingredient name.',
          },
          notes: {
            type: FunctionDeclarationSchemaType.STRING,
            description: 'Optional notes on the substitution.',
          },
        },
        required: ['original', 'substitute'],
      },
    },
    hasExplicitNutritionalValues: {
      type: FunctionDeclarationSchemaType.BOOLEAN,
      description: 'True ONLY if the overall recipe nutritional values are explicitly stated in the source text or audio.',
    },
    transcript: {
      type: FunctionDeclarationSchemaType.STRING,
      description: 'Accurate transcription of the spoken audio track. If there are no spoken words in the audio track, you MUST write "NO_SPOKEN_WORDS". Do NOT translate this string and do NOT under any circumstances hallucinate.',
    },
    tags: {
      type: FunctionDeclarationSchemaType.ARRAY,
      description: '1-2 relevant, concise tags (e.g. "Vegan", "High-Protein"). Exclude time-based tags.',
      items: { type: FunctionDeclarationSchemaType.STRING },
    },
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
    'hasExplicitNutritionalValues',
    'transcript',
    'tags',
  ],
};

interface UserPreferences {
  recipeLanguage?: string;
  preferredTemperatureUnit?: string;
  preferredUnitSystem?: string;
}

const CLEAN_INGREDIENT_NAMES_INSTRUCTION = 'Ensure the "name" field contains only the clean ingredient name (e.g., "Frischkäse", "evaporated milk", "cream cheese", "butter"). Move all adjectives, processing states, or descriptions (such as "light", "mager", "low fat", "leichte", "gerieben", "grated") into the "modifier" field. Do NOT leave these descriptors inside the "name" field.';

const CATEGORY_ORDERING_INSTRUCTION = 'Always place "PRODUCE" first in the ingredients array, followed by dry goods/pantry items, then refrigerated products/meats, and finally other/extras at the very end.';

const INGREDIENT_DECOMPOSITION_INSTRUCTION = 'If a composite element or homemade component (like a custom sauce or pesto) is prepared during the recipe, you MUST list its raw ingredients individually instead of the finished compound product.';

function getPromptUnitInstructions(userPrefs?: UserPreferences) {
  const targetTempUnit = userPrefs?.preferredTemperatureUnit || config.PREFERRED_TEMPERATURE_UNIT;
  const targetUnitSystem = userPrefs?.preferredUnitSystem || config.PREFERRED_UNIT_SYSTEM;
  const targetLanguage = userPrefs?.recipeLanguage || config.RECIPE_LANGUAGE;

  const tempInstruction = targetTempUnit.toLowerCase() === 'both'
    ? 'Format all temperature values mentioned in the instructions, description, tips, or title using both Celsius and Fahrenheit (e.g., "200°C (400°F)").'
    : `Format all temperature values mentioned in the instructions, description, tips, or title using the preferred unit: ${targetTempUnit} (e.g., convert and format as "200°C" or "400°F" depending on preference).`;

  const unitSystemInstruction = `Format all ingredient weights, volumes, and measurements using the preferred unit system: ${targetUnitSystem} (e.g., metric units like grams, milliliters, kilograms, or imperial units like ounces, cups, pounds, fluid ounces) and perform conversions where appropriate.`;

  const languageInstruction = `Write and translate all text values (including title, description, ingredient names/notes, instruction steps, equipment list, tips, alternative ingredient details, and tags) into: ${targetLanguage}. Keep the category keys as the uppercase English enum values. Follow the schema strictly.`;

  return {
    targetLanguage,
    tempInstruction,
    unitSystemInstruction,
    languageInstruction,
  };
}

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
  gridImagePath?: string,
  logDir?: string,
  userPrefs?: UserPreferences
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
        temperature: config.GEMINI_TEMPERATURE,
      } as any,
    });

    const { targetLanguage, tempInstruction, unitSystemInstruction, languageInstruction } = getPromptUnitInstructions(userPrefs);

    const prompt = `You are an expert recipe extractor. Analyze the provided audio file (which is the audio track of an Instagram recipe Reel) and the reel's description (caption) below.${gridImagePath ? ' You are also given an image showing a 4x4 grid of 16 chronological frames extracted from the video to provide visual context (showing ingredients, cooking steps, and final plating).' : ''}

Combine the${gridImagePath ? ' three' : ' two'} sources to reconstruct the complete recipe, resolving any contradictions culinary-wise. Ensure to follow the field-level guidelines specified in the descriptions of the output schema.

Key Constraints:
1. Category Ordering: ${CATEGORY_ORDERING_INSTRUCTION}
2. Translation: ${languageInstruction}
3. Preferred Units:
   - Temperature Units: ${tempInstruction}
   - Weight & Volume Units: ${unitSystemInstruction}
4. Missing Data & Nutrition: If any information for a specific field is missing, leave it empty (empty string "", null, or empty array []). You MUST set "hasExplicitNutritionalValues" to true ONLY IF the recipe nutritional values are explicitly stated in the source text or audio. If they are not, set it to false and set "nutritionalValues" to null (do NOT estimate or calculate overall nutritional values at the recipe level). Note that "nutritionalValues" MUST represent values per single serving/portion. If the source lists total values for the entire recipe, divide them by the number of servings/portions first.
5. Clean Ingredient Names: ${CLEAN_INGREDIENT_NAMES_INSTRUCTION}
6. Ingredient Decomposition: ${INGREDIENT_DECOMPOSITION_INSTRUCTION}

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

    // Conditionally clear nutritionalValues if the model indicated they weren't explicitly provided
    if (rawRecipe.hasExplicitNutritionalValues === false) {
      delete recipe.nutritionalValues;
    }
    delete (recipe as any).hasExplicitNutritionalValues;

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
      logDir,
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
      logDir,
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
export async function selectBestFoodFrame(framePaths: string[], gridImagePath: string, logDir?: string): Promise<number[]> {
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

    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        temperature: config.GEMINI_TEMPERATURE,
      },
    });

    const prompt =
      `You are a food photography expert. You are given a grid containing ${framePaths.length} frames ` +
      `(numbered 0 to ${framePaths.length - 1}) from an Instagram cooking reel. ` +
      'Your task: identify the best frames to document the recipe. ' +
      '1. The FIRST frame you select MUST be the absolute best shot of the FINISHED, fully plated or cooked dish in the most appetizing way. ' +
      '2. Then, select between 2 to 8 additional frames that show important, distinct chronological steps of the preparation/cooking process. ' +
      'Only select frames that are sharp, clear, in-focus, and where the subject fills most of the image. Strictly exclude any blurry, shaky, or out-of-focus frames. Do not select redundant frames. ' +
      `Respond with ONLY a comma-separated list of the selected frame indices (e.g. "14, 2, 5, 8, 11"). No explanation.`;

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
        logDir,
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
      logDir,
    });

    // Ensure we don't return an absurd amount, but allow up to 10
    return indices.slice(0, 10);
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
      logDir,
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

/**
 * Takes an existing recipe and a user prompt, and asks Gemini to remix the recipe.
 */
export async function remixRecipe(
  parentRecipe: Recipe,
  remixPrompt: string,
  logDir?: string,
  userPrefs?: UserPreferences
): Promise<Recipe> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  let rawOutput: string | undefined;

  try {
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: recipeSchema,
        temperature: config.GEMINI_TEMPERATURE,
      } as any,
    });

    const { targetLanguage, tempInstruction, unitSystemInstruction, languageInstruction } = getPromptUnitInstructions(userPrefs);

    const prompt = `You are a creative professional chef. You are provided with an existing recipe in JSON format and a user's request for how to modify (remix) it (e.g. "make it vegan", "low calorie", or custom instructions).
Your task is to modify the recipe logically and culinarily correctly based on the request.

Important Constraints:
1. Ingredient Replacement & Stability: If you swap or modify the name of any ingredient (e.g., beef -> tofu, or butter -> light butter), you MUST set the "replacedOriginal" field on the new ingredient to the exact name of the original ingredient that was removed or renamed (e.g., "replacedOriginal": "Rinderhackfleisch" or "Butter"). All other ingredients that are NOT swapped or renamed MUST keep their exact original names from the original recipe JSON; do NOT alter the names of unchanged ingredients without setting "replacedOriginal".
2. Instruction Update: If you change ingredients, you MUST update the cooking instructions to match the new ingredients (e.g., cooking time for tofu is different from beef).
3. Title Update: Modify the title of the recipe to reflect the changes (e.g. add "(Vegan Remix)").
4. Language & Format: ${languageInstruction}
5. Preferred Units:
   - Temperature Units: ${tempInstruction}
   - Weight & Volume Units: ${unitSystemInstruction}
6. Clean Ingredient Names: ${CLEAN_INGREDIENT_NAMES_INSTRUCTION}
7. Category Ordering: ${CATEGORY_ORDERING_INSTRUCTION}
8. Ingredient Decomposition: ${INGREDIENT_DECOMPOSITION_INSTRUCTION}
9. Nutritional Values Recalculation: For any added, modified, or swapped ingredients, you MUST update their individual nutritional values (calories, protein, carbs, fat) based on the new ingredient and its amount (use standard estimates). If the original recipe had explicit recipe-level nutritional values (hasExplicitNutritionalValues is true), you MUST recalculate and update the overall recipe-level nutritionalValues per single serving to reflect the remixed ingredients.

User's Remix Request:
"${remixPrompt}"

Original Recipe JSON:
${JSON.stringify(parentRecipe, null, 2)}`;

    const result = await model.generateContent([prompt]);
    rawOutput = result.response.text();
    if (!rawOutput) {
      throw new Error('Gemini returned an empty response.');
    }

    const rawRecipe = JSON.parse(rawOutput);
    const recipe: Recipe = rawRecipe;

    if (rawRecipe.hasExplicitNutritionalValues === false) {
      delete recipe.nutritionalValues;
    }
    delete (recipe as any).hasExplicitNutritionalValues;

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
      requestType: 'remix_recipe',
      model: config.GEMINI_MODEL,
      durationMs: Date.now() - startTime,
      success: true,
      input: {
        remixPrompt,
        parentRecipeId: parentRecipe.id,
      },
      rawOutput,
      parsedOutput: recipe,
      tokenUsage,
      costEstimate,
      logDir,
    });

    return recipe;
  } catch (err: any) {
    await writeGeminiLog({
      timestamp,
      requestType: 'remix_recipe',
      model: config.GEMINI_MODEL,
      durationMs: Date.now() - startTime,
      success: false,
      error: err?.message ?? String(err),
      input: {
        remixPrompt,
        parentRecipeId: parentRecipe.id,
      },
      rawOutput,
      logDir,
    });
    throw err;
  }
}
