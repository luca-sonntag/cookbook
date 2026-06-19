import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/files';
import { config } from './config.js';
import { Recipe } from './types.js';

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
    // 1. Upload the file to Google AI File API
    uploadResult = await fileManager.uploadFile(audioFilePath, {
      mimeType,
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
