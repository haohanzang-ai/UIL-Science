/* ============================================================
   Importer for REAL questions.
   Usage:  node import.js path/to/your-questions.json
   The DB stays empty until you run this with your own data.
   See import-format.md for the field spec and import-template.json.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { db } = require('./db');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node import.js <path-to-json>');
  console.error('The JSON must be an array of question objects (see import-format.md).');
  process.exit(1);
}
const raw = fs.readFileSync(path.resolve(file), 'utf8');
let items;
try { items = JSON.parse(raw); } catch (e) { console.error('Invalid JSON:', e.message); process.exit(1); }
if (!Array.isArray(items)) { console.error('Top-level JSON must be an array.'); process.exit(1); }

const cols = [
  'source','year','question_number','scan_crop_url','subject','topic','subtopic','difficulty',
  'textbook_chapter','stem','choices','correct_answer','explanation',
  'ocr_extracted','answer_key_matched','explanation_linked','ai_topic_tagged','coach_reviewed',
  'approved_for_practice','extraction_confidence','topic_tag_confidence','answer_key_match_status',
  'last_reviewed_by','last_reviewed_at','coach_notes'
];
const stmt = db.prepare(
  `INSERT INTO questions (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
);

const tx = db.transaction((rows) => {
  let n = 0;
  for (const q of rows) {
    const vals = cols.map(c => {
      if (c === 'choices') return JSON.stringify(q.choices || []);
      if (c === 'explanation_linked') return q.explanation ? 1 : (q.explanation_linked ? 1 : 0);
      if (c === 'answer_key_match_status') return q.answer_key_match_status || (q.answer_key_matched ? 'matched' : 'unmatched');
      // default the boolean flags to 0 and confidences to null when absent — never invent values
      if (['ocr_extracted','answer_key_matched','ai_topic_tagged','coach_reviewed','approved_for_practice'].includes(c))
        return q[c] ? 1 : 0;
      return q[c] === undefined ? null : q[c];
    });
    stmt.run(...vals);
    n++;
  }
  return n;
});

const count = tx(items);
console.log(`Imported ${count} question(s).`);
console.log('Reminder: questions are NOT visible to students until approved_for_practice = 1');
console.log('Review and approve them in the Admin Review page.');
