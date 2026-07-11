const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { normalizeInsideRepo } = require('./pathGuard');

const PYTHON = process.env.CODEX_PYTHON || 'C:\\Users\\lingw\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const TEST_PDF = 'data/source-pdfs/uil/2024-set-a/science-test-a-2024.pdf';
const KEY_PDF = 'data/source-pdfs/uil/2024-set-a/science-key-a-2024.pdf';
const HANDBOOK_PDF = 'references/uil/science-handbook-2025-2026.pdf';
const EXAM_ID = 'uil-2024-invitational-a';
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

function sha256(rel) {
  return crypto.createHash('sha256').update(fs.readFileSync(normalizeInsideRepo(rel))).digest('hex');
}

function runPythonExtract() {
  const script = `
import pdfplumber, json, sys
test_pdf = ${JSON.stringify(normalizeInsideRepo(TEST_PDF))}
key_pdf = ${JSON.stringify(normalizeInsideRepo(KEY_PDF))}
out = {"testPages": [], "keyPages": []}
with pdfplumber.open(test_pdf) as pdf:
    for idx, page in enumerate(pdf.pages, 1):
        w, h = page.width, page.height
        cols = []
        for bbox in [(0, 0, w/2, h), (w/2, 0, w, h)]:
            cols.append(page.crop(bbox).extract_text(x_tolerance=1, y_tolerance=3) or "")
        out["testPages"].append({"page": idx, "columns": cols, "fullText": page.extract_text() or ""})
with pdfplumber.open(key_pdf) as pdf:
    for idx, page in enumerate(pdf.pages, 1):
        out["keyPages"].append({"page": idx, "text": page.extract_text() or ""})
print(json.dumps(out))
`;
  const res = spawnSync(PYTHON, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  if (res.status !== 0) throw new Error(res.stderr || res.stdout || 'PDF extraction failed.');
  return JSON.parse(res.stdout);
}

function normalizeText(s) {
  return String(s || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ﬁ/g, 'fi')
    .replace(/−/g, '-')
    .trim();
}

function parseAnswers(keyText) {
  const answers = {};
  const re = /([BCP])(\d{2})\.\s*([A-E])/g;
  let m;
  while ((m = re.exec(keyText))) {
    answers[`${m[1]}${m[2]}`] = m[3];
  }
  return answers;
}

function splitQuestionBlocks(text) {
  const clean = normalizeText(text);
  const re = /([BCP]\d{2})\.\s/g;
  const matches = [...clean.matchAll(re)];
  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : clean.length;
    blocks.push(clean.slice(start, end).trim());
  }
  return blocks;
}

function parseBlock(block) {
  const idMatch = block.match(/^([BCP])(\d{2})\.\s*/);
  if (!idMatch) return null;
  const prefix = idMatch[1];
  const number = Number(idMatch[2]);
  const qid = `${prefix}${String(number).padStart(2, '0')}`;
  const body = block.slice(idMatch[0].length);
  const choiceRe = /\s([A-E])\)\s/g;
  const choices = [...body.matchAll(choiceRe)];
  if (choices.length < 5) {
    return { qid, prefix, number, blocked: true, reason: `Expected 5 choices, found ${choices.length}.`, raw: block };
  }
  const stem = body.slice(0, choices[0].index).trim();
  const parsedChoices = [];
  for (let i = 0; i < 5; i++) {
    const start = choices[i].index + choices[i][0].length;
    const end = i + 1 < 5 ? choices[i + 1].index : body.length;
    parsedChoices.push({
      label: choices[i][1],
      text: body.slice(start, end).trim()
    });
  }
  return { qid, prefix, number, stem, choices: parsedChoices, raw: block };
}

function subjectFor(prefix) {
  return prefix === 'B' ? 'biology' : prefix === 'C' ? 'chemistry' : 'physics';
}

function hasFigureRisk(q) {
  const haystack = `${q.stem} ${q.choices.map(c => c.text).join(' ')}`.toLowerCase();
  return /\b(figure|diagram|graph|table|shown|below|above|image|drawing|circuit|orbital shown|energy level diagram)\b/.test(haystack);
}

function parseSolutions(keyPages) {
  const joined = keyPages.slice(1).map(p => p.text).join('\n');
  const re = /([CP]\d{2})\.\s*\(([A-E])\)\s*/g;
  const matches = [...joined.matchAll(re)];
  const out = {};
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : joined.length;
    out[matches[i][1]] = normalizeText(joined.slice(start, end));
  }
  return out;
}

function citation(sourceId, page, section, excerpt) {
  return { sourceId, page, section, supportingExcerpt: excerpt.slice(0, 280), supportType: 'direct', verificationStatus: 'verified' };
}

function run() {
  const extracted = runPythonExtract();
  const testHash = sha256(TEST_PDF);
  const keyHash = sha256(KEY_PDF);
  const handbookHash = sha256(HANDBOOK_PDF);
  const answers = parseAnswers(extracted.keyPages[0].text);
  const solutions = parseSolutions(extracted.keyPages);
  const blocks = [];
  for (const page of extracted.testPages.slice(1, 11)) {
    for (const col of page.columns) {
      for (const block of splitQuestionBlocks(col)) blocks.push({ page: page.page, parsed: parseBlock(block) });
    }
  }

  const questions = [];
  const review = [];
  for (const item of blocks) {
    const q = item.parsed;
    if (!q || q.blocked) {
      review.push({ page: item.page, ...q, status: 'needs-review' });
      continue;
    }
    const official = answers[q.qid];
    const blockers = [];
    if (!official) blockers.push('missing official answer');
    if (q.choices.length !== 5) blockers.push('choice count is not 5');
    if (!LETTERS.includes(official)) blockers.push('official answer is not A-E');
    if (hasFigureRisk(q)) blockers.push('possible figure/table/diagram dependency requires visual crop validation');
    if (q.stem.length < 10) blockers.push('stem too short');
    const solution = solutions[q.qid] || '';
    const canPublishQuestionOnly = blockers.length === 0;
    const record = {
      schemaVersion: 1,
      questionId: `${EXAM_ID}-${q.qid.toLowerCase()}`,
      examId: EXAM_ID,
      year: 2024,
      contestLevel: 'invitational',
      set: 'A',
      sourceQuestionCode: q.qid,
      questionNumber: q.prefix === 'B' ? q.number : q.prefix === 'C' ? 20 + q.number : 40 + q.number,
      originalSubjectNumber: q.number,
      subject: subjectFor(q.prefix),
      stem: q.stem,
      choices: q.choices,
      officialAnswer: official,
      verificationStatus: canPublishQuestionOnly ? 'verified' : 'needs-review',
      published: canPublishQuestionOnly,
      explanationStatus: solution ? 'key-solution-imported-needs-claim-review' : 'missing-explanation',
      explanation: solution || '',
      sourceRefs: {
        testPdf: TEST_PDF,
        testSha256: testHash,
        keyPdf: KEY_PDF,
        keySha256: keyHash,
        testPage: item.page,
        keyPage: 1
      },
      categorization: {
        framework: q.prefix === 'P' ? 'UIL-Specific or Beyond-AP' : '',
        unitCode: '',
        unitName: '',
        topicCode: '',
        topicName: '',
        secondaryTopicCodes: [],
        uilSpecificCategory: '',
        categorizationEvidence: [],
        categorizationStatus: 'needs-review'
      },
      citations: [
        citation('uil-2024-invitational-a-test', String(item.page), q.qid, q.raw),
        citation('uil-2024-invitational-a-answer-key', '1', 'Official answer table', `${q.qid}. ${official}`)
      ],
      publicationNotes: canPublishQuestionOnly
        ? 'Question text and official answer are source-paired. Explanations and AP categorization remain hidden/review-needed.'
        : blockers.join('; ')
    };
    questions.push(record);
    if (!canPublishQuestionOnly || record.explanationStatus !== 'key-solution-imported-needs-claim-review') {
      review.push({ questionId: record.questionId, qid: q.qid, page: item.page, blockers, explanationStatus: record.explanationStatus });
    }
  }

  const published = questions.filter(q => q.published);
  const exam = {
    schemaVersion: 1,
    examId: EXAM_ID,
    title: 'UIL Science Invitational A 2024',
    year: 2024,
    contestLevel: 'invitational',
    set: 'A',
    questionIds: published.length === 60 ? published.sort((a,b)=>a.questionNumber-b.questionNumber).map(q => q.questionId) : [],
    contentHash: crypto.createHash('sha256').update(JSON.stringify(published.map(q => [q.questionId, q.stem, q.choices, q.officialAnswer]))).digest('hex'),
    verificationStatus: published.length === 60 ? 'verified' : 'needs-review',
    published: published.length === 60
  };

  fs.writeFileSync(normalizeInsideRepo('data/processed/published-questions.json'), JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    questions: published.sort((a,b)=>a.questionNumber-b.questionNumber)
  }, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('data/processed/published-exams.json'), JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    exams: exam.published ? [exam] : []
  }, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('data/review/imported-questions-2024-set-a.json'), JSON.stringify({
    schemaVersion: 1,
    examId: EXAM_ID,
    importedAt: new Date().toISOString(),
    totalParsed: questions.length,
    publishedQuestionOnly: published.length,
    review
  }, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('references/source-registry.json'), JSON.stringify({
    schemaVersion: 1,
    sources: [
      {
        sourceId: 'uil-2024-invitational-a-test',
        title: 'UIL High School Science Contest Invitational A 2024 Test',
        authorOrOrganization: 'University Interscholastic League',
        publisher: 'University Interscholastic League',
        edition: '',
        publicationYear: 2024,
        documentVersion: 'Invitational A 2024',
        sourceType: 'uil',
        repositoryPath: TEST_PDF,
        approved: true,
        approvedForSubjects: ['biology', 'chemistry', 'physics'],
        verifiedOn: new Date().toISOString().slice(0, 10),
        sha256: testHash,
        notes: 'Imported from user-approved archive; identity verified from PDF title text.'
      },
      {
        sourceId: 'uil-2024-invitational-a-answer-key',
        title: 'UIL High School Science Contest Answer Key 2024 Invitational A',
        authorOrOrganization: 'University Interscholastic League',
        publisher: 'University Interscholastic League',
        edition: '',
        publicationYear: 2024,
        documentVersion: 'Invitational A 2024',
        sourceType: 'uil',
        repositoryPath: KEY_PDF,
        approved: true,
        approvedForSubjects: ['biology', 'chemistry', 'physics'],
        verifiedOn: new Date().toISOString().slice(0, 10),
        sha256: keyHash,
        notes: 'Official answer table contains B01-B20, C01-C20, P01-P20.'
      },
      {
        sourceId: 'uil-science-handbook-2025-2026',
        title: 'Science Handbook 2025-2026',
        authorOrOrganization: 'University Interscholastic League',
        publisher: 'University Interscholastic League',
        edition: '',
        publicationYear: 2025,
        documentVersion: '2025-2026',
        sourceType: 'uil',
        repositoryPath: HANDBOOK_PDF,
        approved: true,
        approvedForSubjects: ['biology', 'chemistry', 'physics'],
        verifiedOn: new Date().toISOString().slice(0, 10),
        sha256: handbookHash,
        notes: 'Imported from user-approved archive for rules/guide review.'
      }
    ]
  }, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('reports/import-summary.md'), [
    '# Import Summary',
    '',
    'Imported source set: UIL Science Invitational A 2024.',
    `Parsed question records: ${questions.length}`,
    `Published question-only records: ${published.length}`,
    `Review/blocker records: ${review.length}`,
    '',
    'Published records include source-paired question text and official answer letters. Explanations and AP/UIL categorization remain marked for review unless independently validated.',
    ''
  ].join('\n'));
  fs.writeFileSync(normalizeInsideRepo('reports/publication-blockers.md'), [
    '# Publication Blockers',
    '',
    exam.published ? '- Full 2024 Invitational A exam shell passed the 60 published-question count.' : '- Full exam mode remains blocked because not all 60 questions passed publication checks.',
    '- Biology explanations are missing from the imported answer key.',
    '- AP CED topic-code evidence is still missing from repository sources.',
    '- Figure-dependent questions remain blocked until crop validation is implemented.',
    '- Claim-level explanation citations remain required before showing explanations as verified.',
    ''
  ].join('\n'));
  console.log(JSON.stringify({ parsed: questions.length, published: published.length, review: review.length, examPublished: exam.published }, null, 2));
}

if (require.main === module) run();

module.exports = { run };
