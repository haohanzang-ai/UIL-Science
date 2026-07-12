# Explanation And Categorization Integrity

Student access is no longer blocked by the previous publication validation gate. All parseable uploaded questions can appear in the study interface with a visible review status.

## Non-Negotiable Rule

No explanation or topic categorization is considered legitimate until it is checked against the required authoritative sources for that subject.

## Required Source Policy

- Biology explanations: Campbell Biology, latest available edition.
- Biology topic mapping: College Board AP Biology Course and Exam Description.
- Chemistry topic mapping: College Board AP Chemistry Course and Exam Description.
- Chemistry explanation cross-check: Princeton Review AP Chemistry when an approved source is available; otherwise use a trusted general chemistry textbook fallback such as OpenStax Chemistry 2e.
- Physics topic mapping: College Board AP Physics Course and Exam Descriptions.
- Physics explanation cross-check: a trusted introductory physics textbook fallback such as OpenStax College Physics 2e.

## Current Data Status

- Question text, choices, and official answer letters are imported from uploaded UIL/VCM sources where machine-readable pairing is available.
- Imported official-key explanations are retained only as source material and are marked `official-key-solution-imported-authoritative-review-required`.
- Topic categorization is intentionally marked `needs-authoritative-source-review`.
- The student UI does not display explanations or topic labels as authoritative.

## Review Requirements Before Showing Explanations

- Check the official answer key solution when one exists.
- Check each scientific claim against the required subject source policy.
- Record source evidence before changing `explanationVerification.status`.
- Reject or rewrite any explanation that cannot be supported without guesswork.

## Review Requirements Before Showing Topics

- Map each question to a College Board AP unit/topic where appropriate.
- Use UIL-specific or beyond-AP labeling when the content does not fit the AP framework.
- Record the source used for the category decision.
- Do not infer a topic from keywords alone when the concept is ambiguous.
