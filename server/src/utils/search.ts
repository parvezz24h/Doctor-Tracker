/**
 * Search strategy
 * ---------------
 * MongoDB `$text` only matches whole words, and an unanchored or case-insensitive
 * regex cannot use an index. Instead each document stores a lowercase `searchTokens`
 * array (the words of its searchable fields) with a multikey index. A search term
 * becomes an anchored prefix regex per word, which the index answers with a tight
 * range scan — so "car" finds "Cardiology" without scanning the collection.
 */

const TOKEN_SPLIT = /[^\p{L}\p{N}@.+]+/u;

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
}

export function buildSearchTokens(...values: Array<string | undefined | null>): string[] {
  const tokens = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const token of normalize(value).split(TOKEN_SPLIT)) {
      if (token.length > 0) tokens.add(token.slice(0, 64));
    }
  }
  return [...tokens];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Turns a free-text query into index-friendly conditions (every word must match). */
export function buildSearchConditions(search: string | undefined) {
  if (!search) return [];
  return buildSearchTokens(search)
    .slice(0, 5)
    .map((token) => ({ searchTokens: { $regex: `^${escapeRegex(token)}` } }));
}
