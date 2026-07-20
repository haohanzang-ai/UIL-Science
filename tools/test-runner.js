const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { REPO_ROOT, normalizeInsideRepo } = require('./importer/pathGuard');
const { validateExams } = require('./validate-exams');
const { questionStructureIssues } = require('./question-integrity');
const { citationAuthenticityIssues, sourceFileAuthenticityIssues } = require('./validate-content');
const { explanationIsVerified, instructionalContentIsVerified, sourceRequirementsSatisfied } = require('./overnight-audit');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

function read(rel) {
  return fs.readFileSync(normalizeInsideRepo(rel), 'utf8');
}

test('path guard rejects parent traversal', () => {
  assert.throws(() => normalizeInsideRepo('../outside.pdf'), /traversal|escapes/);
});

test('required reports are present', () => {
  const required = [
    'reports/import-summary.md',
    'reports/duplicate-files.json',
    'reports/ocr-review.json',
    'reports/figure-review.json',
    'reports/answer-conflicts.json',
    'reports/categorization-review.json',
    'reports/explanation-review.json',
    'reports/explanation-categorization-integrity.md',
    'reports/missing-sources.md',
    'reports/publication-blockers.md',
    'reports/source-provenance.json',
    'reports/exam-validation.json',
    'reports/exam-validation.md',
    'reports/security-review.md',
    'reports/test-results.md',
    'references/authoritative-source-policy.json'
  ];
  for (const rel of required) assert.ok(fs.existsSync(normalizeInsideRepo(rel)), `${rel} missing`);
});

test('overnight audit harness is available', () => {
  assert.ok(fs.existsSync(normalizeInsideRepo('tools/overnight-audit.js')), 'tools/overnight-audit.js missing');
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['audit:overnight'], 'node tools/overnight-audit.js');
});

test('exam availability follows completeness thresholds', () => {
  const report = validateExams();
  assert.equal(report.totals.exams, 29);
  assert.equal(report.totals.complete + report.totals.partial + report.totals.blocked, report.totals.exams);
  for (const exam of report.exams) {
    if (exam.status === 'complete') {
      assert.equal(exam.availableQuestions, 60, `${exam.examId} complete count`);
      assert.equal(exam.subjectCounts.biology, 20, `${exam.examId} biology count`);
      assert.equal(exam.subjectCounts.chemistry, 20, `${exam.examId} chemistry count`);
      assert.equal(exam.subjectCounts.physics, 20, `${exam.examId} physics count`);
    }
    if (exam.status === 'usable-partial') {
      assert.ok(exam.availableQuestions >= 55 && exam.availableQuestions <= 59, `${exam.examId} partial threshold`);
      assert.ok(exam.missingQuestions.length > 0, `${exam.examId} missing list`);
    }
    if (exam.availableQuestions < 55) assert.equal(exam.status, 'blocked', `${exam.examId} under threshold`);
  }
});

test('study page removes visible Switch Student feature', () => {
  const haystack = read('study.html') + read('assets/study.js') + read('assets/uil.js');
  assert.equal(/Switch Student|Switch student/.test(haystack), false);
});

test('student labels do not use banned practice wording', () => {
  const haystack = read('study.html') + read('assets/study.js') + read('assets/uil.js');
  assert.equal(/Biology Practice|Chemistry Practice|Physics Practice/.test(haystack), false);
});

test('navigation has no deceptive hash links', () => {
  assert.equal(/href:"#|href:'#'|href="#"/.test(read('assets/uil.js')), false);
});

test('study UI exposes reliable source policy', () => {
  const haystack = read('assets/study.js');
  assert.ok(/Campbell Biology/.test(haystack), 'Campbell Biology trust source missing');
  assert.ok(/College Board AP Biology|AP Classroom/.test(haystack), 'College Board/AP Classroom trust source missing');
  assert.ok(/College Board AP Chemistry \/ AP Classroom/.test(haystack), 'AP Chemistry/AP Classroom trust source missing');
  assert.ok(/Princeton Review AP Chemistry/.test(haystack), 'approved AP Chemistry fallback missing');
  assert.ok(/OpenStax Chemistry 2e/.test(haystack), 'OpenStax Chemistry fallback missing');
  assert.ok(/College Board AP Physics \/ AP Classroom/.test(haystack), 'AP Physics/AP Classroom trust source missing');
  assert.ok(/OpenStax College Physics 2e/.test(haystack), 'OpenStax Physics fallback missing');
  assert.ok(/Generated help is hidden/.test(haystack), 'generated-help source guard missing');
});

test('study instructional help requires exact policy names and claim-level source verification', () => {
  const haystack = read('assets/study.js');
  const evidence = (...sourceNames) => sourceNames.map((sourceName, index) => ({
    sourceName,
    verificationStatus: 'verified',
    supportType: 'direct',
    locator: `test locator ${index + 1}`,
    supportingExcerpt: 'Test-only reviewed source excerpt.'
  }));
  assert.ok(/function explanationIsVerified\(q\)/.test(haystack), 'explanation verification gate missing');
  assert.ok(/claim-level-verified/.test(haystack), 'claim-level verification status missing from display gate');
  assert.ok(/official-source-verified/.test(haystack), 'official-source verification status missing from display gate');
  assert.ok(/function verifiedEvidenceSupportsSubject\(subject, verification\)/.test(haystack), 'direct source-evidence gate missing');
  assert.ok(/function sourceListIncludesApprovedName\(list, approvedNames\)/.test(haystack), 'browser source-name allowlist gate missing');
  assert.ok(!/haystack\.indexOf\(needle\)/.test(haystack), 'browser must not trust instructional sources through substring matching');
  assert.ok(/var trusted = explanationIsVerified\(q\)/.test(haystack), 'solution panel bypasses explanation verification gate');
  assert.ok(/instructionalContentIsVerified\(q, 'hint'\)/.test(haystack), 'hint panel bypasses source verification gate');
  assert.ok(/instructionalContentIsVerified\(q, 'lesson'\)/.test(haystack), 'lesson panel bypasses source verification gate');

  const questions = JSON.parse(read('data/processed/published-questions.json')).questions || [];
  const pending = questions.filter(q => q.explanation && q.explanationVerification && q.explanationVerification.status === 'source-policy-attached');
  assert.ok(pending.length > 0, 'expected pending imported explanations for display-block regression coverage');
  assert.equal(explanationIsVerified(pending[0]), false, 'source-policy attachment alone must not make an explanation displayable');
  assert.equal(explanationIsVerified({
    subject: 'biology',
    explanation: 'reviewed text',
    explanationStatus: 'verified',
    explanationVerification: {
      status: 'claim-level-verified',
      requiredSources: ['Campbell Biology, latest available edition', 'College Board AP Biology Course and Exam Description'],
      sourceEvidence: evidence('Campbell Biology, latest available edition', 'College Board AP Biology Course and Exam Description')
    }
  }), true, 'claim-level verified explanation should remain displayable');
  assert.equal(explanationIsVerified({
    subject: 'biology',
    explanation: 'reviewed text',
    explanationStatus: 'verified',
    explanationVerification: {
      status: 'claim-level-verified',
      requiredSources: ['Campbell Biology, latest available edition', 'College Board AP Biology Course and Exam Description']
    }
  }), false, 'source-name declarations without direct evidence must not make an explanation displayable');
  assert.equal(explanationIsVerified({
    subject: 'biology',
    explanation: 'reviewed text',
    explanationStatus: 'verified',
    explanationVerification: {
      status: 'claim-level-verified',
      requiredSources: ['Unofficial Campbell Biology notes', 'Fake College Board AP Biology blog'],
      sourceEvidence: evidence('Unofficial Campbell Biology notes', 'Fake College Board AP Biology blog')
    }
  }), false, 'source-name lookalikes must not make an explanation displayable');
  assert.equal(explanationIsVerified({
    subject: 'biology',
    explanation: 'reviewed text',
    explanationStatus: 'verified',
    explanationVerification: { status: 'claim-level-verified', requiredSources: ['Campbell Biology'] }
  }), false, 'biology explanation missing College Board/AP alignment must remain hidden');
  assert.equal(sourceRequirementsSatisfied('chemistry', {
    status: 'claim-level-verified',
    requiredSources: ['College Board AP Chemistry Course and Exam Description', 'OpenStax Chemistry 2e'],
    sourceEvidence: evidence('College Board AP Chemistry Course and Exam Description', 'OpenStax Chemistry 2e')
  }), true, 'chemistry support should accept the policy-approved OpenStax fallback');
  assert.equal(instructionalContentIsVerified({
    subject: 'physics',
    hint: 'reviewed hint',
    hintVerification: {
      status: 'verified',
      requiredSources: ['College Board AP Physics Course and Exam Descriptions', 'OpenStax College Physics 2e'],
      sourceEvidence: evidence('College Board AP Physics Course and Exam Descriptions', 'OpenStax College Physics 2e')
    }
  }, 'hint'), true, 'source-verified physics hint should remain displayable');
  assert.equal(instructionalContentIsVerified({
    subject: 'physics',
    lesson: { verified: true, background: 'reviewed lesson' },
    lessonVerification: { status: 'verified', requiredSources: ['College Board AP Physics Course and Exam Descriptions'] }
  }, 'lesson'), false, 'physics lesson missing approved fallback support must remain hidden');
});

test('study layout preserves the simplified learning lane', () => {
  const haystack = read('assets/study.js');
  assert.ok(/<div class="study-main">/.test(haystack), 'central study lane missing');
  assert.ok(/<details class="filter-shell"><summary>Focus/.test(haystack), 'collapsible Focus filters missing');
  assert.ok(/class="reliability-panel"/.test(haystack), 'trusted-source panel missing');
  assert.ok(/<h2>Adaptive queue<\/h2>/.test(haystack), 'adaptive next-best queue missing');
});

test('student-visible questions have authentic answer structure', () => {
  const questions = JSON.parse(read('data/processed/published-questions.json')).questions || [];
  const invalidPublished = questions.filter(q => q.published === true && questionStructureIssues(q).length);
  const invalidAccessible = questions.filter(q => questionStructureIssues(q).length && q.accessible !== false);
  assert.deepEqual(invalidPublished.map(q => q.questionId), [], 'structurally invalid records marked published');
  assert.deepEqual(invalidAccessible.map(q => q.questionId), [], 'structurally invalid records remain student-accessible');
});

test('study catalog rejects duplicate or malformed choices', () => {
  const haystack = read('assets/study.js');
  assert.ok(/x\.published === true/.test(haystack), 'student catalog does not require explicit publication');
  assert.ok(/labels\.length !== 5/.test(haystack), 'five-choice guard missing');
  assert.ok(/labels\.indexOf\(label\) !== index/.test(haystack), 'duplicate-label guard missing');
});

test('published answers retain verified test and answer-key provenance', () => {
  const questions = JSON.parse(read('data/processed/published-questions.json')).questions || [];
  const registry = JSON.parse(read('references/source-registry.json')).sources || [];
  const sourceById = new Map(registry.map(source => [source.sourceId, source]));
  const failures = questions
    .filter(q => q.published === true)
    .map(q => ({ questionId: q.questionId, issues: citationAuthenticityIssues(q, sourceById) }))
    .filter(result => result.issues.length);
  assert.deepEqual(failures, [], 'published answer provenance failures');

  const sample = questions.find(q => q.published === true);
  assert.ok(sample, 'expected a published question for provenance regression coverage');
  const sampleSource = sourceById.get(`${sample.examId}-test`);
  assert.ok(sampleSource, 'expected the sample test source in the registry');
  assert.deepEqual(sourceFileAuthenticityIssues(sampleSource), [], 'approved source bytes do not match the registry hash');
  const rewrittenHash = { ...sampleSource, sha256: '0'.repeat(64) };
  assert.ok(sourceFileAuthenticityIssues(rewrittenHash).includes('source-file-hash-mismatch'), 'rewritten source hash metadata was not checked against file bytes');
  const missingKey = { ...sample, citations: sample.citations.filter(citation => !/-answer-key$/.test(citation.sourceId || '')) };
  assert.ok(citationAuthenticityIssues(missingKey, sourceById).includes('missing-verified-answer-key-citation'), 'missing official key citation was not detected');

  const otherKey = registry.find(source => /-answer-key$/.test(source.sourceId) && source.sourceId !== `${sample.examId}-answer-key`);
  assert.ok(otherKey, 'expected a second official answer key for pairing regression coverage');
  const mismatchedPair = {
    ...sample,
    sourceRefs: { ...sample.sourceRefs, keySha256: otherKey.sha256 },
    citations: sample.citations.map(citation => /-answer-key$/.test(citation.sourceId || '')
      ? { ...citation, sourceId: otherKey.sourceId }
      : citation)
  };
  const pairIssues = citationAuthenticityIssues(mismatchedPair, sourceById);
  assert.ok(pairIssues.includes('answer-key-citation-exam-mismatch'), 'answer key from another exam was not rejected');
  assert.ok(pairIssues.includes('test-answer-key-pair-mismatch'), 'mismatched official test and answer-key packet was not rejected');

  const mismatchedPath = { ...sample, sourceRefs: { ...sample.sourceRefs, keyPdf: otherKey.repositoryPath } };
  assert.ok(citationAuthenticityIssues(mismatchedPath, sourceById).includes('answer-key-source-path-mismatch'), 'answer-key path was not bound to its registry record');
});

test('inline scripts parse', () => {
  for (const file of fs.readdirSync(REPO_ROOT).filter(f => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    scripts.forEach((script, index) => new vm.Script(script, { filename: `${file}:inline-${index + 1}` }));
  }
});

test('browser scripts parse', () => {
  const files = fs.readdirSync(normalizeInsideRepo('assets'))
    .filter(file => file.endsWith('.js'))
    .map(file => `assets/${file}`)
    .concat(fs.readdirSync(REPO_ROOT).filter(file => file.endsWith('.js')));
  for (const file of files) new vm.Script(read(file), { filename: file });
});

function run() {
  const results = [];
  let failed = 0;
  for (const t of tests) {
    try {
      t.fn();
      results.push(`PASS ${t.name}`);
      console.log(`PASS ${t.name}`);
    } catch (err) {
      failed++;
      results.push(`FAIL ${t.name}: ${err.message}`);
      console.error(`FAIL ${t.name}: ${err.message}`);
    }
  }
  fs.writeFileSync(normalizeInsideRepo('reports/test-results.md'), [
    '# Test Results',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Runtime: Node ${process.version}`,
    `Summary: ${tests.length - failed} passed, ${failed} failed`,
    '',
    ...results,
    ''
  ].join('\n'));
  if (failed) process.exit(1);
}

if (require.main === module) run();

module.exports = { run };
