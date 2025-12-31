/**
 * Script to update Journeys Through Taebrin character images
 * Uses custom local images if available, falls back to D&D Beyond avatars
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const CHARACTER_CONFIG = [
  { id: '151530168', slug: 'wayne-archivist', name: 'Wayne "Archivist of Lies"' },
  { id: '151527820', slug: 'carine-sol', name: 'Carine Sol' },
  { id: '153687176', slug: 'erys-leandorian', name: 'Erys Leandorian' },
  { id: '147130895', slug: 'freya-fenrir', name: 'Freya Fenrir' },
  { id: '151498356', slug: 'porphan-valaritas', name: 'Porphan Valaritas' },
  { id: '151508871', slug: 'titheus-cillbrost', name: 'Titheus Cillbrost' },
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const alignmentMap: { [key: number]: string } = {
  1: 'Lawful Good',
  2: 'Neutral Good',
  3: 'Chaotic Good',
  4: 'Lawful Neutral',
  5: 'True Neutral',
  6: 'Chaotic Neutral',
  7: 'Lawful Evil',
  8: 'Neutral Evil',
  9: 'Chaotic Evil'
};

async function fetchCharacterData(characterId: string) {
  try {
    const response = await fetch(
      `https://character-service.dndbeyond.com/character/v5/character/${characterId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch character ${characterId}: ${response.statusText}`);
    }

    const json = await response.json();
    const character = json.data;

    const primaryClass = character.classes[0];
    const className = primaryClass?.definition?.name || 'Unknown';
    const totalLevel = character.classes.reduce((sum: number, c: any) => sum + c.level, 0);
    const alignment = character.alignmentId 
      ? alignmentMap[character.alignmentId] || 'Unknown'
      : 'Unknown';

    return {
      dndbeyondId: characterId,
      name: character.name,
      race: character.race.fullName,
      class: className,
      level: totalLevel,
      alignment: alignment,
      avatarUrl: character.decorations?.avatarUrl || character.avatarUrl,
    };
  } catch (error) {
    console.error(`Error fetching character ${characterId}:`, error);
    throw error;
  }
}

function findCustomImage(slug: string): string | null {
  const publicDir = join(process.cwd(), 'client/public/characters');
  
  for (const ext of IMAGE_EXTENSIONS) {
    const imagePath = join(publicDir, `${slug}${ext}`);
    if (existsSync(imagePath)) {
      return `/characters/${slug}${ext}`;
    }
  }
  
  return null;
}

async function main() {
  console.log('Updating Journeys Through Taebrin character images...\n');

  const charactersPath = join(process.cwd(), 'client/src/data/characters.json');
  const charactersFile = readFileSync(charactersPath, 'utf-8');
  const charactersJson = JSON.parse(charactersFile);

  let updatedCount = 0;
  let customImageCount = 0;
  let ddbImageCount = 0;

  for (const config of CHARACTER_CONFIG) {
    console.log(`\nProcessing ${config.name}...`);
    
    // Check for custom image first
    const customImagePath = findCustomImage(config.slug);
    
    let imageUrl: string;
    let imageSource: string;
    
    if (customImagePath) {
      imageUrl = customImagePath;
      imageSource = 'Custom Local Image';
      customImageCount++;
      console.log(`  ✓ Found custom image: ${customImagePath}`);
    } else {
      // Fetch from D&D Beyond
      console.log(`  ⚠ No custom image found, fetching from D&D Beyond...`);
      const freshData = await fetchCharacterData(config.id);
      imageUrl = freshData.avatarUrl;
      imageSource = 'D&D Beyond';
      ddbImageCount++;
      console.log(`  ✓ Using D&D Beyond avatar`);
      
      // Update other fields with fresh data
      const charIndex = charactersJson.characters.findIndex(
        (c: any) => c.dndbeyondId === config.id
      );
      
      if (charIndex !== -1) {
        const existingChar = charactersJson.characters[charIndex];
        charactersJson.characters[charIndex] = {
          ...existingChar,
          race: freshData.race,
          class: freshData.class,
          level: freshData.level,
          alignment: freshData.alignment,
        };
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Update the character's image
    const charIndex = charactersJson.characters.findIndex(
      (c: any) => c.dndbeyondId === config.id
    );
    
    if (charIndex !== -1) {
      const existingChar = charactersJson.characters[charIndex];
      
      charactersJson.characters[charIndex] = {
        ...existingChar,
        featuredImage: imageUrl,
        images: [{
          id: "1",
          url: imageUrl,
          caption: `${config.name} - Official Character Art`,
          type: "portrait",
          isFeatured: true,
          copyright: customImagePath ? "The Order of Azara" : "D&D Beyond / Wizards of the Coast",
          isAiGenerated: false
        }],
      };
      
      updatedCount++;
      console.log(`  ✓ Updated character data (Source: ${imageSource})`);
    }
  }

  // Write back to characters.json
  writeFileSync(charactersPath, JSON.stringify(charactersJson, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log(`✓ Successfully updated ${updatedCount} characters`);
  console.log(`  • Custom images: ${customImageCount}`);
  console.log(`  • D&D Beyond images: ${ddbImageCount}`);
  console.log('='.repeat(50));
  console.log('\nTo add custom images, place them in:');
  console.log('  client/public/characters/');
  console.log('\nSupported formats: .jpg, .jpeg, .png, .webp');
  console.log('Filenames:');
  CHARACTER_CONFIG.forEach(c => {
    console.log(`  • ${c.slug}.jpg (or .png, .webp)`);
  });
}

main().catch(console.error);
