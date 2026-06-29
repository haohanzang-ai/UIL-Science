/* ============================================================
   Importer for REAL questions (libSQL/Turso or local file).
   Usage:  node import.js path/to/your-questions.json
   See import-format.md for the field spec and import-template.json.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { init, run } = require('./db');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node import.js <path-to-json>');
  process.exit(1);
}
let items;
try { items = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')); }
catch (e) { console.error('Invalid JSON:', e.message); process.exit(1); }
if (!Array.isArray(items)) { console.error('Top-level JSON must be an array.'); process.exit(1); }

const cols = [
  'source','year','question_number','scan_crop_url','subject','topic','subtopic','difficulty',
  'textbook_chapter','stem','choices','correct_answer','explanation',
  'ocr_extracted','answer_key_matched','explanation_linked','ai_topic_tagged','coach_reviewed',
  'approved_for_practice','extraction_confidence','topic_tag_confidence','answer_key_match_status',
  'last_reviewed_by','last_reviewed_at','coach_notes'
];
const placeholders = cols.map(() => '?').join(',');

function valueFor(q, c) {
  if (c === 'choices') return JSON.stringify(q.choices || []);
  if (c === 'explanation_linked') return q.explanation ? 1 : (q.explanation_linked ? 1 : 0);
  if (c === 'answer_key_match_status') return q.answer_key_match_status || (q.answer_key_matched ? 'matched' : 'unmatched');
  if (['ocr_extracted','answer_key_matched','ai_topic_tagged','coach_reviewed','approved_for_practice'].includes(c)) return q[c] ? 1 : 0;
  return q[c] === undefined ? null : q[c];
}

(async () => {
  await init();
  let n = 0;
  for (const q of items) {
    await run(`INSERT INTO questions (${cols.join(',')}) VALUES (${placeholders})`, cols.map(c => valueFor(q, c)));
    n++;
  }
  console.log(`Imported ${n} question(s).`);
  console.log('Reminder: questions are NOT visible to students until approved (approved_for_practice = 1) in Admin Review.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
