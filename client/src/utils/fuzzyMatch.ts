/**
 * Simple fuzzy matching utility
 * Checks if search query matches target string with fuzzy logic
 */

export interface FuzzyMatch {
  matched: boolean;
  score: number;
  indices: number[];
}

/**
 * Performs fuzzy matching on a string
 * @param str - The string to search in
 * @param pattern - The search pattern
 * @returns Match result with score and indices
 */
export function fuzzyMatch(str: string, pattern: string): FuzzyMatch {
  // Normalize strings to lowercase for case-insensitive matching
  const haystack = str.toLowerCase();
  const needle = pattern.toLowerCase().trim();
  
  if (needle === '') {
    return { matched: true, score: 0, indices: [] };
  }
  
  if (haystack.includes(needle)) {
    // Exact substring match - highest score
    const index = haystack.indexOf(needle);
    const indices = Array.from({ length: needle.length }, (_, i) => index + i);
    return {
      matched: true,
      score: 1.0,
      indices
    };
  }
  
  // Fuzzy matching - all pattern characters must appear in order
  let patternIdx = 0;
  let strIdx = 0;
  const indices: number[] = [];
  let score = 0.5; // Base score for fuzzy matches
  
  while (strIdx < haystack.length && patternIdx < needle.length) {
    if (haystack[strIdx] === needle[patternIdx]) {
      indices.push(strIdx);
      patternIdx++;
      // Bonus for consecutive matches
      if (indices.length > 1 && indices[indices.length - 1] === indices[indices.length - 2] + 1) {
        score += 0.1;
      }
    }
    strIdx++;
  }
  
  const matched = patternIdx === needle.length;
  
  if (matched) {
    // Adjust score based on match quality
    const matchRatio = indices.length / haystack.length;
    score = Math.min(0.95, score * matchRatio);
  }
  
  return { matched, score, indices };
}

/**
 * Highlight matched characters in a string
 * @param str - Original string
 * @param indices - Indices of matched characters
 * @returns String with HTML markup for highlights
 */
export function highlightMatches(str: string, indices: number[]): string {
  if (indices.length === 0) return str;
  
  let result = '';
  let lastIndex = 0;
  
  for (const index of indices) {
    result += str.slice(lastIndex, index);
    result += `<mark class="bg-yellow-200 dark:bg-yellow-800">${str[index]}</mark>`;
    lastIndex = index + 1;
  }
  
  result += str.slice(lastIndex);
  return result;
}
