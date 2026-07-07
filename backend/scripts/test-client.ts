import { Job } from '../src/types.js';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const urlIndex = args.indexOf('--url');
let reelUrl = '';

if (urlIndex !== -1 && args[urlIndex + 1]) {
  reelUrl = args[urlIndex + 1];
} else if (args[0] && args[0].startsWith('http')) {
  reelUrl = args[0];
}

if (!reelUrl) {
  console.log('Usage:');
  console.log('  npm run test-client -- --url <instagram-reel-url>');
  console.log('  Or: node node_modules/tsx/dist/cli.mjs test-client.ts --url <instagram-reel-url>');
  process.exit(1);
}

const SERVER_URL = process.env.API_URL || 'http://localhost:3000';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestClient() {
  console.log(`Submitting Instagram Reel to recipe extractor API...`);
  console.log(`Target API: ${SERVER_URL}`);
  console.log(`Reel URL:   ${reelUrl}\n`);

  try {
    // 1. Submit extraction job
    const response = await fetch(`${SERVER_URL}/api/extract-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.API_KEY || '',
      },
      body: JSON.stringify({ url: reelUrl }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      throw new Error(`API error (${response.status}): ${data.error || JSON.stringify(data)}`);
    }

    const jobId = data.jobId;
    console.log(`[Job Created] ID: ${jobId}`);
    console.log(`Polling job status... (Press Ctrl+C to cancel polling)\n`);

    // 2. Poll job status
    let status = data.status;
    let job: Job | null = null;

    while (status === 'pending' || status === 'scraping' || status === 'processing') {
      await wait(3000);
      const pollResponse = await fetch(`${SERVER_URL}/api/jobs/${jobId}`, {
        headers: {
          'X-API-Key': process.env.API_KEY || '',
        },
      });
      if (!pollResponse.ok) {
        throw new Error(`Failed to poll status: HTTP ${pollResponse.status}`);
      }

      const pollData = await pollResponse.json() as any;
      job = pollData.job;
      if (!job) {
        throw new Error('Received empty job structure from API.');
      }

      if (job.status !== status) {
        status = job.status;
        console.log(`[Job Status Update] -> ${status.toUpperCase()}`);
      } else {
        console.log(`... still ${status}...`);
      }
    }

    if (!job) {
      const pollResponse = await fetch(`${SERVER_URL}/api/jobs/${jobId}`, {
        headers: {
          'X-API-Key': process.env.API_KEY || '',
        },
      });
      if (pollResponse.ok) {
        const pollData = await pollResponse.json() as any;
        job = pollData.job;
      }
    }

    if (status === 'failed') {
      console.error(`\n[Job Failed] Extraction failed: ${job?.error}`);
      process.exit(1);
    }

    if (status === 'completed' && job?.recipe) {
      const recipe = job.recipe;
      console.log('\n==================================================');
      console.log(`🎉 RECIPE EXTRACTED SUCCESSFULLY!`);
      console.log('==================================================');
      console.log(`Title:       ${recipe.title}`);
      console.log(`Description: ${recipe.description}`);
      console.log(`Prep Time:   ${recipe.prepTime} | Cook Time: ${recipe.cookTime}`);
      console.log(`Servings:    ${recipe.servings}`);
      
      console.log('\n--- INGREDIENTS ---');
      recipe.ingredients.forEach(group => {
        console.log(`[${group.name}]`);
        group.items.forEach(ing => {
          const notes = ing.notes ? ` (${ing.notes})` : '';
          console.log(`  - ${ing.amount} ${ing.unit} ${ing.name}${notes}`);
        });
      });

      console.log('\n--- INSTRUCTIONS ---');
      recipe.instructions.forEach(step => {
        console.log(`${step.step}. ${step.description}`);
      });

      if (recipe.equipment && recipe.equipment.length > 0) {
        console.log('\n--- EQUIPMENT ---');
        console.log(recipe.equipment.map(e => `- ${e}`).join('\n'));
      }

      if (recipe.nutritionalValues) {
        console.log('\n--- NUTRITIONAL INFO ---');
        console.log(`Calories: ${recipe.nutritionalValues.calories} kcal`);
        console.log(`Protein:  ${recipe.nutritionalValues.protein}`);
        console.log(`Carbs:    ${recipe.nutritionalValues.carbs}`);
        console.log(`Fat:      ${recipe.nutritionalValues.fat}`);
      }

      if (recipe.tips && recipe.tips.length > 0) {
        console.log('\n--- TIPS & TRICKS ---');
        recipe.tips.forEach(tip => console.log(`* ${tip}`));
      }

      if (recipe.alternativeIngredients && recipe.alternativeIngredients.length > 0) {
        console.log('\n--- ALTERNATIVES / SUBSTITUTIONS ---');
        recipe.alternativeIngredients.forEach(alt => {
          const notes = alt.notes ? ` (${alt.notes})` : '';
          console.log(`- Instead of "${alt.original}", use "${alt.substitute}"${notes}`);
        });
      }

      if (recipe.transcript) {
        console.log('\n--- TRANSCRIPT ---');
        console.log(recipe.transcript);
      }

      console.log('==================================================\n');
      console.log(`Full JSON response saved in sqlite/JSON local file database.`);
    }

  } catch (error: any) {
    console.error(`\n❌ Error running test client:`, error.message);
    process.exit(1);
  }
}

runTestClient();
