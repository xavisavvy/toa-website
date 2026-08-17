import castData from "@/data/cast.json";

export type Cast = (typeof castData.cast)[number];

/**
 * Resolve a character's playerId to a cast member entry from cast.json.
 *
 * Returns `undefined` for empty/missing input, the documented "tbd"
 * placeholder used by the holiday-special-1 character, or any id that
 * does not appear in cast.json. Pure function — no side effects.
 */
export function getCastMemberById(
  playerId: string | undefined
): Cast | undefined {
  if (!playerId || playerId === "tbd") {return undefined;}
  return castData.cast.find((c) => c.id === playerId);
}

/**
 * Filter a cast.socialLinks record down to non-empty URLs, preserving
 * insertion order. Used to populate Person JSON-LD `sameAs`.
 */
export function getCastSocialUrls(
  socialLinks: Record<string, string>
): string[] {
  return Object.values(socialLinks).filter(
    (u) => typeof u === "string" && u.length > 0
  );
}
