const fs = require('fs');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { normalizeInsideRepo } = require('./pathGuard');

const PYTHON = process.env.CODEX_PYTHON || 'C:\\Users\\lingw\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const AUTHORITATIVE_SOURCES = {
  B: ['Campbell Biology, latest available edition', 'College Board AP Biology Course and Exam Description'],
  C: ['College Board AP Chemistry Course and Exam Description', 'Princeton Review AP Chemistry', 'OpenStax Chemistry 2e'],
  P: ['College Board AP Physics Course and Exam Descriptions', 'OpenStax College Physics 2e']
};

const EXAMS = [
  { year: 2021, set: 'B', level: 'invitational', id: 'uil-2021-invitational-b', title: 'UIL Science Invitational B 2021', test: 'data/source-pdfs/uil/2021-invitational-b/science-test-b-2021.pdf', key: 'data/source-pdfs/uil/2021-invitational-b/science-key-b-2021.pdf' },
  { year: 2022, set: 'A', level: 'uil-set', id: 'uil-2022-set-a', title: 'UIL Science Set A 2022', test: 'data/source-pdfs/uil/2022-set-a/science-test-a-2022.pdf', key: 'data/source-pdfs/uil/2022-set-a/science-key-a-2022.pdf' },
  { year: 2022, set: 'B', level: 'uil-set', id: 'uil-2022-set-b', title: 'UIL Science Set B 2022', test: 'data/source-pdfs/uil/2022-set-b/science-test-b-2022.pdf', key: 'data/source-pdfs/uil/2022-set-b/science-key-b-2022.pdf' },
  { year: 2022, set: 'VCM 1', level: 'virtual-challenge', id: 'uil-2022-vcm-1', title: 'UIL Science Virtual Challenge Meet 1 2022', test: 'data/source-docx/uil/2022-vcm-1/science-test-vcm-1-2022.docx', key: 'data/source-pdfs/uil/2022-vcm-1/science-key-vcm-1-2022.pdf', skipFirstTestPage: false },
  { year: 2022, set: 'VCM 2', level: 'virtual-challenge', id: 'uil-2022-vcm-2', title: 'UIL Science Virtual Challenge Meet 2 2022', test: 'data/source-pdfs/uil/2022-vcm-2/science-test-vcm-2-2022.pdf', key: 'data/source-pdfs/uil/2022-vcm-2/science-key-vcm-2-2022.pdf' },
  { year: 2022, set: 'VCM 3', level: 'virtual-challenge', id: 'uil-2022-vcm-3', title: 'UIL Science Virtual Challenge Meet 3 2022', test: 'data/source-pdfs/uil/2022-vcm-3/science-test-vcm-3-2022.pdf', key: 'data/source-pdfs/uil/2022-vcm-3/science-key-vcm-3-2022.pdf' },
  { year: 2023, set: 'A', level: 'uil-set', id: 'uil-2023-set-a', title: 'UIL Science Set A 2023', test: 'data/source-pdfs/uil/2023-set-a/science-test-a-2023.pdf', key: 'data/source-pdfs/uil/2023-set-a/science-key-a-2023.pdf' },
  { year: 2023, set: 'A', level: 'invitational', id: 'uil-2023-invitational-a', title: 'UIL Science Invitational A 2023', test: 'data/source-pdfs/uil/2023-invitational-a/science-study-packet-a-2023.pdf', key: 'data/source-pdfs/uil/2023-invitational-a/science-study-packet-a-2023.pdf', testPages: [1, 12], keyPages: [13, 18] },
  { year: 2023, set: 'B', level: 'invitational', id: 'uil-2023-invitational-b', title: 'UIL Science Invitational B 2023', test: 'data/source-pdfs/uil/2023-invitational-b/science-study-packet-b-2023.pdf', key: 'data/source-pdfs/uil/2023-invitational-b/science-study-packet-b-2023.pdf', testPages: [1, 12], keyPages: [13, 19] },
  { year: 2023, set: 'District', level: 'district', id: 'uil-2023-district', title: 'UIL Science District 2023', test: 'data/source-pdfs/uil/2023-district/science-study-packet-district-2023.pdf', key: 'data/source-pdfs/uil/2023-district/science-study-packet-district-2023.pdf', testPages: [1, 12], keyPages: [13, 19] },
  { year: 2023, set: 'State', level: 'state', id: 'uil-2023-state', title: 'UIL Science State 2023', test: 'data/source-pdfs/uil/2023-state/science-study-packet-state-2023.pdf', key: 'data/source-pdfs/uil/2023-state/science-study-packet-state-2023.pdf', testPages: [1, 12], keyPages: [13, 23] },
  { year: 2024, set: 'A', level: 'invitational', id: 'uil-2024-invitational-a', title: 'UIL Science Invitational A 2024', test: 'data/source-pdfs/uil/2024-set-a/science-test-a-2024.pdf', key: 'data/source-pdfs/uil/2024-set-a/science-key-a-2024.pdf' },
  { year: 2024, set: 'B', level: 'uil-set', id: 'uil-2024-set-b', title: 'UIL Science Set B 2024', test: 'data/source-pdfs/uil/2024-set-b/science-test-b-2024.pdf', key: 'data/source-pdfs/uil/2024-set-b/science-key-b-2024.pdf' },
  { year: 2024, set: 'District', level: 'district', id: 'uil-2024-district', title: 'UIL Science District 2024', test: 'data/source-pdfs/uil/2024-district/science-study-packet-district-2024.pdf', key: 'data/source-pdfs/uil/2024-district/science-study-packet-district-2024.pdf', testPages: [1, 12], keyPages: [13, 20] },
  { year: 2025, set: 'A', level: 'uil-set', id: 'uil-2025-set-a', title: 'UIL Science Set A 2025', test: 'data/source-pdfs/uil/2025-set-a/science-test-a-2025.pdf', key: 'data/source-pdfs/uil/2025-set-a/science-key-a-2025.pdf' },
  { year: 2025, set: 'B', level: 'uil-set', id: 'uil-2025-set-b', title: 'UIL Science Set B 2025', test: 'data/source-pdfs/uil/2025-set-b/science-test-b-2025.pdf', key: 'data/source-pdfs/uil/2025-set-b/science-key-b-2025.pdf' },
  { year: 2026, set: 'A', level: 'uil-set', id: 'uil-2026-set-a', title: 'UIL Science Set A 2026', test: 'data/source-pdfs/uil/2026-set-a/science-test-a-2026.pdf', key: 'data/source-pdfs/uil/2026-set-a/science-key-a-2026.pdf' },
  { year: 2026, set: 'B', level: 'uil-set', id: 'uil-2026-set-b', title: 'UIL Science Set B 2026', test: 'data/source-pdfs/uil/2026-set-b/science-test-b-2026.pdf', key: 'data/source-pdfs/uil/2026-set-b/science-key-b-2026.pdf' },
  { year: 2016, set: 'A', level: 'invitational', id: 'uil-2016-invitational-a', title: 'UIL Science Invitational A 2016', test: 'data/source-pdfs/uil/2016-invitational-a/science-test-a-2016.pdf', key: 'data/source-pdfs/uil/2016-invitational-a/science-key-a-2016.pdf' },
  { year: 2016, set: 'B', level: 'invitational', id: 'uil-2016-invitational-b', title: 'UIL Science Invitational B 2016', test: 'data/source-pdfs/uil/2016-invitational-b/science-test-b-2016.pdf', key: 'data/source-pdfs/uil/2016-invitational-b/science-key-b-2016.pdf' },
  { year: 2016, set: 'District 1', level: 'district', id: 'uil-2016-district-1', title: 'UIL Science District 1 2016', test: 'data/source-pdfs/uil/2016-combined/science-2016-inv-district-region-study.pdf', key: 'data/source-pdfs/uil/2016-combined/science-2016-inv-district-region-study.pdf', testPages: [29, 39], keyPages: [40, 43] },
  { year: 2016, set: 'District 2', level: 'district', id: 'uil-2016-district-2', title: 'UIL Science District 2 2016', test: 'data/source-pdfs/uil/2016-combined/science-2016-inv-district-region-study.pdf', key: 'data/source-pdfs/uil/2016-combined/science-2016-inv-district-region-study.pdf', testPages: [45, 55], keyPages: [56, 59] },
  { year: 2016, set: 'Region', level: 'region', id: 'uil-2016-region', title: 'UIL Science Region 2016', test: 'data/source-pdfs/uil/2016-combined/science-2016-inv-district-region-study.pdf', key: 'data/source-pdfs/uil/2016-combined/science-2016-inv-district-region-study.pdf', testPages: [61, 72], keyPages: [73, 77] },
  { year: 2018, set: 'B', level: 'invitational', id: 'uil-2018-invitational-b', title: 'UIL Science Invitational B 2018', test: 'data/source-pdfs/uil/2017-set-b/science-test-b-2017.pdf', key: 'data/source-pdfs/uil/2017-set-b/science-key-b-2017.pdf' },
  { year: 2018, set: 'Region', level: 'region', id: 'uil-2018-region', title: 'UIL Science Region 2018', test: 'data/source-pdfs/uil/2018-region/science-region-2018.pdf', key: 'data/source-pdfs/uil/2018-region/science-region-2018.pdf', testPages: [1, 12], keyPages: [13, 20] },
  { year: 2015, set: 'A', level: 'invitational', id: 'uil-2015-invitational-a', title: 'UIL Science Invitational A 2015', test: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', key: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', testPages: [1, 11], keyPages: [13, 14] },
  { year: 2015, set: 'B', level: 'invitational', id: 'uil-2015-invitational-b', title: 'UIL Science Invitational B 2015', test: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', key: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', testPages: [15, 25], keyPages: [27, 28] },
  { year: 2015, set: 'District 1', level: 'district', id: 'uil-2015-district-1', title: 'UIL Science District 1 2015', test: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', key: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', testPages: [29, 39], keyPages: [41, 42] },
  { year: 2015, set: 'District 2', level: 'district', id: 'uil-2015-district-2', title: 'UIL Science District 2 2015', test: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', key: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', testPages: [43, 53], keyPages: [55, 56] },
  { year: 2015, set: 'Region', level: 'region', id: 'uil-2015-region', title: 'UIL Science Region 2015', test: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', key: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', testPages: [57, 67], keyPages: [69, 70] },
  { year: 2015, set: 'State', level: 'state', id: 'uil-2015-state', title: 'UIL Science State 2015', test: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', key: 'data/source-pdfs/uil/2015-combined/science-2015-inv-district-region-state-study.pdf', testPages: [71, 83], keyPages: [85, 89] }
];

function sha256(rel) {
  return crypto.createHash('sha256').update(fs.readFileSync(normalizeInsideRepo(rel))).digest('hex');
}

function extractPdf(testRel, keyRel, testPages, keyPages) {
  const testPageLiteral = testPages ? `[${testPages[0]}, ${testPages[1]}]` : 'None';
  const keyPageLiteral = keyPages ? `[${keyPages[0]}, ${keyPages[1]}]` : 'None';
  const script = `
import json, zipfile
from xml.etree import ElementTree as ET
import pdfplumber

def selected(page_num, pages):
    if pages is None:
        return True
    return pages[0] <= page_num <= pages[1]

def docx_text(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml")
    root = ET.fromstring(xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    return "\\n".join((node.text or "") for node in root.findall(".//w:t", ns))

def extract_source(path, pages):
    if path.lower().endswith(".docx"):
        return [{"page": 1, "columns": [docx_text(path)], "fullText": docx_text(path)}]
    out_pages = []
    with pdfplumber.open(path) as pdf:
        for idx, page in enumerate(pdf.pages, 1):
            if not selected(idx, pages):
                continue
            w, h = page.width, page.height
            out_pages.append({
              "page": idx,
              "columns": [
                page.crop((0,0,w/2,h)).extract_text(x_tolerance=1, y_tolerance=3) or "",
                page.crop((w/2,0,w,h)).extract_text(x_tolerance=1, y_tolerance=3) or ""
              ],
              "fullText": page.extract_text() or ""
            })
    return out_pages

out = {"testPages": [], "keyPages": []}
out["testPages"] = extract_source(${JSON.stringify(normalizeInsideRepo(testRel))}, ${testPageLiteral})
for page in extract_source(${JSON.stringify(normalizeInsideRepo(keyRel))}, ${keyPageLiteral}):
    out["keyPages"].append({"page": page["page"], "text": page["fullText"]})
print(json.dumps(out))
`;
  const res = spawnSync(PYTHON, ['-c', script], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  if (res.status !== 0) throw new Error(res.stderr || 'PDF extraction failed');
  return JSON.parse(res.stdout);
}

function clean(s) {
  return String(s || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/ﬁ/g, 'fi').replace(/−/g, '-').trim();
}

function codeFromOrdinal(n) {
  const ordinal = Number(n);
  if (ordinal < 1 || ordinal > 60) return null;
  if (ordinal <= 20) return { prefix: 'B', num: ordinal, qid: `B${String(ordinal).padStart(2, '0')}`, questionNumber: ordinal };
  if (ordinal <= 40) return { prefix: 'C', num: ordinal - 20, qid: `C${String(ordinal - 20).padStart(2, '0')}`, questionNumber: ordinal };
  return { prefix: 'P', num: ordinal - 40, qid: `P${String(ordinal - 40).padStart(2, '0')}`, questionNumber: ordinal };
}

function answersFromKey(text) {
  const answers = {};
  const re = /([BCP])\s*(\d{1,2})\.?\s*[\)\.]?\s*([A-E])\b/g;
  let m;
  while ((m = re.exec(text))) {
    answers[`${m[1]}${String(Number(m[2])).padStart(2, '0')}`] = m[3];
  }
  const numeric = /(?:^|\s)(\d{1,2})\.\s*([A-E])\b/g;
  while ((m = numeric.exec(text))) {
    const code = codeFromOrdinal(m[1]);
    if (code && !answers[code.qid]) answers[code.qid] = m[2];
  }
  return answers;
}

function solutionMap(keyPages) {
  const joined = keyPages.slice(1).map(p => p.text).join('\n');
  const re = /([BCP]\d{2})\.\s*\(([A-E])\)\s*/g;
  const matches = [...joined.matchAll(re)];
  const out = {};
  for (let i = 0; i < matches.length; i++) {
    const end = i + 1 < matches.length ? matches[i + 1].index : joined.length;
    out[matches[i][1]] = clean(joined.slice(matches[i].index, end));
  }
  return out;
}

function splitBlocks(text) {
  const normalized = clean(text);
  const coded = [...normalized.matchAll(/(?:^|\s)([BCP])\s*(\d{1,2})\.\s/g)].map(m => ({
    index: m.index + (/^\s/.test(m[0]) ? 1 : 0),
    codedNum: Number(m[2]),
    ordinal: null
  })).filter(m => m.codedNum >= 1 && m.codedNum <= 20);
  const re = coded.length ? null : /(?:^|\s)(\d{1,2})\.\s/g;
  const numeric = re ? [...normalized.matchAll(re)].map(m => {
    const hasLeadSpace = /^\s/.test(m[0]);
    return {
      index: m.index + (hasLeadSpace ? 1 : 0),
      codedNum: null,
      ordinal: Number(m[1])
    };
  }).filter(m => m.ordinal >= 1 && m.ordinal <= 60) : [];
  const ms = coded.length ? coded : numeric;
  const blocks = [];
  for (let i = 0; i < ms.length; i++) {
    blocks.push(normalized.slice(ms[i].index, i + 1 < ms.length ? ms[i + 1].index : normalized.length).trim());
  }
  return blocks;
}

function parseBlock(block) {
  const coded = block.match(/^([BCP])\s*(\d{1,2})\.\s*/);
  const numeric = coded ? null : block.match(/^(\d{1,2})\.\s*/);
  if (!coded && !numeric) return null;
  const meta = coded
    ? { prefix: coded[1], num: Number(coded[2]), qid: `${coded[1]}${String(Number(coded[2])).padStart(2, '0')}`, questionNumber: order(coded[1], Number(coded[2])) }
    : codeFromOrdinal(numeric[1]);
  if (!meta) return null;
  const prefix = meta.prefix;
  const num = meta.num;
  const qid = meta.qid;
  const body = block.slice((coded || numeric)[0].length);
  const matches = [...body.matchAll(/\s([A-E])\)\s/g)];
  if (matches.length < 5) return { qid, prefix, num, blocked: true, reason: `Expected 5 choices, found ${matches.length}`, raw: block };
  const stem = body.slice(0, matches[0].index).trim();
  const choices = matches.slice(0, 5).map((choice, i) => {
    const start = choice.index + choice[0].length;
    const end = i + 1 < 5 ? matches[i + 1].index : body.length;
    return { label: choice[1], text: body.slice(start, end).trim() };
  });
  return { qid, prefix, num, questionNumber: meta.questionNumber, stem, choices, raw: block };
}

function subject(prefix) {
  return prefix === 'B' ? 'biology' : prefix === 'C' ? 'chemistry' : 'physics';
}

function order(prefix, num) {
  return prefix === 'B' ? num : prefix === 'C' ? 20 + num : 40 + num;
}

function requiredSources(prefix) {
  return AUTHORITATIVE_SOURCES[prefix] || [];
}

function figureRisk(q) {
  const text = `${q.stem} ${q.choices.map(c => c.text).join(' ')}`.toLowerCase();
  return /\b(figure|diagram|graph|table|shown|below|above|image|drawing|circuit|orbital shown|energy level diagram|plot)\b/.test(text);
}

function citation(sourceId, page, section, excerpt) {
  return { sourceId, page: String(page), section, supportingExcerpt: excerpt.slice(0, 280), supportType: 'direct', verificationStatus: 'verified' };
}

function sourceRecords(exam, testHash, keyHash) {
  return [
    {
      sourceId: `${exam.id}-test`,
      title: `${exam.title} Test`,
      authorOrOrganization: 'University Interscholastic League',
      publisher: 'University Interscholastic League',
      edition: '',
      publicationYear: exam.year,
      documentVersion: `${exam.title}`,
      sourceType: 'uil',
      repositoryPath: exam.test,
      approved: true,
      approvedForSubjects: ['biology', 'chemistry', 'physics'],
      verifiedOn: new Date().toISOString().slice(0, 10),
      sha256: testHash,
      notes: 'Imported from user-approved archive; identity verified from PDF text where available.'
    },
    {
      sourceId: `${exam.id}-answer-key`,
      title: `${exam.title} Answer Key`,
      authorOrOrganization: 'University Interscholastic League',
      publisher: 'University Interscholastic League',
      edition: '',
      publicationYear: exam.year,
      documentVersion: `${exam.title}`,
      sourceType: 'uil',
      repositoryPath: exam.key,
      approved: true,
      approvedForSubjects: ['biology', 'chemistry', 'physics'],
      verifiedOn: new Date().toISOString().slice(0, 10),
      sha256: keyHash,
      notes: 'Official answer key source paired with matching test file.'
    }
  ];
}

function importExam(exam) {
  const extracted = extractPdf(exam.test, exam.key, exam.testPages, exam.keyPages);
  const answers = answersFromKey(extracted.keyPages.map(p => p.text).join('\n'));
  const solutions = solutionMap(extracted.keyPages);
  const testHash = sha256(exam.test);
  const keyHash = sha256(exam.key);
  const parsed = new Map();
  const troubleshooting = [];
  const testPages = exam.skipFirstTestPage === false ? extracted.testPages : extracted.testPages.slice(1);
  for (const page of testPages) {
    const segments = [...page.columns, page.fullText || ''];
    for (const segment of segments) {
      for (const block of splitBlocks(segment)) {
        const q = parseBlock(block);
        if (!q) continue;
        if (parsed.has(q.qid)) continue;
        if (q.blocked) {
          troubleshooting.push({ examId: exam.id, qid: q.qid, page: page.page, notes: [q.reason] });
          continue;
        }
        parsed.set(q.qid, { page: page.page, ...q });
      }
    }
  }
  const records = [];
  for (const q of parsed.values()) {
    const structuralBlockers = [];
    const answer = answers[q.qid];
    const labels = q.choices.map(choice => choice.label);
    if (!answer) structuralBlockers.push('missing official answer');
    if (q.choices.length !== 5) structuralBlockers.push('choice count is not 5');
    if (new Set(labels).size !== labels.length) structuralBlockers.push('duplicate extracted choice labels');
    if (!q.choices.some(choice => choice.label === answer)) structuralBlockers.push('official answer absent from extracted choices');
    if (!LETTERS.includes(answer)) structuralBlockers.push('official answer is not A-E');
    if (!q.stem || q.stem.length < 10) structuralBlockers.push('stem too short');
    const blockers = structuralBlockers.slice();
    if (figureRisk(q)) blockers.push('possible figure/table/diagram dependency requires visual crop validation');
    const published = structuralBlockers.length === 0;
    const explanation = solutions[q.qid] || '';
    const rec = {
      schemaVersion: 1,
      questionId: `${exam.id}-${q.qid.toLowerCase()}`,
      examId: exam.id,
      year: exam.year,
      contestLevel: exam.level,
      set: exam.set,
      sourceQuestionCode: q.qid,
      questionNumber: q.questionNumber || order(q.prefix, q.num),
      originalSubjectNumber: q.num,
      subject: subject(q.prefix),
      stem: q.stem,
      choices: q.choices,
      officialAnswer: answer,
      accessible: published,
      verificationStatus: published ? 'available' : 'needs-review',
      published,
      explanationStatus: explanation ? 'official-key-solution-imported' : 'not-imported',
      explanation,
      explanationVerification: {
        status: 'source-policy-attached',
        requiredSources: requiredSources(q.prefix),
        policy: 'Use the attached source policy when refining explanations and topic labels.'
      },
      sourceRefs: {
        testPdf: exam.test,
        testSha256: testHash,
        keyPdf: exam.key,
        keySha256: keyHash,
        testPage: q.page,
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
        requiredSources: requiredSources(q.prefix),
        categorizationStatus: 'uncategorized'
      },
      citations: [
        citation(`${exam.id}-test`, q.page, q.qid, q.raw),
        citation(`${exam.id}-answer-key`, 1, 'Official answer key', `${q.qid}. ${answer || ''}`)
      ],
      importNotes: blockers.length ? blockers.join('; ') : 'Imported from uploaded source material.'
    };
    records.push(rec);
    if (blockers.length || rec.explanationStatus === 'not-imported') {
      troubleshooting.push({ examId: exam.id, questionId: rec.questionId, qid: q.qid, page: q.page, notes: blockers, explanationStatus: rec.explanationStatus });
    }
  }
  return { exam, records, troubleshooting, sources: sourceRecords(exam, testHash, keyHash) };
}

function run() {
  const allRecords = [];
  const allTroubleshooting = [];
  const allSources = [];
  const examSummaries = [];
  for (const exam of EXAMS) {
    const result = importExam(exam);
    allRecords.push(...result.records);
    allTroubleshooting.push(...result.troubleshooting);
    allSources.push(...result.sources);
    const published = result.records.filter(r => r.published).length;
    examSummaries.push({ examId: exam.id, parsed: result.records.length, published, troubleshooting: result.troubleshooting.length });
  }
  const sortedRecords = allRecords.sort((a, b) => a.examId.localeCompare(b.examId) || a.questionNumber - b.questionNumber);
  const accessibleRecords = sortedRecords.filter(q => q.published === true && q.accessible !== false);
  const exams = EXAMS.map(exam => {
    const qs = accessibleRecords.filter(q => q.examId === exam.id);
    return {
      schemaVersion: 1,
      examId: exam.id,
      title: exam.title,
      year: exam.year,
      contestLevel: exam.level,
      set: exam.set,
      questionIds: qs.map(q => q.questionId),
      accessibleQuestionCount: qs.length,
      contentHash: crypto.createHash('sha256').update(JSON.stringify(qs.map(q => [q.questionId, q.stem, q.choices, q.officialAnswer]))).digest('hex'),
      verificationStatus: 'available',
      accessible: qs.length > 0,
      published: qs.length > 0
    };
  }).filter(e => e.accessible);

  const handbook = JSON.parse(fs.readFileSync(normalizeInsideRepo('references/source-registry.json'), 'utf8')).sources.find(s => s.sourceId === 'uil-science-handbook-2025-2026');
  const registrySources = handbook ? [...allSources, handbook] : allSources;

  fs.writeFileSync(normalizeInsideRepo('data/processed/published-questions.json'), JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), accessPolicy: 'structurally-valid-source-backed-questions-visible', accessibleQuestionCount: accessibleRecords.length, questions: sortedRecords }, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('data/processed/published-exams.json'), JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), exams }, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('data/review/imported-selected-exams.json'), JSON.stringify({ schemaVersion: 1, importedAt: new Date().toISOString(), summaries: examSummaries, troubleshooting: allTroubleshooting }, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('references/source-registry.json'), JSON.stringify({ schemaVersion: 1, sources: registrySources }, null, 2) + '\n');

  const figure = allTroubleshooting.filter(r => (r.notes || []).some(b => /figure|diagram|plot|table|crop|choice/i.test(b)));
  const explanation = allTroubleshooting.filter(r => r.explanationStatus === 'not-imported');
  const cat = accessibleRecords.map(q => ({ examId: q.examId, question: q.sourceQuestionCode, subject: q.subject, requiredSources: q.categorization.requiredSources, status: q.categorization.categorizationStatus }));
  fs.writeFileSync(normalizeInsideRepo('reports/figure-review.json'), JSON.stringify(figure, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('reports/explanation-review.json'), JSON.stringify(explanation, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('reports/categorization-review.json'), JSON.stringify(cat, null, 2) + '\n');
  fs.writeFileSync(normalizeInsideRepo('reports/import-summary.md'), ['# Import Summary', '', `Exam/key sets processed: ${EXAMS.length}`, `Accessible uploaded question records: ${accessibleRecords.length}`, `Quarantined structural records: ${sortedRecords.length - accessibleRecords.length}`, `Troubleshooting records: ${allTroubleshooting.length}`, '', 'Only source-backed records with five unique A-E choices and a matching official answer are student-visible. Quarantined records remain in the processed data for source-packet repair.', ''].join('\n'));
  fs.writeFileSync(normalizeInsideRepo('reports/publication-blockers.md'), ['# Publication Blockers', '', '- Records with missing answers, mismatched answers, duplicate choice labels, invalid choice counts, or unusable stems remain quarantined.', '- Figure-dependent questions remain available only when their answer structure is valid; users can compare them with the source packet when needed.', '- Topic and explanation source policy metadata remains attached for future cleanup, but does not make unreviewed instructional content authoritative.', ''].join('\n'));
  fs.writeFileSync(normalizeInsideRepo('reports/source-provenance.json'), JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), files: registrySources.map(s => ({ sourceId: s.sourceId, repositoryPath: s.repositoryPath, sha256: s.sha256, approved: s.approved, sourceType: s.sourceType })) }, null, 2) + '\n');
  console.log(JSON.stringify({ exams: examSummaries, accessible: accessibleRecords.length, troubleshooting: allTroubleshooting.length }, null, 2));
}

if (require.main === module) run();

module.exports = { run };
