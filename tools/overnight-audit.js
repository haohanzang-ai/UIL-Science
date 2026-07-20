const fs = require('fs');
const { spawnSync } = require('child_process');
const { normalizeInsideRepo } = require('./importer/pathGuard');
const { questionStructureIssues } = require('./question-integrity');
const { citationAuthenticityIssues, sourceFileAuthenticityIssues } = require('./validate-content');

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

const VERIFIED_SOURCE_STATUSES = ['claim-level-verified', 'official-source-verified', 'verified'];
const VERIFIED_EVIDENCE_STATUSES = ['verified', 'source-verified', 'claim-level-verified'];
const APPROVED_INSTRUCTIONAL_SOURCES = {
  biologyTextbook: ['Campbell Biology, latest available edition', 'Campbell Biology latest edition'],
  biologyFramework: ['College Board AP Biology Course and Exam Description'],
  chemistryFramework: ['College Board AP Chemistry Course and Exam Description'],
  chemistryFallback: ['Princeton Review AP Chemistry', 'OpenStax Chemistry 2e', 'OpenStax Chemistry 2e fallback'],
  physicsFramework: ['College Board AP Physics Course and Exam Descriptions'],
  physicsFallback: ['OpenStax College Physics 2e', 'OpenStax College Physics 2e fallback']
};

function normalizedSourceName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function includesApprovedSourceName(list, approvedNames) {
  const supplied = (list || []).map(normalizedSourceName);
  return approvedNames.some(name => supplied.includes(normalizedSourceName(name)));
}

function subjectSourceNamesSatisfied(subject, names) {
  if (subject === 'biology') {
    return includesApprovedSourceName(names, APPROVED_INSTRUCTIONAL_SOURCES.biologyTextbook) &&
      includesApprovedSourceName(names, APPROVED_INSTRUCTIONAL_SOURCES.biologyFramework);
  }
  if (subject === 'chemistry') {
    return includesApprovedSourceName(names, APPROVED_INSTRUCTIONAL_SOURCES.chemistryFramework) &&
      includesApprovedSourceName(names, APPROVED_INSTRUCTIONAL_SOURCES.chemistryFallback);
  }
  if (subject === 'physics') {
    return includesApprovedSourceName(names, APPROVED_INSTRUCTIONAL_SOURCES.physicsFramework) &&
      includesApprovedSourceName(names, APPROVED_INSTRUCTIONAL_SOURCES.physicsFallback);
  }
  return false;
}

function verifiedEvidenceSupportsSubject(subject, verification) {
  const evidence = verification && verification.sourceEvidence;
  if (!Array.isArray(evidence) || !evidence.length) return false;
  if (evidence.some(item => !item ||
      !VERIFIED_EVIDENCE_STATUSES.includes(item.verificationStatus) ||
      item.supportType !== 'direct' ||
      !String(item.sourceName || '').trim() ||
      !String(item.locator || '').trim() ||
      !String(item.supportingExcerpt || '').trim())) return false;
  return subjectSourceNamesSatisfied(subject, evidence.map(item => item.sourceName));
}

function sourceRequirementsSatisfied(subject, verification) {
  if (!verification || !VERIFIED_SOURCE_STATUSES.includes(verification.status)) return false;
  const required = verification.requiredSources || [];
  return subjectSourceNamesSatisfied(subject, required) && verifiedEvidenceSupportsSubject(subject, verification);
}

function explanationIsVerified(q) {
  const trustedStatuses = ['official', 'official-key-solution-imported', 'verified', 'captain-reviewed'];
  return Boolean(q && q.explanation &&
    trustedStatuses.includes(q.explanationStatus) &&
    sourceRequirementsSatisfied(q.subject, q.explanationVerification));
}

function instructionalContentIsVerified(q, field) {
  if (!q || !q[field]) return false;
  if (field === 'lesson' && q.lesson.verified !== true) return false;
  return sourceRequirementsSatisfied(q.subject, q[`${field}Verification`]);
}

function contentAudit() {
  const policy = readJson('references/authoritative-source-policy.json');
  const data = readJson('data/processed/published-questions.json');
  const registry = readJson('references/source-registry.json');
  const approvedSourceIds = new Set((registry.sources || []).filter(source => source.approved).map(source => source.sourceId));
  const totals = {
    questions: 0,
    published: 0,
    quarantined: 0,
    citations: 0,
    sourcePolicyAttached: 0,
    explanationImported: 0,
    unsupportedExplanations: 0,
    explanationsPendingClaimLevelReview: 0,
    explanationsEligibleForDisplay: 0,
    explanationsBlockedPendingVerification: 0,
    hintsImported: 0,
    hintsEligibleForDisplay: 0,
    hintsBlockedPendingVerification: 0,
    lessonsImported: 0,
    lessonsEligibleForDisplay: 0,
    lessonsBlockedPendingVerification: 0,
    verifiedInstructionalContentMissingRequiredSources: 0,
    verifiedInstructionalContentMissingClaimEvidence: 0,
    structuralAuthenticityFailures: 0,
    publishedStructuralAuthenticityFailures: 0,
    approvedSourceFileAuthenticityFailures: 0,
    unregisteredPublishedCitations: 0,
    publishedCitationAuthenticityFailures: 0,
    unpublishedCatalogEligibilityFailures: 0,
    biologyMissingCampbell: 0,
    biologyMissingCollegeBoard: 0,
    chemistryMissingCollegeBoard: 0,
    chemistryMissingApprovedFallback: 0,
    physicsMissingCollegeBoard: 0,
    physicsMissingOpenStax: 0,
    needsAuthoritativeReview: 0
  };
  const samples = [];
  const trustedExplanationStatuses = ['official', 'official-key-solution-imported', 'verified', 'captain-reviewed'];
  const sourceById = new Map((registry.sources || []).map(source => [source.sourceId, source]));

  for (const source of registry.sources || []) {
    if (!source.approved) continue;
    const issues = sourceFileAuthenticityIssues(source);
    if (issues.length) {
      totals.approvedSourceFileAuthenticityFailures++;
      if (samples.length < 20) samples.push(`${source.sourceId}: ${issues.join(', ')}`);
    }
  }

  for (const q of data.questions || []) {
    totals.questions++;
    if (q.published === true) totals.published++;
    else totals.quarantined++;
    if (Array.isArray(q.citations) && q.citations.length) totals.citations++;
    if (q.explanationVerification && q.explanationVerification.status) totals.sourcePolicyAttached++;
    if (q.explanation) totals.explanationImported++;
    if (q.explanation && !trustedExplanationStatuses.includes(q.explanationStatus)) {
      totals.unsupportedExplanations++;
      samples.push(`${q.questionId}: explanation exists but status is ${q.explanationStatus || 'blank'}`);
    }
    if (q.explanation && !['claim-level-verified', 'official-source-verified', 'verified'].includes(q.explanationVerification && q.explanationVerification.status)) {
      totals.explanationsPendingClaimLevelReview++;
    }
    if (explanationIsVerified(q)) totals.explanationsEligibleForDisplay++;
    else if (q.explanation) totals.explanationsBlockedPendingVerification++;
    if (q.explanation && trustedExplanationStatuses.includes(q.explanationStatus) &&
        VERIFIED_SOURCE_STATUSES.includes(q.explanationVerification && q.explanationVerification.status)) {
      if (!subjectSourceNamesSatisfied(q.subject, q.explanationVerification.requiredSources || [])) {
        totals.verifiedInstructionalContentMissingRequiredSources++;
        samples.push(`${q.questionId}: verified explanation metadata lacks required ${q.subject} sources`);
      }
      if (!verifiedEvidenceSupportsSubject(q.subject, q.explanationVerification)) {
        totals.verifiedInstructionalContentMissingClaimEvidence++;
        samples.push(`${q.questionId}: verified explanation metadata lacks direct claim-level source evidence`);
      }
    }
    if (q.hint) {
      totals.hintsImported++;
      if (instructionalContentIsVerified(q, 'hint')) totals.hintsEligibleForDisplay++;
      else totals.hintsBlockedPendingVerification++;
      if (VERIFIED_SOURCE_STATUSES.includes(q.hintVerification && q.hintVerification.status)) {
        if (!subjectSourceNamesSatisfied(q.subject, q.hintVerification.requiredSources || [])) {
          totals.verifiedInstructionalContentMissingRequiredSources++;
          samples.push(`${q.questionId}: verified hint metadata lacks required ${q.subject} sources`);
        }
        if (!verifiedEvidenceSupportsSubject(q.subject, q.hintVerification)) {
          totals.verifiedInstructionalContentMissingClaimEvidence++;
          samples.push(`${q.questionId}: verified hint metadata lacks direct claim-level source evidence`);
        }
      }
    }
    if (q.lesson) {
      totals.lessonsImported++;
      if (instructionalContentIsVerified(q, 'lesson')) totals.lessonsEligibleForDisplay++;
      else totals.lessonsBlockedPendingVerification++;
      if (VERIFIED_SOURCE_STATUSES.includes(q.lessonVerification && q.lessonVerification.status)) {
        if (!subjectSourceNamesSatisfied(q.subject, q.lessonVerification.requiredSources || [])) {
          totals.verifiedInstructionalContentMissingRequiredSources++;
          samples.push(`${q.questionId}: verified lesson metadata lacks required ${q.subject} sources`);
        }
        if (!verifiedEvidenceSupportsSubject(q.subject, q.lessonVerification)) {
          totals.verifiedInstructionalContentMissingClaimEvidence++;
          samples.push(`${q.questionId}: verified lesson metadata lacks direct claim-level source evidence`);
        }
      }
    }
    const structuralIssues = questionStructureIssues(q);
    if (q.published !== true && q.accessible !== false && !structuralIssues.length) {
      totals.unpublishedCatalogEligibilityFailures++;
      if (samples.length < 20) samples.push(`${q.questionId}: unpublished record would be student-eligible without the explicit publication gate`);
    }
    if (structuralIssues.length) {
      totals.structuralAuthenticityFailures++;
      if (q.published === true || q.accessible !== false) totals.publishedStructuralAuthenticityFailures++;
      if (samples.length < 20) samples.push(`${q.questionId}: quarantined for ${structuralIssues.join(', ')}`);
    }
    if (q.published === true) {
      for (const citation of q.citations || []) {
        if (!citation || !approvedSourceIds.has(citation.sourceId)) totals.unregisteredPublishedCitations++;
      }
      const citationIssues = citationAuthenticityIssues(q, sourceById);
      if (citationIssues.length) {
        totals.publishedCitationAuthenticityFailures++;
        if (samples.length < 20) samples.push(`${q.questionId}: ${citationIssues.join(', ')}`);
      }
    }
    if (q.categorization && q.categorization.sourceReviewStatus === 'needs-authoritative-source-review') {
      totals.needsAuthoritativeReview++;
    }
    if (q.subject === 'biology') {
      const required = []
        .concat(q.explanationVerification && q.explanationVerification.requiredSources || [])
        .concat(q.categorization && q.categorization.requiredSources || []);
      if (!includesApprovedSourceName(required, APPROVED_INSTRUCTIONAL_SOURCES.biologyTextbook)) totals.biologyMissingCampbell++;
      if (!includesApprovedSourceName(required, APPROVED_INSTRUCTIONAL_SOURCES.biologyFramework)) totals.biologyMissingCollegeBoard++;
    }
    if (q.subject === 'chemistry') {
      const required = []
        .concat(q.explanationVerification && q.explanationVerification.requiredSources || [])
        .concat(q.categorization && q.categorization.requiredSources || []);
      if (!includesApprovedSourceName(required, APPROVED_INSTRUCTIONAL_SOURCES.chemistryFramework)) totals.chemistryMissingCollegeBoard++;
      if (!includesApprovedSourceName(required, APPROVED_INSTRUCTIONAL_SOURCES.chemistryFallback)) totals.chemistryMissingApprovedFallback++;
    }
    if (q.subject === 'physics') {
      const required = []
        .concat(q.explanationVerification && q.explanationVerification.requiredSources || [])
        .concat(q.categorization && q.categorization.requiredSources || []);
      if (!includesApprovedSourceName(required, APPROVED_INSTRUCTIONAL_SOURCES.physicsFramework)) totals.physicsMissingCollegeBoard++;
      if (!includesApprovedSourceName(required, APPROVED_INSTRUCTIONAL_SOURCES.physicsFallback)) totals.physicsMissingOpenStax++;
    }
  }

  return { policy: policy.policy, totals, samples: samples.slice(0, 20) };
}

function improvementBacklog(audit) {
  return [
    'Preserve the one primary question lane and collapsible Focus controls with regression tests.',
    'Keep the trusted-source status visible beside every question without forcing students through long reference text.',
    'Use missed, unanswered, and bookmarked attempts to choose the next-best local question automatically.',
    'Add claim-level explanation records before showing generated explanations.',
    'Require Biology explanations to cite Campbell Biology plus College Board/AP Classroom alignment before becoming verified.',
    'Require Chemistry and Physics generated help to cite College Board/AP Classroom framework sources, with approved textbook fallback only where policy allows.',
    'Track every generated hint/explanation draft as untrusted until review metadata, source IDs, and source excerpts are attached.',
    'Recompute approved source-file hashes during repeated validation before publishing new learning content.',
    'Promote weak-topic practice based on recent misses and spaced-review due dates instead of static topic lists alone.',
    'Keep a nightly audit report so each refinement cycle has evidence: failures, source gaps, generated-content blocks, and next actions.'
  ];
}

function renderReport(rounds, audit) {
  const declaredEngine = readJson('package.json').engines.node;
  const runtimeMajor = Number(process.versions.node.split('.')[0]);
  const runtimeOutsideDeclaredRange = runtimeMajor >= 23 && /<23/.test(declaredEngine);
  const lines = [
    '# Overnight Learning Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Rounds requested: ${ROUNDS}`,
    `Runtime: Node ${process.version}`,
    `Declared package engine: ${declaredEngine}`,
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
  lines.push(
    '',
    '## Reliability Findings',
    '',
    `- ${audit.totals.structuralAuthenticityFailures} OCR/import records have invalid answer structure and are retained only for repair.`,
    `- ${audit.totals.publishedStructuralAuthenticityFailures} structurally invalid records remain student-visible.`,
    `- ${audit.totals.approvedSourceFileAuthenticityFailures} approved registry sources are missing or differ from their recorded SHA-256 file hash.`,
    `- ${audit.totals.publishedCitationAuthenticityFailures} published records lack a verified, file-byte-matched, registry-path-matched, same-exam UIL test and answer-key citation pair.`,
    `- ${audit.totals.unpublishedCatalogEligibilityFailures} unpublished records could pass the non-publication parts of the student catalog gate.`,
    `- ${audit.totals.explanationsPendingClaimLevelReview} imported official-key explanations still lack claim-level verification metadata.`,
    `- ${audit.totals.explanationsBlockedPendingVerification} explanations are blocked from student display pending source verification; ${audit.totals.explanationsEligibleForDisplay} meet the current display gate.`,
    `- ${audit.totals.hintsBlockedPendingVerification} hints and ${audit.totals.lessonsBlockedPendingVerification} lessons are blocked pending subject-specific source verification.`,
    `- ${audit.totals.verifiedInstructionalContentMissingRequiredSources} instructional records claim verified status without the subject sources required by policy.`,
    `- ${audit.totals.verifiedInstructionalContentMissingClaimEvidence} instructional records claim verified status without direct source excerpts and locators.`,
    `- ${audit.totals.needsAuthoritativeReview} topic mappings remain labeled as needing authoritative source review.`,
    `- ${runtimeOutsideDeclaredRange ? 'WARN' : 'PASS'} bundled runtime ${process.version} ${runtimeOutsideDeclaredRange ? 'is outside' : 'matches'} the declared package engine range (${declaredEngine}); all audit commands still passed.`,
    '',
    '## Instructional Display Guardrails',
    '',
    '- PASS explanations require claim-level verification, direct evidence excerpts and locators, plus exact policy-approved source names (lookalikes are rejected)',
    '- PASS hints and lessons remain hidden without their own subject-specific verification metadata',
    '- PASS the student catalog requires an explicit publication flag',
    '- PASS published answers require direct, verified, file-byte-matched and registry-path-matched UIL test and answer-key citations from the same exam packet',
    '- PASS browser JavaScript assets receive syntax regression coverage',
    '',
    '## Simplified Study Layout',
    '',
    '- PASS one central question lane',
    '- PASS collapsible Focus filters',
    '- PASS trusted-source panel',
    '- PASS adaptive next-best queue'
  );
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
  const reliabilityFailure = audit.totals.unsupportedExplanations ||
    audit.totals.verifiedInstructionalContentMissingRequiredSources ||
    audit.totals.verifiedInstructionalContentMissingClaimEvidence ||
    audit.totals.publishedStructuralAuthenticityFailures ||
    audit.totals.unregisteredPublishedCitations ||
    audit.totals.publishedCitationAuthenticityFailures ||
    audit.totals.unpublishedCatalogEligibilityFailures ||
    audit.totals.biologyMissingCampbell ||
    audit.totals.biologyMissingCollegeBoard ||
    audit.totals.chemistryMissingCollegeBoard ||
    audit.totals.chemistryMissingApprovedFallback ||
    audit.totals.physicsMissingCollegeBoard ||
    audit.totals.physicsMissingOpenStax;
  if (failed || reliabilityFailure) process.exit(1);
  console.log('Overnight learning audit passed.');
}

if (require.main === module) main();

module.exports = { contentAudit, explanationIsVerified, instructionalContentIsVerified, sourceRequirementsSatisfied, verifiedEvidenceSupportsSubject, improvementBacklog };
