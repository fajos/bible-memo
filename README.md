# Selah — Scripture Memorization App

An offline-first Scripture memorization mobile application built with **Expo SDK 58**, **Expo Router**, **TypeScript**, and **expo-sqlite**. 

Designed for daily devotions and spaced repetition memory practice with **zero accounts, zero backend servers, and zero ongoing costs**.

---

## 🌟 Key Features

### 1. Verse Library & Full Bibles Bundled Offline
- **Full Public Domain Translations**: King James Version (**KJV**) and World English Bible (**WEB**) fully bundled locally inside `assets/data/`.
- **Book, Chapter, & Verse Picker**: Fast selector spanning all 66 books (OT & NT), with chapter picker and multi-verse range selection (e.g., *John 3:16-18* or *Psalm 23:1-3*).
- **Full Scripture Search**: Instant search by reference or keyword across the entire Bible text.
- **Starter Packs**:
  - Salvation (*John 3:16, Romans 3:23, 6:23, 10:9, Ephesians 2:8-9, etc.*)
  - Peace & Anxiety (*Philippians 4:6-7, Isaiah 26:3, John 14:27, 1 Peter 5:7, Psalm 23, etc.*)
  - Promises (*Jeremiah 29:11, Romans 8:28, Proverbs 3:5-6, Isaiah 41:10, etc.*)
  - Armor of God (*Ephesians 6:10-18*)
  - Faith (*Hebrews 11:1, 11:6, Romans 10:17, Mark 11:24, etc.*)
  - Strength (*Joshua 1:9, Philippians 4:13, Isaiah 40:31, Psalm 27:1, etc.*)
- **Custom Decks**: Users can create unlimited custom decks (*e.g., "Youth Fellowship", "Sunday School"*) with custom color accents and icons.

### 2. Learn Mode (Per Verse)
Staged practice steps, each harder than the previous:
1. **Read & Listen**: Read passage in chosen translation with text-to-speech audio via `expo-speech`.
2. **Fill in the Blanks**: 30-35% of key words masked into blank slots. Interactive multiple choice options dynamically chosen from the verse and deck.
3. **First-Letter Prompts**: Displays initial letters with underscores (*e.g., `F__ G__ s_ l_____ ...`*). Includes an interactive **Hint** button that reveals one word at a time.
4. **Recite from Memory**: Prompts user to recite aloud or in their head, provides a 1-word hint or full passage reveal, followed by self-rating: **Again**, **Hard**, **Good**, and **Easy**.

### 3. Daily Review (Spaced Repetition with SM-2)
- **SM-2 Algorithm**: Tracks ease factor, repetition count, interval, and next due date.
- **Due Today Queue**: Home screen hero card displays count of passages due for review.
- **Quiz Miss Priority**: Missed quiz questions or verses marked *Again* are automatically pushed to the front of the review queue for immediate reinforcement.

### 4. Verse Quizzes
Four quiz game modes with distractors pulled directly from the user's active deck:
- **Fill in the Blank**: Pick the correct missing word among deck distractors.
- **Finish the Verse**: Read the opening phrase and identify the correct ending among 4 options.
- **Name the Reference**: Read the scripture and pick the correct reference (Book, Chapter, Verse).
- **Word Order**: Tap shuffled passage chunks in exact sequence to reconstruct the verse.

### 5. Bible Knowledge Trivia
- **105-Question Curated Question Bank** stored in offline JSON across 7 categories:
  - Old Testament
  - New Testament
  - Gospels
  - Characters
  - Books of the Bible
  - Miracles
  - Parables
- **3 Difficulty Levels**: Easy, Medium, Hard (or Mixed).
- **Daily Challenge**: 5 daily questions seeded by the calendar date.
- **Timed Blitz Mode**: 60-second speed challenge with countdown timer.
- **Immediate Scriptural Explanations** and biblical reference citations for every question.

### 6. Progress, Streaks & Badges
- **Streak Counter with Gentle Freeze**: A single missed day is cushioned by a gentle freeze rule, preventing streaks from wiping due to busy days.
- **Stats & Insights**: Verses learned, average mastery, weakest verses list, and quiz accuracy.
- **10 Milestone Badges**:
  - *First Seed* (first verse memorized)
  - *Word Keeper* (10 verses learned)
  - *Scripture Scholar* (25 verses learned)
  - *Faithful Start* (3-day streak)
  - *Week of the Word* (7-day streak)
  - *Steadfast Heart* (30-day streak)
  - *First Pack / Book Completed* (mastering an entire deck)
  - *Quiz Ace* (100% on a quiz round)
  - *Daily Challenger* (completing the daily trivia)
  - *Light Bearer* (sharing a verse card)

### 7. Reminders & Social Sharing
- **Daily Notifications**: Configurable reminder time scheduled using `expo-notifications`.
- **Verse of the Day**: Rotating passage highlighted on the home dashboard.
- **Share Card Generator**: Renders scripture onto high-resolution cards with 4 custom visual themes (*Parchment*, *Sanctuary*, *Olive Grove*, *Royal Crimson*) using `react-native-view-shot` and opens native share sheet via `expo-sharing`.

### 8. Settings & Portability
- Translation switch (**WEB** modern English vs. **KJV** classic).
- Theme preferences (**Light**, **Dark**, or **System**).
- Scripture typography sizing (**Small**, **Medium**, **Large**, **Extra Large**).
- **Backup & Restore**: Export and import full database state as portable `.json` files via `expo-file-system` and `expo-document-picker`.

---

## 🛠️ Tech Stack

| Layer | Choice |
| :--- | :--- |
| **Framework** | Expo (React Native) + TypeScript |
| **Navigation** | Expo Router (Tabs + Stack) |
| **Local Storage** | `expo-sqlite` (native WAL SQLite) + `localStorage` fallback (web) |
| **State Management**| `zustand` (reactive, persistent store) |
| **Notifications** | `expo-notifications` (daily repeating triggers) |
| **Text-to-Speech** | `expo-speech` |
| **Share Images** | `react-native-view-shot` + `expo-sharing` |
| **Backup / Export** | `expo-file-system` + `expo-document-picker` |
| **Updates (OTA)** | `expo-updates` + EAS Update |
| **Animations** | `react-native-reanimated` |

---

## 🚀 Running the App

### 1. Start Development Server
```bash
npm start
```

### 2. Run on Android
```bash
npm run android
```

### 3. Run on iOS (requires macOS)
```bash
npm run ios
```

### 4. Run on Web
```bash
npm run web
```

### 5. Verification Commands
```bash
npx tsc --noEmit    # Type check
npx eslint .        # Lint check
npx expo-doctor     # Expo configuration & dependency check
```

---

## 📲 Over-the-Air (OTA) Updates with EAS Update

The app is linked with EAS Project `@fajostheprince/bible-memo` and configured for instant OTA updates without app store re-submissions:

### 1. Publish to Production Channel
```bash
npx eas update --channel production --message "Fix verse formatting & updates"
```

### 2. Publish to Preview Channel
```bash
npx eas update --channel preview --message "Test new feature"
```

### 3. Client Behavior
- **On App Launch**: The app automatically checks for and downloads new updates in the background. If a new update was downloaded, it will apply on next launch.
- **Manual In-App Check**: Users can navigate to **Settings > Over-the-Air Updates** and tap **"Check for Updates Now"** or **"Restart & Apply Downloaded Update"**.
- **Dev / Web**: Safely skipped in local development and web builds to ensure dev reload is unimpeded.

---

## 📜 Privacy & Terms (App Store & Google Play URLs)

- **Privacy Policy**: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)
  - HTML Version: [docs/privacy.html](docs/privacy.html) / `https://fajos.github.io/bible-memo/privacy.html`
- **Terms of Use**: [TERMS_OF_USE.md](TERMS_OF_USE.md)
  - HTML Version: [docs/terms.html](docs/terms.html) / `https://fajos.github.io/bible-memo/terms.html`
- **Landing Hub**: [docs/index.html](docs/index.html) / `https://fajos.github.io/bible-memo/`


