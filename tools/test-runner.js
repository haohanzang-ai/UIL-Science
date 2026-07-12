const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { REPO_ROOT, normalizeInsideRepo } = require('./importer/pathGuard');

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
    'reports/security-review.md',
    'reports/test-results.md',
    'references/authoritative-source-policy.json'
  ];
  for (const rel of required) assert.ok(fs.existsSync(normalizeInsideRepo(rel)), `${rel} missing`);
});

test('student labels do not use banned practice wording', () => {
  const haystack = read('study.html') + read('assets/study.js') + read('assets/uil.js');
  assert.equal(/Biology Practice|Chemistry Practice|Physics Practice/.test(haystack), false);
});

test('navigation has no deceptive hash links', () => {
  assert.equal(/href:"#|href:'#'|href="#"/.test(read('assets/uil.js')), false);
});

test('inline scripts parse', () => {
  for (const file of fs.readdirSync(REPO_ROOT).filter(f => f.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8');
    const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    scripts.forEach((script, index) => new vm.Script(script, { filename: `${file}:inline-${index + 1}` }));
  }
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
  fs.writeFileSync(normalizeInsideRepo('reports/test-results.md'), ['# Test Results', '', ...results, ''].join('\n'));
  if (failed) process.exit(1);
}

if (require.main === module) run();

module.exports = { run };
