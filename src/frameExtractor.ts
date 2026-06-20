import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

// Point fluent-ffmpeg at the bundled static binary
const ffmpegPath = ffmpegStatic as unknown as string;
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

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
