export interface StarterVerseSeed {
  bookIndex: number;
  chapter: number;
  verseStart: number;
  verseEnd: number;
}

export interface StarterPackSeed {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  verses: StarterVerseSeed[];
}

// Book indices (0-based canonical order):
// 5: Joshua, 15: Nehemiah, 18: Psalms, 19: Proverbs, 22: Isaiah, 23: Jeremiah, 24: Lamentations
// 39: Matthew, 40: Mark, 42: John, 43: Acts, 44: Romans, 46: 2 Corinthians, 47: Galatians
// 48: Ephesians, 49: Philippians, 54: 2 Timothy, 57: Hebrews, 58: James, 59: 1 Peter

export const STARTER_PACKS: StarterPackSeed[] = [
  {
    id: 'pack_salvation',
    name: 'Salvation',
    description: 'Core gospel verses on grace, redemption, and eternal life in Christ.',
    icon: 'heart',
    color: '#B83A3A',
    verses: [
      { bookIndex: 42, chapter: 3, verseStart: 16, verseEnd: 16 }, // John 3:16
      { bookIndex: 44, chapter: 3, verseStart: 23, verseEnd: 23 }, // Romans 3:23
      { bookIndex: 44, chapter: 6, verseStart: 23, verseEnd: 23 }, // Romans 6:23
      { bookIndex: 44, chapter: 10, verseStart: 9, verseEnd: 9 },  // Romans 10:9
      { bookIndex: 48, chapter: 2, verseStart: 8, verseEnd: 9 },  // Ephesians 2:8-9
      { bookIndex: 46, chapter: 5, verseStart: 17, verseEnd: 17 }, // 2 Cor 5:17
      { bookIndex: 43, chapter: 4, verseStart: 12, verseEnd: 12 }, // Acts 4:12
    ],
  },
  {
    id: 'pack_peace',
    name: 'Peace & Anxiety',
    description: 'Rest in God’s peace when worry, fear, or restlessness press in.',
    icon: 'leaf',
    color: '#2E7D5B',
    verses: [
      { bookIndex: 49, chapter: 4, verseStart: 6, verseEnd: 7 },  // Philippians 4:6-7
      { bookIndex: 22, chapter: 26, verseStart: 3, verseEnd: 3 }, // Isaiah 26:3
      { bookIndex: 42, chapter: 14, verseStart: 27, verseEnd: 27 }, // John 14:27
      { bookIndex: 59, chapter: 5, verseStart: 7, verseEnd: 7 },  // 1 Peter 5:7
      { bookIndex: 39, chapter: 11, verseStart: 28, verseEnd: 28 }, // Matthew 11:28
      { bookIndex: 18, chapter: 23, verseStart: 1, verseEnd: 3 }, // Psalm 23:1-3
      { bookIndex: 18, chapter: 46, verseStart: 1, verseEnd: 1 }, // Psalm 46:1
    ],
  },
  {
    id: 'pack_promises',
    name: 'Promises',
    description: 'Faithful promises of guidance, mercy, and steadfast love.',
    icon: 'sunny',
    color: '#C48324',
    verses: [
      { bookIndex: 23, chapter: 29, verseStart: 11, verseEnd: 11 }, // Jeremiah 29:11
      { bookIndex: 44, chapter: 8, verseStart: 28, verseEnd: 28 },  // Romans 8:28
      { bookIndex: 19, chapter: 3, verseStart: 5, verseEnd: 6 },   // Proverbs 3:5-6
      { bookIndex: 22, chapter: 41, verseStart: 10, verseEnd: 10 }, // Isaiah 41:10
      { bookIndex: 46, chapter: 12, verseStart: 9, verseEnd: 9 },  // 2 Corinthians 12:9
      { bookIndex: 24, chapter: 3, verseStart: 22, verseEnd: 23 }, // Lamentations 3:22-23
      { bookIndex: 58, chapter: 1, verseStart: 5, verseEnd: 5 },   // James 1:5
    ],
  },
  {
    id: 'pack_armor',
    name: 'Armor of God',
    description: 'Stand firm in spiritual battle with Ephesians 6.',
    icon: 'shield',
    color: '#2B4C7E',
    verses: [
      { bookIndex: 48, chapter: 6, verseStart: 10, verseEnd: 11 }, // Eph 6:10-11
      { bookIndex: 48, chapter: 6, verseStart: 13, verseEnd: 13 }, // Eph 6:13
      { bookIndex: 48, chapter: 6, verseStart: 14, verseEnd: 14 }, // Eph 6:14
      { bookIndex: 48, chapter: 6, verseStart: 15, verseEnd: 15 }, // Eph 6:15
      { bookIndex: 48, chapter: 6, verseStart: 16, verseEnd: 16 }, // Eph 6:16
      { bookIndex: 48, chapter: 6, verseStart: 17, verseEnd: 17 }, // Eph 6:17
      { bookIndex: 48, chapter: 6, verseStart: 18, verseEnd: 18 }, // Eph 6:18
    ],
  },
  {
    id: 'pack_faith',
    name: 'Faith',
    description: 'Walk by faith, trust the unseen, and live rooted in the Word.',
    icon: 'flame',
    color: '#7B4FA3',
    verses: [
      { bookIndex: 57, chapter: 11, verseStart: 1, verseEnd: 1 },  // Hebrews 11:1
      { bookIndex: 57, chapter: 11, verseStart: 6, verseEnd: 6 },  // Hebrews 11:6
      { bookIndex: 44, chapter: 10, verseStart: 17, verseEnd: 17 }, // Romans 10:17
      { bookIndex: 46, chapter: 5, verseStart: 7, verseEnd: 7 },   // 2 Corinthians 5:7
      { bookIndex: 40, chapter: 11, verseStart: 24, verseEnd: 24 }, // Mark 11:24
      { bookIndex: 47, chapter: 2, verseStart: 20, verseEnd: 20 }, // Galatians 2:20
      { bookIndex: 58, chapter: 2, verseStart: 17, verseEnd: 17 }, // James 2:17
    ],
  },
  {
    id: 'pack_strength',
    name: 'Strength',
    description: 'Courage and renewal when your own strength runs low.',
    icon: 'flash',
    color: '#1F6E8C',
    verses: [
      { bookIndex: 5, chapter: 1, verseStart: 9, verseEnd: 9 },    // Joshua 1:9
      { bookIndex: 49, chapter: 4, verseStart: 13, verseEnd: 13 }, // Philippians 4:13
      { bookIndex: 22, chapter: 40, verseStart: 31, verseEnd: 31 }, // Isaiah 40:31
      { bookIndex: 18, chapter: 27, verseStart: 1, verseEnd: 1 },  // Psalm 27:1
      { bookIndex: 54, chapter: 1, verseStart: 7, verseEnd: 7 },   // 2 Timothy 1:7
      { bookIndex: 15, chapter: 8, verseStart: 10, verseEnd: 10 }, // Nehemiah 8:10
      { bookIndex: 18, chapter: 18, verseStart: 2, verseEnd: 2 },  // Psalm 18:2
    ],
  },
];

export const VERSE_OF_THE_DAY_POOL: StarterVerseSeed[] = [
  { bookIndex: 42, chapter: 3, verseStart: 16, verseEnd: 16 },
  { bookIndex: 18, chapter: 119, verseStart: 105, verseEnd: 105 },
  { bookIndex: 19, chapter: 3, verseStart: 5, verseEnd: 6 },
  { bookIndex: 49, chapter: 4, verseStart: 13, verseEnd: 13 },
  { bookIndex: 22, chapter: 40, verseStart: 31, verseEnd: 31 },
  { bookIndex: 44, chapter: 8, verseStart: 28, verseEnd: 28 },
  { bookIndex: 5, chapter: 1, verseStart: 9, verseEnd: 9 },
  { bookIndex: 18, chapter: 23, verseStart: 1, verseEnd: 1 },
  { bookIndex: 23, chapter: 29, verseStart: 11, verseEnd: 11 },
  { bookIndex: 39, chapter: 11, verseStart: 28, verseEnd: 28 },
  { bookIndex: 18, chapter: 46, verseStart: 1, verseEnd: 1 },
  { bookIndex: 57, chapter: 11, verseStart: 1, verseEnd: 1 },
  { bookIndex: 48, chapter: 2, verseStart: 8, verseEnd: 9 },
  { bookIndex: 24, chapter: 3, verseStart: 22, verseEnd: 23 },
  { bookIndex: 42, chapter: 14, verseStart: 27, verseEnd: 27 },
  { bookIndex: 54, chapter: 1, verseStart: 7, verseEnd: 7 },
  { bookIndex: 18, chapter: 119, verseStart: 11, verseEnd: 11 },
  { bookIndex: 44, chapter: 12, verseStart: 2, verseEnd: 2 },
  { bookIndex: 39, chapter: 6, verseStart: 33, verseEnd: 33 },
  { bookIndex: 47, chapter: 5, verseStart: 22, verseEnd: 23 },
  { bookIndex: 18, chapter: 121, verseStart: 1, verseEnd: 2 },
  { bookIndex: 22, chapter: 41, verseStart: 10, verseEnd: 10 },
  { bookIndex: 59, chapter: 5, verseStart: 7, verseEnd: 7 },
  { bookIndex: 18, chapter: 19, verseStart: 14, verseEnd: 14 },
  { bookIndex: 50, chapter: 3, verseStart: 23, verseEnd: 23 }, // Colossians 3:23
  { bookIndex: 32, chapter: 6, verseStart: 8, verseEnd: 8 },   // Micah 6:8
  { bookIndex: 18, chapter: 37, verseStart: 4, verseEnd: 4 },  // Psalm 37:4
  { bookIndex: 42, chapter: 15, verseStart: 5, verseEnd: 5 },  // John 15:5
  { bookIndex: 44, chapter: 15, verseStart: 13, verseEnd: 13 }, // Romans 15:13
  { bookIndex: 57, chapter: 12, verseStart: 1, verseEnd: 2 },  // Hebrews 12:1-2
];
