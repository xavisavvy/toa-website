// Campaign World registry — single source of truth for the settings the show
// runs campaigns in. The home page world cards (WorldSection) and the
// campaigns archive (Campaigns / CampaignDetail) both key off these ids so a
// campaign's "world" stays consistent everywhere it's referenced.
//
// Order here drives the display order of the home page world cards.
export interface WorldMeta {
  id: string;
  name: string;
  description: string;
  link: string;
}

export const worlds: WorldMeta[] = [
  {
    id: "taebrin",
    name: "Journeys Through Taebrin",
    description:
      "A bronze age themed land inhabited by the ancient Saurian people, where dinosaur civilizations thrive",
    link: "https://www.youtube.com/playlist?list=PLPwB6km-TpoAQiDKQnXQW-JUUXBwvkFQY",
  },
  {
    id: "pterrordale",
    name: "Pterrordale",
    description:
      "A modern Halloween special setting filled with magic, intrigue, and horror in the unfortunate town of Pterrordale",
    link: "https://www.youtube.com/watch?v=GzMnW52hmP4",
  },
  {
    id: "aneria",
    name: "Aneria",
    description:
      "A realm steeped in magic and mystery, where ancient powers awaken and heroes rise to face unimaginable challenges",
    link: "https://www.worldanvil.com/w/aneria-niburu",
  },
];

export function getWorldById(id: string): WorldMeta | undefined {
  return worlds.find((w) => w.id === id);
}
