# Importing real questions

The database ships **empty**. Add your real, approved questions like this:

```bash
cd server
npm install        # first time only
node import.js path/to/your-questions.json
```

The file must be a JSON **array** of question objects. `import-template.json`
is a starter you can copy.

## Fields

| Field | Required | Notes |
|-------|----------|-------|
| `stem` | yes | The question text. |
| `choices` | yes | Array of answer-choice strings (A, B, C, … in order). |
| `correct_answer` | yes | Letter that matches the choice position: `"A"`–`"E"`. |
| `subject` | recommended | `biology` \| `chemistry` \| `physics`. |
| `topic`, `subtopic` | optional | Used by analytics to attribute point loss. |
| `difficulty` | optional | `easy` \| `medium` \| `hard` (drives hardest/easiest-missed). |
| `source`, `year`, `question_number` | optional | Provenance. |
| `textbook_chapter` | optional | Linked chapter. |
| `explanation` | optional | If present, `explanation_linked` is set automatically. |
| `scan_crop_url` | optional | URL/path to the original scan crop (shown in Admin Review). |

## Data-integrity flags (Feature 1)

Set these to reflect the **true** processing state. Anything you omit defaults
to `0`/null — nothing is invented.

| Flag | Meaning |
|------|---------|
| `ocr_extracted` | Text came from OCR (vs. manual entry). |
| `answer_key_matched` | Answer key was matched. |
| `ai_topic_tagged` | Topic/difficulty tagged. |
| `coach_reviewed` | A coach has reviewed it. |
| `approved_for_practice` | **Students only ever see `true`.** Leave `false` to send it to the Admin Review queue. |
| `extraction_confidence` | 0–1. |
| `topic_tag_confidence` | 0–1. |
| `answer_key_match_status` | `matched` \| `mismatch` \| `unmatched` \| `manual`. `mismatch` shows a red "Issue Found" badge. |

## After import

Imported questions go to **Admin Review** (badge = Needs Review / Issue Found /
Not Processed). They become available in student Practice only after a coach
approves them (`approved_for_practice = 1`).

> OCR and AI tagging are integration points. This importer ingests questions
> that have already been extracted/tagged (by your pipeline or by hand). To plug
> in a live OCR/AI service, write its output into this same JSON shape, or call
> `PATCH /api/questions/:id` from your job.
