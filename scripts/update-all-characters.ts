/**
 * Script to fetch fresh D&D Beyond data for ALL campaigns
 * and update characters.json with the correct information
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CAMPAIGN_CHARACTER_IDS = {
  'Journeys Through Taebrin': [
    '151530168', // Wayne "Archivist of Lies"
    '151527820', // Carine Sol
    '153687176', // Erys Leandorian
    '147130895', // Freya Fenrir
    '151498356', // Porphan Valaritas
    '151508871', // Titheus Cillbrost
  ],
  'Aneria - Wayward Watch': [
    '45818629',  // Bolt
    '46268811',  // Victor Udonta
    '94493888',  // Winifred (Fred) Blodbane
    '79518285',  // Alomah Stargazer
    '79078434',  // Aramis Alderhelm
    '133741834', // Auron Dawncloak
    '47697687',  // Ferra Shadowmend
    '67943311',  // Grelka
    '56077210',  // Mirielle Aldwood
    '56497643',  // Ryn Darkspear
    '52932329',  // Zevander Draven
  ],
  'Pterrordale': [
    '58907127',  // Daevor
    '58917752',  // Lucian
    '111107998', // Moira
    '111110601', // Sylas Dreadmoor
    '134997127', // Thorne Blackwood
  ],
};

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
      avatarUrl: character.avatarUrl,
    };
  } catch (error) {
    console.error(`Error fetching character ${characterId}:`, error);
    throw error;
  }
}

async function main() {
  console.log('Fetching D&D Beyond character data for ALL campaigns...\n');

  const allCharacterData = [];

  // Fetch data for each campaign
  for (const [campaignName, characterIds] of Object.entries(CAMPAIGN_CHARACTER_IDS)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`CAMPAIGN: ${campaignName}`);
    console.log(`${'='.repeat(60)}\n`);

    for (const id of characterIds) {
      console.log(`Fetching character ${id}...`);
      try {
        const data = await fetchCharacterData(id);
        allCharacterData.push(data);
        console.log(`  ✓ ${data.name} - ${data.race} ${data.class} ${data.level}`);
      } catch (error) {
        console.error(`  ✗ Failed to fetch character ${id}`);
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✓ Fetched ${allCharacterData.length} characters successfully!`);
  console.log('='.repeat(60) + '\n');

  // Read existing characters.json
  const charactersPath = join(process.cwd(), 'client/src/data/characters.json');
  const charactersFile = readFileSync(charactersPath, 'utf-8');
  const charactersJson = JSON.parse(charactersFile);

  // Update each character with fresh D&D Beyond data
  let updatedCount = 0;
  for (const freshData of allCharacterData) {
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
        images: existingChar.images.map((img: any, idx: number) => 
          idx === 0 ? { ...img, url: freshData.avatarUrl } : img
        ),
      };
      
      updatedCount++;
      console.log(`✓ Updated ${freshData.name}`);
    }
  }

  // Write back to characters.json
  writeFileSync(charactersPath, JSON.stringify(charactersJson, null, 2));
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ Successfully updated ${updatedCount} characters in characters.json`);
  console.log('='.repeat(60));
}

main().catch(console.error);
