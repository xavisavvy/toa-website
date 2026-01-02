import * as fs from 'fs';
import * as path from 'path';

import sharp from 'sharp';

const ASSETS_DIR = path.join(process.cwd(), 'client', 'src', 'assets');
const OUTPUT_DIR = path.join(process.cwd(), 'client', 'src', 'assets', 'optimized');

interface OptimizeConfig {
  pattern: RegExp;
  maxWidth: number;
  quality: number;
}

const configs: OptimizeConfig[] = [
  { pattern: /^hero-/, maxWidth: 1920, quality: 80 },
  { pattern: /^feat-/, maxWidth: 1200, quality: 80 },
  { pattern: /^cast-/, maxWidth: 400, quality: 85 },
  { pattern: /^creepy-/, maxWidth: 1200, quality: 80 },
];

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
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const files = fs.readdirSync(ASSETS_DIR).filter(f => 
    f.endsWith('.png') || f.endsWith('.jpg')
  );
  
  console.log(`\nOptimizing ${files.length} images...\n`);
  
  let totalInputSize = 0;
  let totalOutputSize = 0;
  
  for (const file of files) {
    const inputPath = path.join(ASSETS_DIR, file);
    const outputName = file.replace(/\.(png|jpg)$/, '.webp');
    const outputPath = path.join(OUTPUT_DIR, outputName);
    
    const config = configs.find(c => c.pattern.test(file)) || { maxWidth: 1200, quality: 80, pattern: /.*/ };
    
    try {
      await optimizeImage(inputPath, outputPath, config.maxWidth, config.quality);
      totalInputSize += fs.statSync(inputPath).size;
      totalOutputSize += fs.statSync(outputPath).size;
    } catch (error) {
      console.error(`Error optimizing ${file}:`, error);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total before: ${(totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total after: ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total savings: ${((1 - totalOutputSize / totalInputSize) * 100).toFixed(1)}%`);
}

main().catch(console.error);
