const fs = require('fs');
const path = require('path');
const { normalizeInsideRepo } = require('./importer/pathGuard');
const { validateExams } = require('./validate-exams');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(normalizeInsideRepo(rel), 'utf8'));
}

function fail(message) {
  throw new Error(message);
}

function validateRegistry() {
  const registry = readJson('references/source-registry.json');
  if (!Array.isArray(registry.sources)) fail('source-registry.json must contain sources[].');
  for (const source of registry.sources) {
    if (source.approved && !source.sha256) fail(`Approved source missing sha256: ${source.sourceId}`);
    if (source.repositoryPath) normalizeInsideRepo(source.repositoryPath);
  }
}

function validatePublishedQuestions() {
  const data = readJson('data/processed/published-questions.json');
  const ids = new Set();
  const conflicts = [];
  for (const q of data.questions || []) {
    if (ids.has(q.questionId)) fail(`Duplicate questionId: ${q.questionId}`);
    ids.add(q.questionId);
    if (q.published === true && !['verified', 'available'].includes(q.verificationStatus)) fail(`Published question has unsupported verification status: ${q.questionId}`);
    if (q.published === true && (!Array.isArray(q.citations) || !q.citations.length)) fail(`Published question lacks citations: ${q.questionId}`);
    if (q.published === true && !Array.isArray(q.choices)) fail(`Published question lacks choices: ${q.questionId}`);
    if (q.published === true) {
      const labels = q.choices.map(choice => typeof choice === 'string' ? choice : choice && choice.label);
      if (!labels.includes(q.officialAnswer)) conflicts.push({ questionId: q.questionId, examId: q.examId, officialAnswer: q.officialAnswer || null, labels });
    }
  }
  fs.writeFileSync(normalizeInsideRepo('reports/question-answer-conflicts.json'), JSON.stringify({ generatedAt: new Date().toISOString(), conflicts }, null, 2) + '\n');
}

function validatePublishedExams() {
  const report = validateExams();
  for (const exam of report.exams) {
    if (exam.status === 'complete') {
      if (exam.availableQuestions !== 60) fail(`Complete exam count mismatch: ${exam.examId}`);
      if (exam.subjectCounts.biology !== 20 || exam.subjectCounts.chemistry !== 20 || exam.subjectCounts.physics !== 20) fail(`Complete exam subject count mismatch: ${exam.examId}`);
    }
    if (exam.status === 'usable-partial') {
      if (exam.availableQuestions < 55 || exam.availableQuestions > 59) fail(`Partial exam threshold mismatch: ${exam.examId}`);
      if (!exam.samePdf) fail(`Partial exam uses multiple PDFs: ${exam.examId}`);
    }
    if (exam.answerIssues.length && exam.status !== 'blocked') fail(`Conflicted exam is still available: ${exam.examId}`);
  }
}

function run() {
  validateRegistry();
  validatePublishedQuestions();
  validatePublishedExams();
  console.log('Content validation passed.');
}

if (require.main === module) run();

module.exports = { run };
