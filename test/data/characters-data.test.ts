import { describe, it, expect } from "vitest";

import charactersData from "@/data/characters.json";
import castData from "@/data/cast.json";
import {
  CharactersFileSchema,
  CharacterImageSchema,
} from "@shared/schema";

/**
 * Build-time integrity guard for client/src/data/characters.json.
 *
 * Mirrors test/data/campaigns-data.test.ts (Phase 1 pattern). This is the gate
 * that stops malformed character authoring from shipping to production:
 *
 *   1. Schema shape (Zod) — required fields, image source enum,
 *      lore optional fields, etc.
 *   2. Referential integrity — every non-"tbd" playerId resolves to cast.json.
 *   3. Character id uniqueness.
 *   4. Image source enum post-Zod-default ("official" | "fan").
 *   5. Every character has at least one image entry.
 *   6. R2 regression: melly.playerId === "brigette-streeper".
 *
 * Any failure here blocks pre-commit / pre-push and CI.
 */
describe("characters static data", () => {
  it("characters.json matches CharactersFileSchema", () => {
    expect(() => CharactersFileSchema.parse(charactersData)).not.toThrow();
  });

  it("every non-tbd character.playerId resolves to a cast member", () => {
    const ids = new Set(castData.cast.map((c) => c.id));
    const orphans: string[] = [];
    for (const ch of charactersData.characters) {
      if (ch.playerId === "tbd") continue; // documented holiday-special-1 placeholder
      if (!ids.has(ch.playerId)) {
        orphans.push(`${ch.id} -> ${ch.playerId}`);
      }
    }
    expect(orphans).toEqual([]);
  });

  it("character ids are unique", () => {
    const ids = charactersData.characters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every image entry has a valid source enum after Zod parse", () => {
    for (const ch of charactersData.characters) {
      for (const img of ch.images) {
        const parsed = CharacterImageSchema.parse(img);
        expect(["official", "fan"]).toContain(parsed.source);
      }
    }
  });

  it("every character has at least one image entry", () => {
    for (const ch of charactersData.characters) {
      expect(ch.images.length).toBeGreaterThan(0);
    }
  });

  it("melly.playerId resolves to brigette-streeper (regression for R2)", () => {
    const melly = charactersData.characters.find((c) => c.id === "melly");
    expect(melly?.playerId).toBe("brigette-streeper");
  });
});
