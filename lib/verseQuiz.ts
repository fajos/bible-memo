import { getVerseText } from '@/lib/bible';
import { tokenizeVerse } from '@/lib/learnHelpers';
import type { MemorizedVerse, Translation, VerseQuizMode } from '@/types/models';

export interface FillBlankQuestion {
  type: 'fill_blank';
  verseId: string;
  reference: string;
  promptSegments: { text: string; isBlank: boolean }[];
  options: string[];
  correctAnswer: string;
  fullText: string;
}

export interface FinishVerseQuestion {
  type: 'finish_verse';
  verseId: string;
  reference: string;
  promptStart: string;
  options: string[];
  correctIndex: number;
  fullText: string;
}

export interface NameReferenceQuestion {
  type: 'name_reference';
  verseId: string;
  reference: string;
  verseText: string;
  options: string[];
  correctIndex: number;
}

export interface WordOrderQuestion {
  type: 'word_order';
  verseId: string;
  reference: string;
  correctChunks: string[];
  shuffledChunks: { id: string; text: string }[];
  fullText: string;
}

export type VerseQuizQuestion =
  | FillBlankQuestion
  | FinishVerseQuestion
  | NameReferenceQuestion
  | WordOrderQuestion;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function splitVerseHalves(text: string): { start: string; end: string } {
  const words = text.trim().split(/\s+/);
  if (words.length < 6) {
    return { start: text, end: text };
  }
  const mid = Math.max(3, Math.floor(words.length * 0.48));
  return {
    start: `${words.slice(0, mid).join(' ')} ...`,
    end: words.slice(mid).join(' '),
  };
}

function buildChunks(text: string): string[] {
  const words = text.trim().split(/\s+/);
  // Group into 5-8 readable phrase chunks of 2-4 words
  const targetChunkCount = Math.min(8, Math.max(4, Math.ceil(words.length / 3)));
  const chunkSize = Math.max(1, Math.ceil(words.length / targetChunkCount));
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}

export function generateVerseQuiz(params: {
  targetVerses: MemorizedVerse[];
  distractorPoolVerses: MemorizedVerse[];
  translation: Translation;
  mode: VerseQuizMode;
  maxQuestions?: number;
}): VerseQuizQuestion[] {
  const { targetVerses, distractorPoolVerses, translation, mode, maxQuestions = 8 } = params;
  if (targetVerses.length === 0) return [];

  const pool = distractorPoolVerses.length >= 4 ? distractorPoolVerses : targetVerses;
  const verseTextMap = new Map<string, string>();
  const allDeckWords: string[] = [];

  for (const v of pool) {
    const txt = getVerseText(translation, v.bookIndex, v.chapter, v.verseStart, v.verseEnd);
    verseTextMap.set(v.id, txt);
    for (const tok of tokenizeVerse(txt)) {
      if (tok.clean.length >= 4) allDeckWords.push(tok.clean);
    }
  }
  const uniqueDeckWords = Array.from(new Set(allDeckWords));

  const selectedVerses = shuffle(targetVerses).slice(0, maxQuestions);
  const activeTypes: Exclude<VerseQuizMode, 'mixed'>[] =
    mode === 'mixed'
      ? ['fill_blank', 'finish_verse', 'name_reference', 'word_order']
      : [mode];

  const questions: VerseQuizQuestion[] = [];

  selectedVerses.forEach((verse, idx) => {
    const fullText =
      verseTextMap.get(verse.id) ??
      getVerseText(translation, verse.bookIndex, verse.chapter, verse.verseStart, verse.verseEnd);
    const qType = activeTypes[idx % activeTypes.length];

    if (qType === 'fill_blank') {
      const tokens = tokenizeVerse(fullText);
      const candidates = tokens.filter((t) => t.clean.length >= 4);
      const chosen =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : tokens[Math.floor(tokens.length / 2)];

      const distractors = shuffle(
        uniqueDeckWords.filter((w) => w.toLowerCase() !== chosen.clean.toLowerCase())
      ).slice(0, 3);
      const fallback = ['grace', 'truth', 'mercy', 'light'].filter(
        (w) => w !== chosen.clean.toLowerCase() && !distractors.includes(w)
      );
      while (distractors.length < 3 && fallback.length > 0) {
        distractors.push(fallback.shift()!);
      }

      const before = tokens
        .slice(0, chosen.index)
        .map((t) => t.raw)
        .join(' ');
      const after = tokens
        .slice(chosen.index + 1)
        .map((t) => t.raw)
        .join(' ');

      const promptSegments = [
        ...(before ? [{ text: `${before} `, isBlank: false }] : []),
        { text: `${chosen.prefixPunct}_____${chosen.suffixPunct}`, isBlank: true },
        ...(after ? [{ text: ` ${after}`, isBlank: false }] : []),
      ];

      questions.push({
        type: 'fill_blank',
        verseId: verse.id,
        reference: verse.reference,
        promptSegments,
        options: shuffle([chosen.clean, ...distractors]),
        correctAnswer: chosen.clean,
        fullText,
      });
    } else if (qType === 'finish_verse') {
      const { start, end } = splitVerseHalves(fullText);
      const otherEndings = shuffle(
        pool
          .filter((v) => v.id !== verse.id)
          .map((v) => {
            const t =
              verseTextMap.get(v.id) ??
              getVerseText(translation, v.bookIndex, v.chapter, v.verseStart, v.verseEnd);
            return splitVerseHalves(t).end;
          })
          .filter((e) => e !== end && e.length > 0)
      ).slice(0, 3);

      const fallbackEndings = [
        'and his mercy endures forever.',
        'for the Lord watches over the way of the righteous.',
        'and peace shall guard your hearts and minds.',
      ];
      while (otherEndings.length < 3 && fallbackEndings.length > 0) {
        const fb = fallbackEndings.shift()!;
        if (fb !== end) otherEndings.push(fb);
      }

      const options = shuffle([end, ...otherEndings]);
      questions.push({
        type: 'finish_verse',
        verseId: verse.id,
        reference: verse.reference,
        promptStart: start,
        options,
        correctIndex: options.indexOf(end),
        fullText,
      });
    } else if (qType === 'name_reference') {
      const otherRefs = shuffle(
        pool
          .filter((v) => v.id !== verse.id && v.reference !== verse.reference)
          .map((v) => v.reference)
      ).slice(0, 3);

      const fallbackRefs = ['Psalm 119:105', 'Romans 12:2', 'Matthew 6:33', 'John 15:5'];
      for (const fb of fallbackRefs) {
        if (otherRefs.length >= 3) break;
        if (fb !== verse.reference && !otherRefs.includes(fb)) {
          otherRefs.push(fb);
        }
      }

      const options = shuffle([verse.reference, ...otherRefs]);
      questions.push({
        type: 'name_reference',
        verseId: verse.id,
        reference: verse.reference,
        verseText: fullText,
        options,
        correctIndex: options.indexOf(verse.reference),
      });
    } else {
      const chunks = buildChunks(fullText);
      const indexed = chunks.map((text, i) => ({ id: `${verse.id}_${i}`, text }));
      let shuffled = shuffle(indexed);
      if (shuffled.length > 1 && shuffled.every((c, i) => c.id === indexed[i].id)) {
        shuffled = [...shuffled.slice(1), shuffled[0]];
      }
      questions.push({
        type: 'word_order',
        verseId: verse.id,
        reference: verse.reference,
        correctChunks: chunks,
        shuffledChunks: shuffled,
        fullText,
      });
    }
  });

  return questions;
}
