import booksMetaRaw from '@/assets/data/books.json';
import kjvRaw from '@/assets/data/kjv.json';
import webRaw from '@/assets/data/web.json';
import { VERSE_OF_THE_DAY_POOL } from '@/data/starterPacks';
import { toLocalDateKey } from '@/lib/date';
import type { BibleBookMeta, Translation } from '@/types/models';

const BOOKS_META = booksMetaRaw as BibleBookMeta[];
type BibleCorpus = string[][][];

let kjvCorpus: BibleCorpus | null = null;
let webCorpus: BibleCorpus | null = null;

function getCorpus(translation: Translation): BibleCorpus {
  if (translation === 'KJV') {
    if (!kjvCorpus) kjvCorpus = kjvRaw as BibleCorpus;
    return kjvCorpus;
  }
  if (!webCorpus) webCorpus = webRaw as BibleCorpus;
  return webCorpus;
}

export function getBooks(): BibleBookMeta[] {
  return BOOKS_META;
}

export function getBookMeta(bookIndex: number): BibleBookMeta {
  return BOOKS_META[bookIndex] ?? BOOKS_META[0];
}

export function formatReference(
  bookIndex: number,
  chapter: number,
  verseStart: number,
  verseEnd: number
): string {
  const book = getBookMeta(bookIndex);
  if (verseEnd > verseStart) {
    return `${book.name} ${chapter}:${verseStart}-${verseEnd}`;
  }
  return `${book.name} ${chapter}:${verseStart}`;
}

export function getVerseText(
  translation: Translation,
  bookIndex: number,
  chapter: number,
  verseStart: number,
  verseEnd: number = verseStart
): string {
  const corpus = getCorpus(translation);
  const chapterVerses = corpus[bookIndex]?.[chapter - 1];
  if (!chapterVerses) return '';

  const startIdx = Math.max(0, verseStart - 1);
  const endIdx = Math.min(chapterVerses.length - 1, Math.max(startIdx, verseEnd - 1));
  const parts: string[] = [];

  for (let i = startIdx; i <= endIdx; i++) {
    const t = chapterVerses[i]?.trim();
    if (t) parts.push(t);
  }

  // Fallback to KJV if a specific disputed verse is omitted in WEB
  if (parts.length === 0 && translation !== 'KJV') {
    return getVerseText('KJV', bookIndex, chapter, verseStart, verseEnd);
  }

  return parts.join(' ');
}

export function getChapterVerses(
  translation: Translation,
  bookIndex: number,
  chapter: number
): { verse: number; text: string }[] {
  const corpus = getCorpus(translation);
  const chapterVerses = corpus[bookIndex]?.[chapter - 1] ?? [];
  return chapterVerses.map((text, idx) => ({
    verse: idx + 1,
    text: text || (translation === 'WEB' ? getVerseText('KJV', bookIndex, chapter, idx + 1) : ''),
  }));
}

export interface SearchHit {
  bookIndex: number;
  bookName: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
}

export function searchScripture(
  translation: Translation,
  query: string,
  limit: number = 40
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const corpus = getCorpus(translation);
  const hits: SearchHit[] = [];

  // Check if user searched by reference like "John 3:16" or "Ps 23"
  const refMatch = q.match(/^(\d?\s?[a-z]+)\s+(\d+)(?::(\d+))?/i);
  if (refMatch) {
    const bookQuery = refMatch[1].trim().toLowerCase();
    const chNum = Number(refMatch[2]);
    const vNum = refMatch[3] ? Number(refMatch[3]) : null;
    for (let b = 0; b < BOOKS_META.length; b++) {
      const meta = BOOKS_META[b];
      if (
        meta.name.toLowerCase().startsWith(bookQuery) ||
        meta.abbrev.toLowerCase().startsWith(bookQuery)
      ) {
        const ch = corpus[b]?.[chNum - 1];
        if (ch) {
          if (vNum && ch[vNum - 1]) {
            hits.push({
              bookIndex: b,
              bookName: meta.name,
              chapter: chNum,
              verse: vNum,
              reference: `${meta.name} ${chNum}:${vNum}`,
              text: ch[vNum - 1],
            });
          } else {
            for (let v = 0; v < Math.min(ch.length, 10); v++) {
              if (!ch[v]) continue;
              hits.push({
                bookIndex: b,
                bookName: meta.name,
                chapter: chNum,
                verse: v + 1,
                reference: `${meta.name} ${chNum}:${v + 1}`,
                text: ch[v],
              });
              if (hits.length >= limit) return hits;
            }
          }
        }
      }
    }
    if (hits.length > 0) return hits.slice(0, limit);
  }

  for (let b = 0; b < corpus.length; b++) {
    const book = corpus[b];
    const meta = BOOKS_META[b];
    for (let c = 0; c < book.length; c++) {
      const verses = book[c];
      for (let v = 0; v < verses.length; v++) {
        const text = verses[v];
        if (text && text.toLowerCase().includes(q)) {
          hits.push({
            bookIndex: b,
            bookName: meta.name,
            chapter: c + 1,
            verse: v + 1,
            reference: `${meta.name} ${c + 1}:${v + 1}`,
            text,
          });
          if (hits.length >= limit) return hits;
        }
      }
    }
  }

  return hits;
}

export function getVerseOfTheDay(translation: Translation, dateKey: string = toLocalDateKey()) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const seed = VERSE_OF_THE_DAY_POOL[hash % VERSE_OF_THE_DAY_POOL.length];
  return {
    ...seed,
    reference: formatReference(seed.bookIndex, seed.chapter, seed.verseStart, seed.verseEnd),
    text: getVerseText(translation, seed.bookIndex, seed.chapter, seed.verseStart, seed.verseEnd),
  };
}
