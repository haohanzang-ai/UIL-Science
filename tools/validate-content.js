const fs = require('fs');
const path = require('path');
const { normalizeInsideRepo } = require('./importer/pathGuard');

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
  for (const q of data.questions || []) {
    if (ids.has(q.questionId)) fail(`Duplicate questionId: ${q.questionId}`);
    ids.add(q.questionId);
    if (q.published === true && q.verificationStatus !== 'verified') fail(`Published question is not verified: ${q.questionId}`);
    if (q.published === true && (!Array.isArray(q.citations) || !q.citations.length)) fail(`Published question lacks citations: ${q.questionId}`);
    if (q.published === true && !Array.isArray(q.choices)) fail(`Published question lacks choices: ${q.questionId}`);
    if (q.published === true && q.choices.indexOf(q.officialAnswer) === -1) fail(`Official answer absent from choices: ${q.questionId}`);
  }
}

function validatePublishedExams() {
  const data = readJson('data/processed/published-exams.json');
  for (const exam of data.exams || []) {
    if (exam.published === true && exam.verificationStatus !== 'verified') fail(`Published exam is not verified: ${exam.examId}`);
    if (exam.published === true && (!Array.isArray(exam.questionIds) || exam.questionIds.length !== 60)) fail(`Published exam is incomplete: ${exam.examId}`);
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
