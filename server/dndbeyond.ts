/**
 * D&D Beyond API Integration
 * Fetches character data from D&D Beyond's public character service API
 */

interface DDBCharacter {
  id: number;
  name: string;
  race: {
    fullName: string;
  };
  classes: Array<{
    level: number;
    definition: {
      name: string;
    };
  }>;
  alignmentId: number | null;
  avatarUrl: string;
}

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

export async function getCharacterData(characterId: string) {
  try {
    const response = await fetch(
      `https://character-service.dndbeyond.com/character/v5/character/${characterId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`D&D Beyond API returned ${response.status}: ${response.statusText}`);
    }

    const data: { data: DDBCharacter } = await response.json();
    const character = data.data;

    // Extract class and level information
    const primaryClass = character.classes[0];
    const className = primaryClass?.definition?.name || 'Unknown';
    const totalLevel = character.classes.reduce((sum, c) => sum + c.level, 0);

    // Get alignment
    const alignment = character.alignmentId 
      ? alignmentMap[character.alignmentId] || 'Unknown'
      : 'Unknown';

    return {
      name: character.name,
      race: character.race.fullName,
      class: className,
      level: totalLevel,
      alignment: alignment,
      avatarUrl: character.avatarUrl,
      dndbeyondId: characterId,
    };
  } catch (error) {
    console.error(`Error fetching D&D Beyond character ${characterId}:`, error);
    throw error;
  }
}
