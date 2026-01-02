import * as fs from 'fs';
import * as path from 'path';

import sharp from 'sharp';

const CHARACTERS_DIR = path.join(process.cwd(), 'client', 'public', 'characters');

async function optimizeImage(inputPath: string, outputPath: string, maxWidth: number, quality: number) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  const needsResize = metadata.width && metadata.width > maxWidth;
  
  let pipeline = image;
  if (needsResize) {
    pipeline = pipeline.resize(maxWidth, undefined, { withoutEnlargement: true });
  }
  
  await pipeline
    .webp({ quality })
    .toFile(outputPath);
  
  const inputStats = fs.statSync(inputPath);
  const outputStats = fs.statSync(outputPath);
  const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
  
  console.log(`${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
  console.log(`  ${(inputStats.size / 1024 / 1024).toFixed(2)} MB -> ${(outputStats.size / 1024).toFixed(0)} KB (${savings}% smaller)`);
  
  return { inputSize: inputStats.size, outputSize: outputStats.size };
}

async function main() {
  const files = fs.readdirSync(CHARACTERS_DIR).filter(f => f.endsWith('.png'));
  
  console.log(`\nOptimizing ${files.length} character images...\n`);
  
  let totalInputSize = 0;
  let totalOutputSize = 0;
  
  for (const file of files) {
    const inputPath = path.join(CHARACTERS_DIR, file);
    const outputName = file.replace('.png', '.webp');
    const outputPath = path.join(CHARACTERS_DIR, outputName);
    
    try {
      const { inputSize, outputSize } = await optimizeImage(inputPath, outputPath, 800, 85);
      totalInputSize += inputSize;
      totalOutputSize += outputSize;
    } catch (error) {
      console.error(`Error optimizing ${file}:`, error);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total before: ${(totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total after: ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total savings: ${((1 - totalOutputSize / totalInputSize) * 100).toFixed(1)}%`);
  console.log(`\nDon't forget to update characters.json to use .webp extensions!`);
}

main().catch(console.error);
