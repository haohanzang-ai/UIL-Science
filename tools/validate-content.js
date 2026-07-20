const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeInsideRepo } = require('./importer/pathGuard');
const { validateExams } = require('./validate-exams');
const { questionStructureIssues } = require('./question-integrity');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(normalizeInsideRepo(rel), 'utf8'));
}

function fail(message) {
  throw new Error(message);
}

function sourceFileAuthenticityIssues(source) {
  const issues = [];
  if (!source || !source.repositoryPath) return ['missing-repository-path'];
  if (!/^[a-f0-9]{64}$/i.test(String(source.sha256 || ''))) issues.push('missing-or-invalid-sha256');
  let sourcePath;
  try {
    sourcePath = normalizeInsideRepo(source.repositoryPath);
  } catch (_) {
    return [...issues, 'invalid-repository-path'];
  }
  if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) return [...issues, 'missing-source-file'];
  const actualHash = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
  if (actualHash !== String(source.sha256 || '').toLowerCase()) issues.push('source-file-hash-mismatch');
  return [...new Set(issues)];
}

function validateRegistry() {
  const registry = readJson('references/source-registry.json');
  if (!Array.isArray(registry.sources)) fail('source-registry.json must contain sources[].');
  const sourceIds = new Set();
  for (const source of registry.sources) {
    if (!source || !String(source.sourceId || '').trim()) fail('Registered source is missing sourceId.');
    if (sourceIds.has(source.sourceId)) fail(`Duplicate registered sourceId: ${source.sourceId}`);
    sourceIds.add(source.sourceId);
    if (source.approved) {
      const issues = sourceFileAuthenticityIssues(source);
      if (issues.length) fail(`Approved source file authenticity failure: ${source.sourceId} (${issues.join(', ')})`);
    } else if (source.repositoryPath) {
      normalizeInsideRepo(source.repositoryPath);
    }
  }
  return registry;
}

function sourcePathsMatch(left, right) {
  try {
    return normalizeInsideRepo(left) === normalizeInsideRepo(right);
  } catch (_) {
    return false;
  }
}

function citationAuthenticityIssues(q, sourceById) {
  const issues = [];
  const citations = Array.isArray(q.citations) ? q.citations : [];
  const testCitations = citations.filter(citation => /-test$/.test(citation && citation.sourceId || ''));
  const keyCitations = citations.filter(citation => /-answer-key$/.test(citation && citation.sourceId || ''));
  if (!testCitations.length) issues.push('missing-verified-test-citation');
  if (!keyCitations.length) issues.push('missing-verified-answer-key-citation');

  for (const citation of testCitations.concat(keyCitations)) {
    const source = sourceById.get(citation.sourceId);
    const isKey = keyCitations.includes(citation);
    const expectedSourceId = `${q.examId}${isKey ? '-answer-key' : '-test'}`;
    const expectedHash = q.sourceRefs && q.sourceRefs[isKey ? 'keySha256' : 'testSha256'];
    const expectedPath = q.sourceRefs && q.sourceRefs[isKey ? 'keyPdf' : 'testPdf'];
    if (!q.examId || citation.sourceId !== expectedSourceId) {
      issues.push(`${isKey ? 'answer-key' : 'test'}-citation-exam-mismatch`);
    }
    if (citation.verificationStatus !== 'verified' || citation.supportType !== 'direct' || !String(citation.supportingExcerpt || '').trim()) {
      issues.push(`unverified-${isKey ? 'answer-key' : 'test'}-citation`);
    }
    if (!source || !Array.isArray(source.approvedForSubjects) || !source.approvedForSubjects.includes(q.subject)) {
      issues.push(`source-not-approved-for-${q.subject}`);
    }
    if (!expectedHash || !source || source.sha256 !== expectedHash) {
      issues.push(`${isKey ? 'answer-key' : 'test'}-source-hash-mismatch`);
    }
    if (!source || !sourcePathsMatch(expectedPath, source.repositoryPath)) {
      issues.push(`${isKey ? 'answer-key' : 'test'}-source-path-mismatch`);
    }
    if (isKey) {
      const excerpt = String(citation.supportingExcerpt || '').toUpperCase();
      const questionCode = String(q.sourceQuestionCode || '').toUpperCase();
      const answer = String(q.officialAnswer || '').toUpperCase();
      const answerPattern = new RegExp(`(?:^|[^A-Z])${answer}(?:$|[^A-Z])`);
      if (!questionCode || !excerpt.includes(questionCode) || !answer || !answerPattern.test(excerpt)) {
        issues.push('answer-key-excerpt-does-not-support-answer');
      }
    }
  }
  const citedTestSources = testCitations.map(citation => sourceById.get(citation.sourceId)).filter(Boolean);
  const citedKeySources = keyCitations.map(citation => sourceById.get(citation.sourceId)).filter(Boolean);
  if (citedTestSources.length && citedKeySources.length && citedTestSources.some(testSource =>
      citedKeySources.some(keySource => !testSource.documentVersion || testSource.documentVersion !== keySource.documentVersion))) {
    issues.push('test-answer-key-pair-mismatch');
  }
  return [...new Set(issues)];
}

function validatePublishedQuestions(registry) {
  const data = readJson('data/processed/published-questions.json');
  const ids = new Set();
  const conflicts = [];
  const approvedSourceIds = new Set(registry.sources.filter(source => source.approved).map(source => source.sourceId));
  const sourceById = new Map(registry.sources.map(source => [source.sourceId, source]));
  let published = 0;
  let quarantined = 0;
  for (const q of data.questions || []) {
    if (ids.has(q.questionId)) fail(`Duplicate questionId: ${q.questionId}`);
    ids.add(q.questionId);
    const issues = questionStructureIssues(q);
    if (issues.length) conflicts.push({ questionId: q.questionId, examId: q.examId, officialAnswer: q.officialAnswer || null, labels: (q.choices || []).map(choice => typeof choice === 'string' ? null : choice && choice.label), issues });
    if (q.published === true) {
      published++;
      if (q.accessible === false) fail(`Published question is marked inaccessible: ${q.questionId}`);
      if (!['verified', 'available'].includes(q.verificationStatus)) fail(`Published question has unsupported verification status: ${q.questionId}`);
      if (issues.length) fail(`Published question has structural authenticity issues: ${q.questionId} (${issues.join(', ')})`);
      if (!Array.isArray(q.citations) || !q.citations.length) fail(`Published question lacks citations: ${q.questionId}`);
      for (const citation of q.citations) {
        if (!citation || !approvedSourceIds.has(citation.sourceId)) fail(`Published question cites an unapproved or unregistered source: ${q.questionId} (${citation && citation.sourceId || 'blank'})`);
      }
      const citationIssues = citationAuthenticityIssues(q, sourceById);
      if (citationIssues.length) fail(`Published question lacks authentic source pairing: ${q.questionId} (${citationIssues.join(', ')})`);
    } else if (issues.length) {
      quarantined++;
      if (q.accessible !== false) fail(`Structurally invalid question is not quarantined from student access: ${q.questionId}`);
    }
  }
  fs.writeFileSync(normalizeInsideRepo('reports/question-answer-conflicts.json'), JSON.stringify({ generatedAt: new Date().toISOString(), conflicts }, null, 2) + '\n');
  return { questions: ids.size, published, quarantined, structuralConflicts: conflicts.length };
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
  const registry = validateRegistry();
  const summary = validatePublishedQuestions(registry);
  validatePublishedExams();
  console.log(`Content validation passed: ${summary.published} published, ${summary.quarantined} structurally invalid records quarantined.`);
}

if (require.main === module) run();

module.exports = { run, citationAuthenticityIssues, questionStructureIssues, sourceFileAuthenticityIssues, validatePublishedQuestions, validateRegistry };
