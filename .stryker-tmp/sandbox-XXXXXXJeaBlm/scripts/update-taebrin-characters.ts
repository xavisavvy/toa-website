/**
 * Script to fetch fresh D&D Beyond data for Journeys Through Taebrin characters
 * and update characters.json with the correct information
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CHARACTER_IDS = [
  '151530168', // Wayne "Archivist of Lies"
  '151527820', // Carine Sol
  '153687176', // Erys Leandorian
  '147130895', // Freya Fenrir
  '151498356', // Porphan Valaritas
  '151508871', // Titheus Cillbrost
];

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

    // Extract class and level information
    const primaryClass = character.classes[0];
    const className = primaryClass?.definition?.name || 'Unknown';
    const totalLevel = character.classes.reduce((sum: number, c: any) => sum + c.level, 0);

    // Get alignment
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

async function main() {
  console.log('Fetching D&D Beyond character data...\n');

  // Fetch all character data
  const characterData = [];
  for (const id of CHARACTER_IDS) {
    console.log(`Fetching character ${id}...`);
    const data = await fetchCharacterData(id);
    characterData.push(data);
    console.log(`  ${data.name} - ${data.race} ${data.class} ${data.level}`);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✓ All character data fetched successfully!\n');

  // Read existing characters.json
  const charactersPath = join(process.cwd(), 'client/src/data/characters.json');
  const charactersFile = readFileSync(charactersPath, 'utf-8');
  const charactersJson = JSON.parse(charactersFile);

  // Update each character with fresh D&D Beyond data
  let updatedCount = 0;
  for (const freshData of characterData) {
    const charIndex = charactersJson.characters.findIndex(
      (c: any) => c.dndbeyondId === freshData.dndbeyondId
    );

    if (charIndex !== -1) {
      const existingChar = charactersJson.characters[charIndex];
      
      // Update only the D&D Beyond-derived fields
      charactersJson.characters[charIndex] = {
        ...existingChar,
        race: freshData.race,
        class: freshData.class,
        level: freshData.level,
        alignment: freshData.alignment,
        featuredImage: freshData.avatarUrl,
        images: existingChar.images.length > 0 
          ? existingChar.images.map((img: any, idx: number) => 
              idx === 0 ? { ...img, url: freshData.avatarUrl } : img
            )
          : [{
              id: "1",
              url: freshData.avatarUrl,
              caption: `${freshData.name} - Official Character Art`,
              type: "portrait",
              isFeatured: true,
              copyright: "D&D Beyond / Wizards of the Coast",
              isAiGenerated: false
            }],
      };
      
      updatedCount++;
      console.log(`✓ Updated ${freshData.name}`);
    }
  }

  // Write back to characters.json
  writeFileSync(charactersPath, JSON.stringify(charactersJson, null, 2));
  console.log(`\n✓ Successfully updated ${updatedCount} characters in characters.json`);
}

main().catch(console.error);
