import { createImageGrid } from './src/frameExtractor.js';
import fs from 'fs/promises';
import path from 'path';

async function runGridTest() {
  const tempDir = path.resolve('temp-downloads');
  console.log(`Searching for extracted frames in: ${tempDir}`);

  try {
    const files = await fs.readdir(tempDir);
    const framesFolders = files.filter(f => f.startsWith('frames-'));

    if (framesFolders.length === 0) {
      console.error('\n❌ Error: No frames directory found in temp-downloads.');
      console.error('Please run a reel recipe extraction first, or make sure some frame images exist in temp-downloads/frames-<jobId>/.');
      process.exit(1);
    }

    // Select the first frames folder
    const targetFolder = framesFolders[0];
    const framesDirPath = path.join(tempDir, targetFolder);
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

    const outputGridPath = path.join(tempDir, 'grid_test_result.jpg');
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
