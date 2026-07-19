const fs = require('fs');
const { spawnSync } = require('child_process');
const { normalizeInsideRepo } = require('./importer/pathGuard');

const ROUNDS = Math.max(1, Math.min(12, Number(process.env.AUDIT_ROUNDS || 3)));

function readJson(rel) {
  return JSON.parse(fs.readFileSync(normalizeInsideRepo(rel), 'utf8'));
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: normalizeInsideRepo('.'),
    encoding: 'utf8'
  });
  return {
    command: `node ${args.join(' ')}`,
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim()
  };
}

function includesAny(list, needles) {
  const haystack = (list || []).join(' ').toLowerCase();
  return needles.some(needle => haystack.includes(needle));
}

function contentAudit() {
  const policy = readJson('references/authoritative-source-policy.json');
  const data = readJson('data/processed/published-questions.json');
  const totals = {
    questions: 0,
    published: 0,
    citations: 0,
    sourcePolicyAttached: 0,
    explanationImported: 0,
    unsupportedExplanations: 0,
    biologyMissingCampbell: 0,
    biologyMissingCollegeBoard: 0,
    needsAuthoritativeReview: 0
  };
  const samples = [];
  const trustedExplanationStatuses = ['official', 'official-key-solution-imported', 'verified', 'captain-reviewed'];

  for (const q of data.questions || []) {
    totals.questions++;
    if (q.published === true) totals.published++;
    if (Array.isArray(q.citations) && q.citations.length) totals.citations++;
    if (q.explanationVerification && q.explanationVerification.status) totals.sourcePolicyAttached++;
    if (q.explanation) totals.explanationImported++;
    if (q.explanation && !trustedExplanationStatuses.includes(q.explanationStatus)) {
      totals.unsupportedExplanations++;
      samples.push(`${q.questionId}: explanation exists but status is ${q.explanationStatus || 'blank'}`);
    }
    if (q.categorization && q.categorization.sourceReviewStatus === 'needs-authoritative-source-review') {
      totals.needsAuthoritativeReview++;
    }
    if (q.subject === 'biology') {
      const required = []
        .concat(q.explanationVerification && q.explanationVerification.requiredSources || [])
        .concat(q.categorization && q.categorization.requiredSources || []);
      if (!includesAny(required, ['campbell'])) totals.biologyMissingCampbell++;
      if (!includesAny(required, ['college board', 'ap biology'])) totals.biologyMissingCollegeBoard++;
    }
  }

  return { policy: policy.policy, totals, samples: samples.slice(0, 20) };
}

function improvementBacklog(audit) {
  return [
    'Simplify subject pages into one primary question lane plus collapsible focus controls.',
    'Keep reliable-source status visible beside every question without forcing students through long reference text.',
    'Use missed, unanswered, and bookmarked attempts to choose the next-best local question automatically.',
    'Add claim-level explanation records before showing generated explanations.',
    'Require Biology explanations to cite Campbell Biology plus College Board/AP Classroom alignment before becoming verified.',
    'Require Chemistry and Physics generated help to cite College Board/AP Classroom framework sources, with approved textbook fallback only where policy allows.',
    'Track every generated hint/explanation draft as untrusted until review metadata, source IDs, and source excerpts are attached.',
    'Run repeated content validation, UI syntax parsing, and source-policy audits before publishing new learning content.',
    'Promote weak-topic practice based on recent misses and spaced-review due dates instead of static topic lists alone.',
    'Keep a nightly audit report so each refinement cycle has evidence: failures, source gaps, generated-content blocks, and next actions.'
  ];
}

function renderReport(rounds, audit) {
  const lines = [
    '# Overnight Learning Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Rounds requested: ${ROUNDS}`,
    '',
    '## Repeated Checks',
    ''
  ];
  rounds.forEach((round, index) => {
    lines.push(`### Round ${index + 1}`);
    round.commands.forEach(cmd => {
      lines.push(`- ${cmd.status === 0 ? 'PASS' : 'FAIL'} ${cmd.command}`);
      if (cmd.stderr) lines.push(`  - stderr: ${cmd.stderr.split(/\r?\n/)[0]}`);
    });
    lines.push('');
  });

  lines.push('## Source Reliability Metrics', '');
  Object.entries(audit.totals).forEach(([key, value]) => lines.push(`- ${key}: ${value}`));
  lines.push('', '## 10 Improvements Toward Automated Reliable Learning', '');
  improvementBacklog(audit).forEach((item, index) => lines.push(`${index + 1}. ${item}`));
  lines.push('', '## Source Policy', '', audit.policy);
  if (audit.samples.length) {
    lines.push('', '## Sample Blocks', '');
    audit.samples.forEach(sample => lines.push(`- ${sample}`));
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const rounds = [];
  for (let i = 0; i < ROUNDS; i++) {
    rounds.push({
      commands: [
        runNode(['tools/test-runner.js']),
        runNode(['tools/validate-content.js'])
      ]
    });
  }
  const audit = contentAudit();
  fs.writeFileSync(normalizeInsideRepo('reports/overnight-learning-audit.md'), renderReport(rounds, audit));
  const failed = rounds.some(round => round.commands.some(cmd => cmd.status !== 0));
  if (failed || audit.totals.unsupportedExplanations) process.exit(1);
  console.log('Overnight learning audit passed.');
}

if (require.main === module) main();

module.exports = { contentAudit, improvementBacklog };
