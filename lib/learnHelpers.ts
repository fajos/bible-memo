export interface VerseToken {
  index: number;
  raw: string; // e.g. "world,"
  clean: string; // e.g. "world"
  prefixPunct: string; // e.g. "“"
  suffixPunct: string; // e.g. ","
  firstLetterPrompt: string; // e.g. "w____"
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'has',
  'have',
  'he',
  'her',
  'him',
  'his',
  'in',
  'into',
  'is',
  'it',
  'its',
  'me',
  'my',
  'no',
  'not',
  'of',
  'on',
  'or',
  'our',
  'out',
  'she',
  'so',
  'that',
  'the',
  'their',
  'them',
  'they',
  'this',
  'to',
  'us',
  'was',
  'we',
  'were',
  'who',
  'with',
  'ye',
  'you',
  'your',
]);

export function tokenizeVerse(text: string): VerseToken[] {
  const rawParts = text.trim().split(/\s+/).filter(Boolean);
  return rawParts.map((raw, index) => {
    const match = raw.match(/^([^A-Za-z0-9]*)([A-Za-z0-9’'-]+)([^A-Za-z0-9]*)$/);
    const prefixPunct = match ? match[1] : '';
    const clean = match ? match[2] : raw;
    const suffixPunct = match ? match[3] : '';

    const firstChar = clean.charAt(0);
    const underscoreCount = Math.max(1, Math.min(6, clean.length - 1));
    const firstLetterPrompt =
      clean.length <= 1 ? clean : `${firstChar}${'_'.repeat(underscoreCount)}`;

    return {
      index,
      raw,
      clean,
      prefixPunct,
      suffixPunct,
      firstLetterPrompt,
    };
  });
}

/**
 * Selects indices of meaningful words to mask in "Fill in the blanks" (~30-35% of words).
 */
export function selectBlankIndices(tokens: VerseToken[], seedStr: string): number[] {
  const candidates = tokens
    .filter((t) => t.clean.length >= 3 && !STOP_WORDS.has(t.clean.toLowerCase()))
    .map((t) => t.index);

  const pool =
    candidates.length >= 3 ? candidates : tokens.filter((t) => t.clean.length >= 2).map((t) => t.index);

  if (pool.length === 0) return [];

  const targetCount = Math.max(2, Math.min(pool.length, Math.round(tokens.length * 0.3)));
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 33 + seedStr.charCodeAt(i)) >>> 0;
  }

  // Deterministic shuffle of pool
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, targetCount).sort((a, b) => a - b);
}

export function buildBlankOptions(
  tokens: VerseToken[],
  targetIdx: number,
  allDeckWords: string[] = []
): string[] {
  const target = tokens[targetIdx]?.clean ?? '';
  const lowerTarget = target.toLowerCase();
  const distractors = new Set<string>();

  // First pull words from the verse itself, then from the user's deck
  const localPool = tokens
    .filter((t) => t.index !== targetIdx && t.clean.length >= 3)
    .map((t) => t.clean);

  const combined = [...localPool, ...allDeckWords];
  for (const w of combined) {
    const clean = w.trim();
    if (
      clean.length >= 2 &&
      clean.toLowerCase() !== lowerTarget &&
      !/^\d+$/.test(clean)
    ) {
      distractors.add(clean);
    }
    if (distractors.size >= 12) break;
  }

  const fallbackPool = ['grace', 'truth', 'faith', 'peace', 'heart', 'light', 'spirit', 'glory'];
  for (const fb of fallbackPool) {
    if (distractors.size >= 3) break;
    if (fb !== lowerTarget) distractors.add(fb);
  }

  const picked = Array.from(distractors).slice(0, 3);
  const options = [target, ...picked];
  // Shuffle deterministically
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

export function formatFirstLetterLine(tokens: VerseToken[], revealedSet: Set<number>): string {
  return tokens
    .map((t) =>
      revealedSet.has(t.index)
        ? t.raw
        : `${t.prefixPunct}${t.firstLetterPrompt}${t.suffixPunct}`
    )
    .join(' ');
}
