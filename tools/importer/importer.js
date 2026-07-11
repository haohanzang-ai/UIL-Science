const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { REPO_ROOT, normalizeInsideRepo, repoRelative } = require('./pathGuard');

const SOURCE_DIR = normalizeInsideRepo('data/source-pdfs');
const REPORT_DIR = normalizeInsideRepo('reports');
const REVIEW_DIR = normalizeInsideRepo('data/review');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

function listSourceFiles() {
  if (!fs.existsSync(SOURCE_DIR)) return [];
  return fs.readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => path.join(SOURCE_DIR, d.name))
    .filter(file => ['.pdf'].includes(path.extname(file).toLowerCase()));
}

function writeJson(relPath, data) {
  const out = normalizeInsideRepo(relPath);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
}

function writeText(relPath, text) {
  const out = normalizeInsideRepo(relPath);
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, text);
}

function run() {
  ensureDir(REPORT_DIR);
  ensureDir(REVIEW_DIR);
  const files = listSourceFiles();
  const seen = new Map();
  const duplicates = [];
  const sources = files.map(file => {
    const hash = sha256(file);
    if (seen.has(hash)) duplicates.push({ sha256: hash, files: [seen.get(hash), repoRelative(file)] });
    else seen.set(hash, repoRelative(file));
    return {
      file: repoRelative(file),
      sha256: hash,
      status: 'needs-review',
      reason: 'Importer is repository-local and does not publish until OCR, answer-key, figure, categorization, explanation, and citation gates are implemented and passed.'
    };
  });

  writeJson('reports/duplicate-files.json', duplicates);
  writeJson('reports/source-provenance.json', { repoRoot: repoRelative(REPO_ROOT), files: sources });
  writeText('reports/import-summary.md', [
    '# Import Summary',
    '',
    `Repository root: \`${REPO_ROOT}\``,
    `Source PDFs found: ${files.length}`,
    '',
    'No questions were published. All source files require human/source validation and publication gates before use.',
    ''
  ].join('\n'));
  writeText('reports/publication-blockers.md', [
    '# Publication Blockers',
    '',
    '- No approved source registry entries exist.',
    '- No official UIL exam PDFs or answer keys have been validated inside the repository.',
    '- No College Board CED files are registered for AP topic mapping.',
    '- OCR, figure crop validation, categorization, and explanation evidence gates are not passed.',
    ''
  ].join('\n'));
}

if (require.main === module) run();

module.exports = { run, listSourceFiles };
