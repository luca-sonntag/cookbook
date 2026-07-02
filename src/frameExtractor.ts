import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

const isProduction = process.env.NODE_ENV === 'production';
const ffmpegPath = ffmpegStatic as unknown as string;

// On production (e.g. Alpine), use system ffmpeg/ffprobe installed via apk
if (!isProduction && ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Resolved path for direct spawns (e.g. creating tiled grid)
const activeFfmpegBinary = (isProduction || !ffmpegPath) ? 'ffmpeg' : ffmpegPath;

/**
 * Returns the duration of a video file in seconds.
 */
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
}

/**
 * Extracts `count` evenly-distributed frames from a video file.
 * Returns an array of absolute paths to the saved JPEG frames.
 */
export async function extractFrames(
  videoPath: string,
  outputDir: string,
  count = 8
): Promise<string[]> {
  await fs.mkdir(outputDir, { recursive: true });

  const duration = await getVideoDuration(videoPath);
  if (duration === 0) throw new Error('Could not determine video duration.');

  // Distribute timestamps evenly, skipping first and last 5% to avoid intros/outros
  const start = duration * 0.05;
  const end = duration * 0.95;
  const range = end - start;
  const timestamps: number[] = Array.from({ length: count }, (_, i) =>
    start + (range / (count - 1)) * i
  );

  const framePaths: string[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const outputPath = path.join(outputDir, `frame_${i}.jpg`);
    framePaths.push(outputPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(ts)
        .outputOptions('-vframes', '1', '-q:v', '3')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
  }

  return framePaths;
}

/**
 * Creates a tiled grid image from an array of frame image paths.
 * Each frame is cropped to a centered square, scaled to 300x300, and labeled with its index.
 * The final grid is combined using the ffmpeg xstack filter.
 */
export async function createImageGrid(
  framePaths: string[],
  outputPath: string
): Promise<string> {
  if (framePaths.length === 0) {
    throw new Error('No frames provided for grid creation.');
  }

  const count = framePaths.length;
  const colCount = Math.ceil(Math.sqrt(count));
  const rowCount = Math.ceil(count / colCount);
  const scaleSize = 300;

  // Find standard font file for text drawing
  let fontOption = "font='Arial'";
  try {
    const winFont = 'C:\\Windows\\Fonts\\arial.ttf';
    await fs.access(winFont);
    fontOption = `fontfile='C\\\\:/Windows/Fonts/arial.ttf'`;
  } catch {
    // Keep fallback to Arial font query
  }

  return new Promise((resolve, reject) => {
    const args: string[] = [];

    // Add inputs
    for (const framePath of framePaths) {
      args.push('-i', framePath);
    }

    // Build filter complex
    let filterComplex = '';
    for (let i = 0; i < count; i++) {
      filterComplex += `[${i}:v]crop=w=in_w:h=in_w,scale=${scaleSize}:${scaleSize},drawtext=text='${i}':${fontOption}:fontcolor=white:fontsize=36:box=1:boxcolor=black@0.6:boxborderw=8:x=15:y=15[v${i}];`;
    }

    // Build xstack layout
    let xstackLayout = '';
    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const x = c * scaleSize;
        const y = r * scaleSize;
        xstackLayout += `${x}_${y}|`;
      }
    }
    xstackLayout = xstackLayout.slice(0, -1);

    const xstackInputs = Array.from({ length: count }, (_, i) => `[v${i}]`).join('');
    filterComplex += `${xstackInputs}xstack=inputs=${count}:layout=${xstackLayout}[outv]`;

    args.push('-filter_complex', filterComplex);
    args.push('-map', '[outv]');
    args.push('-y', outputPath);

    const cp = spawn(activeFfmpegBinary, args);

    let stderr = '';
    cp.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    cp.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`ffmpeg grid creation exited with code ${code}. Stderr: ${stderr}`));
      }
    });

    cp.on('error', (err) => {
      reject(err);
    });
  });
}

