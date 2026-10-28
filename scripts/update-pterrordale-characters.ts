/**
 * Script to fetch fresh D&D Beyond data for Pterrordale characters
 * and update characters.json with the correct information
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CHARACTER_IDS = [
  '58907127',  // Ahri Flowers
  '58917752',  // Alan McMichaelson
  '111110601', // Melly
  // 2026 one-shot. Jax and Nastia reuse the sheets previously linked to
  // Buck Calhoun and Mabel Crosscore, which no longer carry a dndbeyondId.
  '172203093', // Derek "Gizmo" Grimes
  '134997127', // Jax Xerowraith
  '171731788', // Jessica M.
  '169422765', // Kevin Kambridge
  '111107998', // Nastia Skorbina
  '171629978', // Trevor Calderón de las Vegas
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
    const className = character.classes
      .map((c: { definition?: { name?: string } }) => c.definition?.name)
      .filter(Boolean)
      .join(' / ') || 'Unknown';
    const totalLevel = character.classes.reduce((sum: number, c: { level: number }) => sum + c.level, 0);

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
  console.info('Fetching D&D Beyond character data for Pterrordale...\n');

  // Fetch all character data
  const characterData = [];
  for (const id of CHARACTER_IDS) {
    console.info(`Fetching character ${id}...`);
    const data = await fetchCharacterData(id);
    characterData.push(data);
    console.info(`  ${data.name} - ${data.race} ${data.class} ${data.level}`);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.info('\n✓ All character data fetched successfully!\n');

  // Read existing characters.json
  const charactersPath = join(process.cwd(), 'client/src/data/characters.json');
  const charactersFile = readFileSync(charactersPath, 'utf-8');
  const charactersJson = JSON.parse(charactersFile);

  // Update each character with fresh D&D Beyond data
  let updatedCount = 0;
  for (const freshData of characterData) {
    const charIndex = charactersJson.characters.findIndex(
      (c: { dndbeyondId?: string }) => c.dndbeyondId === freshData.dndbeyondId
    );

    if (charIndex !== -1) {
      // safe: charIndex comes from findIndex() on this same array, so it is a bounded index
      // eslint-disable-next-line security/detect-object-injection
      const existingChar = charactersJson.characters[charIndex];

      // Update only the D&D Beyond-derived fields
      // safe: charIndex comes from findIndex() on this same array, so it is a bounded index
      // eslint-disable-next-line security/detect-object-injection
      charactersJson.characters[charIndex] = {
        ...existingChar,
        race: freshData.race,
        class: freshData.class,
        level: freshData.level,
        alignment: freshData.alignment,
        featuredImage: freshData.avatarUrl,
        images: existingChar.images.length > 0
          ? existingChar.images.map((img: Record<string, unknown>, idx: number) =>
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
      console.info(`✓ Updated ${freshData.name}`);
    }
  }

  // Write back to characters.json
  writeFileSync(charactersPath, JSON.stringify(charactersJson, null, 2));
  console.info(`\n✓ Successfully updated ${updatedCount} characters in characters.json`);
}

main().catch(console.error);
