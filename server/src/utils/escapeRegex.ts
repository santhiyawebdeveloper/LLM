/**
 * Escapes special regex characters so user input is treated as literal text.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a case-insensitive MongoDB regex filter from user search input.
 */
export function buildSafeRegexFilter(value: string): { $regex: string; $options: 'i' } {
  return { $regex: escapeRegex(value), $options: 'i' };
}
