# Privacy Policy for Selah Scripture Memory

**Last Updated:** November 19, 2026  
**Effective Date:** November 19, 2026  

Selah Scripture Memory ("we", "our", or "the App") is developed with a strict **privacy-first and offline-first** philosophy. We believe that your personal prayer, spiritual meditation, and scripture memorization habits are private and belong solely to you.

---

## 1. Zero Data Collection

- **No Personal Information Collected:** We do not collect, store, sell, or transmit any personally identifiable information (such as your name, email address, phone number, location, or contacts).
- **No Account Required:** You do not need to register, log in, or link any third-party accounts (Apple, Google, Facebook, etc.) to use any feature of the App.
- **No Tracking or Advertising:** We do not use third-party analytics trackers, behavioral profiling, cookies, or advertising identifier frameworks (such as Apple's IDFA or Google's AAID).

---

## 2. On-Device Local Storage

All your data stays strictly on your physical device:
- **What is stored locally:** Your custom decks, memorized verses, review history (SM-2 intervals and repetitions), quiz scores, study streaks, personal notes, and verse tags.
- **Storage Technology:** Data is stored in a local SQLite database (on iOS and Android) or local browser storage (on Web). It never leaves your device unless you explicitly export it.
- **Your Control:** You can export a full, unencrypted JSON backup of your data at any time via **Settings > Backup & Export**, or create local database snapshots. You can also delete any deck, verse, or note at will.

---

## 3. Device Permissions & Hardware Usage

The App requests minimal permissions, solely to enable features you explicitly choose:

| Feature | Permission / Capability | Purpose |
| :--- | :--- | :--- |
| **Daily Reminders** | Local Notifications (`expo-notifications`) | Delivers a scheduled reminder at your chosen time. All notifications are scheduled locally on the device; no remote push servers or device push tokens are used. |
| **Audio Narration** | Speech Synthesis (`expo-speech`) | Reads scripture aloud using your device’s built-in text-to-speech engine. No speech or audio is recorded or uploaded. |
| **Tactile Typing & Quizzes** | Haptics (`expo-haptics`) | Provides subtle vibration feedback during typing recall and quiz responses. |
| **Sharing & Backups** | File Sharing (`expo-sharing`) | Allows you to share styled verse cards or save exported JSON backup files via your system's native share sheet. |

---

## 4. Network Activity

The App is designed to be **100% operational offline**. When an internet connection is available, network communication is limited strictly to:
- **Over-The-Air (OTA) Updates:** The App may query Expo Application Services (EAS Update) to download software bug fixes and scripture updates. No personal identifiers or user data are sent during update checks.

---

## 5. Children's Privacy (COPPA Compliance)

Because Selah Scripture Memory does not collect any personal information, display advertisements, or offer in-app purchases, it is completely safe for users of all ages, including children under 13.

---

## 6. Open Source Transparency

Selah Scripture Memory is open source. You are welcome to inspect our code and verify our privacy practices at:  
[https://github.com/fajos/bible-memo](https://github.com/fajos/bible-memo)

---

## 7. Changes to This Policy

We may update this Privacy Policy from time to time to reflect new features or regulatory requirements. Any updates will be posted to the repository and accessible directly within the App under **Settings > Privacy Policy**.

---

## 8. Developer & Contact Information

Selah Scripture Memory is developed and published by **Femi Adeyemi / Fajostech**.

- **Developer:** Femi Adeyemi / Fajostech
- **Email Support:** [fajostech@gmail.com](mailto:fajostech@gmail.com)
- **Official Website:** [https://fajostech.com](https://fajostech.com)
- **GitHub Repository & Issues:** [https://github.com/fajos/bible-memo](https://github.com/fajos/bible-memo)
