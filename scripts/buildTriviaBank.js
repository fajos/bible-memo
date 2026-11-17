const fs = require('fs');
const path = require('path');

const categories = [
  { file: 'oldTestament.js', name: 'Old Testament', prefix: 'ot_' },
  { file: 'newTestament.js', name: 'New Testament', prefix: 'nt_' },
  { file: 'gospels.js', name: 'Gospels', prefix: 'g_' },
  { file: 'characters.js', name: 'Characters', prefix: 'c_' },
  { file: 'booksOfTheBible.js', name: 'Books of the Bible', prefix: 'b_' },
  { file: 'miracles.js', name: 'Miracles', prefix: 'm_' },
  { file: 'parables.js', name: 'Parables', prefix: 'p_' },
];

console.log('Compiling 1,050 question trivia bank from scripts/triviaData/...\n');

let allQuestions = [];
const idSet = new Set();
const questionTextSet = new Set();
const errors = [];

for (const cat of categories) {
  const filePath = path.join(__dirname, 'triviaData', cat.file);
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath}`);
    continue;
  }

  const list = require(filePath);
  console.log(`- Loaded ${cat.name} (${cat.file}): ${list.length} questions`);

  if (list.length !== 150) {
    errors.push(`${cat.name} does not have exactly 150 questions (has ${list.length})`);
  }

  let easyCount = 0;
  let medCount = 0;
  let hardCount = 0;

  list.forEach((q, idx) => {
    // Check ID
    if (!q.id || typeof q.id !== 'string') {
      errors.push(`[${cat.name} index ${idx}] Invalid or missing ID`);
    } else if (idSet.has(q.id)) {
      errors.push(`Duplicate ID: ${q.id}`);
    } else {
      idSet.add(q.id);
    }

    // Check category
    if (q.category !== cat.name) {
      errors.push(`[${q.id}] Mismatched category: expected "${cat.name}", got "${q.category}"`);
    }

    // Check difficulty
    if (q.difficulty === 'easy') easyCount++;
    else if (q.difficulty === 'medium') medCount++;
    else if (q.difficulty === 'hard') hardCount++;
    else errors.push(`[${q.id}] Invalid difficulty: "${q.difficulty}"`);

    // Check question text
    if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) {
      errors.push(`[${q.id}] Missing or empty question text`);
    } else {
      const normalizedQ = q.question.trim().toLowerCase();
      if (questionTextSet.has(normalizedQ)) {
        errors.push(`Duplicate question text found at [${q.id}]: "${q.question}"`);
      } else {
        questionTextSet.add(normalizedQ);
      }
    }

    // Check options
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`[${q.id}] Options array must contain exactly 4 items`);
    } else {
      const optSet = new Set(q.options.map(o => String(o).trim().toLowerCase()));
      if (optSet.size !== 4) {
        errors.push(`[${q.id}] Duplicate options found: ${JSON.stringify(q.options)}`);
      }
      q.options.forEach((opt, oIdx) => {
        if (!opt || typeof opt !== 'string' || opt.trim().length === 0) {
          errors.push(`[${q.id}] Option index ${oIdx} is empty or non-string`);
        }
      });
    }

    // Check correctIndex
    if (typeof q.correctIndex !== 'number' || ![0, 1, 2, 3].includes(q.correctIndex)) {
      errors.push(`[${q.id}] Invalid correctIndex: ${q.correctIndex}`);
    }

    // Check reference
    if (!q.reference || typeof q.reference !== 'string' || q.reference.trim().length === 0) {
      errors.push(`[${q.id}] Missing reference`);
    }

    // Check explanation
    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length === 0) {
      errors.push(`[${q.id}] Missing explanation`);
    }

    allQuestions.push(q);
  });

  if (easyCount !== 50 || medCount !== 50 || hardCount !== 50) {
    errors.push(`${cat.name} difficulty counts mismatch: Easy=${easyCount}, Med=${medCount}, Hard=${hardCount} (expected 50 each)`);
  }
}

if (errors.length > 0) {
  console.error('\nValidation errors encountered:');
  errors.forEach(e => console.error('  ERROR:', e));
  process.exit(1);
}

if (allQuestions.length !== 1050) {
  console.error(`\nERROR: Total question count is ${allQuestions.length}, expected 1050.`);
  process.exit(1);
}

const outputPath = path.join(__dirname, '..', 'data', 'triviaBank.json');
fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2), 'utf8');

const stats = fs.statSync(outputPath);
const sizeKb = (stats.size / 1024).toFixed(2);

console.log(`\nSUCCESS: 1,050 questions validated and compiled!`);
console.log(`Output written to: ${outputPath} (${sizeKb} KB)`);
console.log(`All 7 categories verified: 150 questions each (50 Easy, 50 Medium, 50 Hard)`);
console.log(`Total IDs verified: ${idSet.size} unique`);
console.log(`Zero duplicate questions, zero malformed fields.\n`);
