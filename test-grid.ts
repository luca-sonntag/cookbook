import { createImageGrid } from './src/frameExtractor.js';
import fs from 'fs/promises';
import path from 'path';

async function runGridTest() {
  const logsDir = path.resolve('logs');
  console.log(`Searching for extracted frames in run folders under: ${logsDir}`);

  try {
    const files = await fs.readdir(logsDir);
    const runFolders = files.filter(f => f.startsWith('run-'));

    if (runFolders.length === 0) {
      console.error('\n❌ Error: No run directory found in logs.');
      console.error('Please run a reel recipe extraction first.');
      process.exit(1);
    }

    // Find a run folder that contains a frames subfolder
    let targetFolder = '';
    let framesDirPath = '';
    for (const folder of runFolders) {
      const p = path.join(logsDir, folder, 'frames');
      try {
        const stats = await fs.stat(p);
        if (stats.isDirectory()) {
          targetFolder = folder;
          framesDirPath = p;
          break;
        }
      } catch {
        // Directory doesn't exist or isn't accessible, try next
      }
    }

    if (!framesDirPath) {
      console.error('\n❌ Error: No frames directory found inside any run folders under logs.');
      console.error('Please run a reel recipe extraction first, or make sure some frame images exist in logs/run-<jobId>/frames/.');
      process.exit(1);
    }

    console.log(`Using run directory: ${targetFolder}`);
    console.log(`Using frames directory: ${framesDirPath}`);

    const frameFiles = await fs.readdir(framesDirPath);
    const framePaths = frameFiles
      .filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
      .map(f => path.join(framesDirPath, f))
      // Sort them numerically by their index: frame_0.jpg, frame_1.jpg, ...
      .sort((a, b) => {
        const numA = parseInt(path.basename(a).match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(path.basename(b).match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });

    if (framePaths.length === 0) {
      console.error(`\n❌ Error: No frame_*.jpg images found inside ${framesDirPath}`);
      process.exit(1);
    }

    console.log(`Found ${framePaths.length} frame images to grid.`);

    const outputGridPath = path.join(logsDir, targetFolder, 'grid_test_result.jpg');
    console.log(`Creating grid at: ${outputGridPath}...`);

    const resultPath = await createImageGrid(framePaths, outputGridPath);
    console.log('\n==================================================');
    console.log('🎉 GRID GENERATED SUCCESSFULLY!');
    console.log('==================================================');
    console.log(`Output Location: ${resultPath}`);
    console.log('==================================================\n');

  } catch (error: any) {
    console.error(`\n❌ Error running grid test:`, error.message);
    process.exit(1);
  }
}

runGridTest();
