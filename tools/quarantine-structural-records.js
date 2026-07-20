const fs = require('fs');
const crypto = require('crypto');
const { normalizeInsideRepo } = require('./importer/pathGuard');
const { questionStructureIssues } = require('./question-integrity');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(normalizeInsideRepo(rel), 'utf8'));
}

function writeJson(rel, value) {
  fs.writeFileSync(normalizeInsideRepo(rel), JSON.stringify(value, null, 2) + '\n');
}

function run() {
  const questionData = readJson('data/processed/published-questions.json');
  const examData = readJson('data/processed/published-exams.json');
  const questions = questionData.questions || [];
  let quarantined = 0;

  for (const q of questions) {
    const issues = questionStructureIssues(q);
    if (!issues.length) continue;
    q.published = false;
    q.accessible = false;
    q.verificationStatus = 'needs-review';
    q.publicationBlockReasons = issues;
    quarantined++;
  }

  const visibleById = new Map(questions.filter(q => q.published === true && q.accessible !== false).map(q => [q.questionId, q]));
  for (const exam of examData.exams || []) {
    exam.questionIds = (exam.questionIds || []).filter(id => visibleById.has(id));
    exam.accessibleQuestionCount = exam.questionIds.length;
    exam.accessible = exam.questionIds.length > 0;
    exam.published = exam.accessible;
    exam.contentHash = crypto.createHash('sha256').update(JSON.stringify(exam.questionIds.map(id => {
      const q = visibleById.get(id);
      return [q.questionId, q.stem, q.choices, q.officialAnswer];
    }))).digest('hex');
  }

  const generatedAt = new Date().toISOString();
  questionData.generatedAt = generatedAt;
  questionData.accessPolicy = 'structurally-valid-source-backed-questions-visible';
  questionData.accessibleQuestionCount = visibleById.size;
  examData.generatedAt = generatedAt;
  writeJson('data/processed/published-questions.json', questionData);
  writeJson('data/processed/published-exams.json', examData);
  console.log(`Quarantined ${quarantined} structurally invalid records; ${visibleById.size} questions remain student-visible.`);
}

if (require.main === module) run();

module.exports = { run };
