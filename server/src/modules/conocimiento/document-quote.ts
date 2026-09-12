/** Allow layout whitespace differences while returning only original source text. */
export function documentQuote(excerpt: string, proposal: string): string | null {
  const query = proposal.trim().replace(/\s+/g, " ");
  if (query.length < 15) return null;
  let normalized = "";
  const offsets: number[] = [];
  for (let i = 0; i < excerpt.length; i++) {
    const char = /\s/.test(excerpt[i]) ? " " : excerpt[i];
    if (char === " " && normalized.endsWith(" ")) continue;
    normalized += char;
    offsets.push(i);
  }
  const index = normalized.indexOf(query);
  return index < 0 ? null : excerpt.slice(offsets[index], offsets[index + query.length - 1] + 1);
}
