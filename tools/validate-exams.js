const fs = require('fs');
const { normalizeInsideRepo } = require('./importer/pathGuard');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(normalizeInsideRepo(rel), 'utf8'));
}

function write(rel, value) {
  fs.writeFileSync(normalizeInsideRepo(rel), value);
}

function validateExams() {
  const questions = readJson('data/processed/published-questions.json').questions || [];
  const exams = readJson('data/processed/published-exams.json').exams || [];
  const byId = new Map(questions.map(q => [q.questionId, q]));
  const report = {
    generatedAt: new Date().toISOString(),
    totals: { exams: exams.length, complete: 0, partial: 0, blocked: 0 },
    exams: [],
    missingQuestions: [],
    answerConflicts: [],
    figureProblems: [],
    duplicateQuestions: []
  };

  for (const exam of exams) {
    const ids = Array.isArray(exam.questionIds) ? exam.questionIds : [];
    const seen = new Set();
    const duplicates = ids.filter(id => seen.has(id) ? true : (seen.add(id), false));
    const rows = ids.map(id => byId.get(id)).filter(Boolean);
    const counts = { biology: 0, chemistry: 0, physics: 0 };
    const nums = new Set();
    const sourcePdfs = new Set();
    const missing = [];
    const answerIssues = [];
    const figureIssues = [];

    for (const q of rows) {
      counts[q.subject] = (counts[q.subject] || 0) + 1;
      nums.add(Number(q.questionNumber));
      if (q.sourceRefs && q.sourceRefs.testPdf) sourcePdfs.add(q.sourceRefs.testPdf);
      const choices = Array.isArray(q.choices) ? q.choices.map(c => c && c.label) : [];
      if (!q.officialAnswer || !choices.includes(q.officialAnswer)) answerIssues.push(q.questionId);
      if ((q.figureRequired || q.hasFigure) && !(q.figureUrl || q.figure || q.imageUrl || q.diagramUrl)) figureIssues.push(q.questionId);
    }
    for (let i = 1; i <= 60; i++) if (!nums.has(i)) missing.push(i);

    const samePdf = sourcePdfs.size <= 1;
    const complete = rows.length === 60 && missing.length === 0 && counts.biology === 20 && counts.chemistry === 20 && counts.physics === 20 && samePdf && answerIssues.length === 0 && figureIssues.length === 0 && duplicates.length === 0;
    const partial = !complete && rows.length >= 55 && rows.length <= 59 && samePdf && answerIssues.length === 0 && figureIssues.length === 0 && duplicates.length === 0;
    const status = complete ? 'complete' : partial ? 'usable-partial' : 'blocked';
    report.totals[complete ? 'complete' : partial ? 'partial' : 'blocked']++;

    const entry = {
      examId: exam.examId,
      title: exam.title,
      year: exam.year,
      contestLevel: exam.contestLevel,
      set: exam.set,
      status,
      availableQuestions: rows.length,
      subjectCounts: counts,
      missingQuestions: missing,
      sourcePdfs: [...sourcePdfs],
      samePdf,
      duplicateQuestionIds: duplicates,
      answerIssues,
      figureIssues
    };
    report.exams.push(entry);
    if (missing.length) report.missingQuestions.push({ examId: exam.examId, missingQuestions: missing });
    if (duplicates.length) report.duplicateQuestions.push({ examId: exam.examId, duplicateQuestionIds: duplicates });
    if (answerIssues.length) report.answerConflicts.push({ examId: exam.examId, questionIds: answerIssues });
    if (figureIssues.length) report.figureProblems.push({ examId: exam.examId, questionIds: figureIssues });
  }

  write('reports/exam-validation.json', JSON.stringify(report, null, 2) + '\n');
  write('reports/exam-validation.md', [
    '# Exam Validation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Exams validated: ${report.totals.exams}`,
    `Complete: ${report.totals.complete}`,
    `Usable partial: ${report.totals.partial}`,
    `Blocked: ${report.totals.blocked}`,
    '',
    '| Exam | Status | Questions | Biology | Chemistry | Physics | Missing |',
    '| --- | --- | ---: | ---: | ---: | ---: | --- |',
    ...report.exams.map(e => `| ${e.examId} | ${e.status} | ${e.availableQuestions}/60 | ${e.subjectCounts.biology} | ${e.subjectCounts.chemistry} | ${e.subjectCounts.physics} | ${e.missingQuestions.join(', ') || 'none'} |`),
    ''
  ].join('\n'));
  return report;
}

if (require.main === module) {
  const report = validateExams();
  console.log(`Exam validation complete: ${report.totals.complete} complete, ${report.totals.partial} partial, ${report.totals.blocked} blocked.`);
}

module.exports = { validateExams };
