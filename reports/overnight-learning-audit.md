# Overnight Learning Audit

Generated: 2026-07-20T02:45:11.761Z
Rounds requested: 3
Runtime: Node v24.14.0
Declared package engine: >=18 <23

## Repeated Checks

### Round 1
- PASS node tools/test-runner.js
- PASS node tools/validate-content.js

### Round 2
- PASS node tools/test-runner.js
- PASS node tools/validate-content.js

### Round 3
- PASS node tools/test-runner.js
- PASS node tools/validate-content.js

## Source Reliability Metrics

- questions: 1613
- published: 1512
- quarantined: 101
- citations: 1613
- sourcePolicyAttached: 1613
- explanationImported: 572
- unsupportedExplanations: 0
- explanationsPendingClaimLevelReview: 572
- explanationsEligibleForDisplay: 0
- explanationsBlockedPendingVerification: 572
- hintsImported: 0
- hintsEligibleForDisplay: 0
- hintsBlockedPendingVerification: 0
- lessonsImported: 0
- lessonsEligibleForDisplay: 0
- lessonsBlockedPendingVerification: 0
- verifiedInstructionalContentMissingRequiredSources: 0
- verifiedInstructionalContentMissingClaimEvidence: 0
- structuralAuthenticityFailures: 101
- publishedStructuralAuthenticityFailures: 0
- approvedSourceFileAuthenticityFailures: 0
- unregisteredPublishedCitations: 0
- publishedCitationAuthenticityFailures: 0
- unpublishedCatalogEligibilityFailures: 0
- biologyMissingCampbell: 0
- biologyMissingCollegeBoard: 0
- chemistryMissingCollegeBoard: 0
- chemistryMissingApprovedFallback: 0
- physicsMissingCollegeBoard: 0
- physicsMissingOpenStax: 0
- needsAuthoritativeReview: 1613

## Reliability Findings

- 101 OCR/import records have invalid answer structure and are retained only for repair.
- 0 structurally invalid records remain student-visible.
- 0 approved registry sources are missing or differ from their recorded SHA-256 file hash.
- 0 published records lack a verified, file-byte-matched, registry-path-matched, same-exam UIL test and answer-key citation pair.
- 0 unpublished records could pass the non-publication parts of the student catalog gate.
- 572 imported official-key explanations still lack claim-level verification metadata.
- 572 explanations are blocked from student display pending source verification; 0 meet the current display gate.
- 0 hints and 0 lessons are blocked pending subject-specific source verification.
- 0 instructional records claim verified status without the subject sources required by policy.
- 0 instructional records claim verified status without direct source excerpts and locators.
- 1613 topic mappings remain labeled as needing authoritative source review.
- WARN bundled runtime v24.14.0 is outside the declared package engine range (>=18 <23); all audit commands still passed.

## Instructional Display Guardrails

- PASS explanations require claim-level verification, direct evidence excerpts and locators, plus exact policy-approved source names (lookalikes are rejected)
- PASS hints and lessons remain hidden without their own subject-specific verification metadata
- PASS the student catalog requires an explicit publication flag
- PASS published answers require direct, verified, file-byte-matched and registry-path-matched UIL test and answer-key citations from the same exam packet
- PASS browser JavaScript assets receive syntax regression coverage

## Simplified Study Layout

- PASS one central question lane
- PASS collapsible Focus filters
- PASS trusted-source panel
- PASS adaptive next-best queue

## 10 Improvements Toward Automated Reliable Learning

1. Preserve the one primary question lane and collapsible Focus controls with regression tests.
2. Keep the trusted-source status visible beside every question without forcing students through long reference text.
3. Use missed, unanswered, and bookmarked attempts to choose the next-best local question automatically.
4. Add claim-level explanation records before showing generated explanations.
5. Require Biology explanations to cite Campbell Biology plus College Board/AP Classroom alignment before becoming verified.
6. Require Chemistry and Physics generated help to cite College Board/AP Classroom framework sources, with approved textbook fallback only where policy allows.
7. Track every generated hint/explanation draft as untrusted until review metadata, source IDs, and source excerpts are attached.
8. Recompute approved source-file hashes during repeated validation before publishing new learning content.
9. Promote weak-topic practice based on recent misses and spaced-review due dates instead of static topic lists alone.
10. Keep a nightly audit report so each refinement cycle has evidence: failures, source gaps, generated-content blocks, and next actions.

## Source Policy

Explanations and topic categorizations must not be presented as authoritative unless supported by the required subject sources.

## Sample Blocks

- uil-2015-district-2-b01: quarantined for duplicate-choice-labels
- uil-2015-district-2-b10: quarantined for duplicate-choice-labels
- uil-2015-invitational-a-c14: quarantined for duplicate-choice-labels
- uil-2015-invitational-b-c10: quarantined for duplicate-choice-labels
- uil-2015-region-b03: quarantined for duplicate-choice-labels, official-answer-not-in-choices
- uil-2015-region-b15: quarantined for duplicate-choice-labels, official-answer-not-in-choices
- uil-2015-region-c01: quarantined for official-answer-not-in-choices
- uil-2015-region-c16: quarantined for duplicate-choice-labels
- uil-2015-state-b01: quarantined for duplicate-choice-labels
- uil-2015-state-b06: quarantined for duplicate-choice-labels, official-answer-not-in-choices
- uil-2015-state-b16: quarantined for duplicate-choice-labels, official-answer-not-in-choices
- uil-2015-state-b19: quarantined for duplicate-choice-labels
- uil-2015-state-c12: quarantined for official-answer-not-in-choices
- uil-2015-state-c13: quarantined for official-answer-not-in-choices
- uil-2015-state-c17: quarantined for official-answer-not-in-choices
- uil-2016-district-1-b01: quarantined for duplicate-choice-labels
- uil-2016-district-1-b02: quarantined for duplicate-choice-labels, official-answer-not-in-choices
- uil-2016-district-1-b08: quarantined for duplicate-choice-labels
- uil-2016-district-1-b11: quarantined for duplicate-choice-labels, official-answer-not-in-choices
- uil-2016-district-2-b05: quarantined for duplicate-choice-labels
