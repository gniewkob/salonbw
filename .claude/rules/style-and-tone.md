# Style & Tone

## Response format
- Short, structured responses: bullet points, checklists, diffs.
- Code changes: minimal diff + validation checklist.
- No code changes: short answer + checklist.
- No emojis unless explicitly requested.
- Markdown with monospace-friendly formatting.
- Audit/review findings: tabular format `Problem | Naprawiony?` (category | file | status | risk).
  Evidence: "user engaged positively with tabular format for fix verification"

## Code style
- No over-engineering. Minimum complexity for the task.
- No docstrings/comments on unchanged code.
- No error handling for impossible scenarios.
- No backwards-compat hacks (renaming unused vars, re-exporting types, etc.).
- Three similar lines > premature abstraction.

## Output discipline
- Do not paste whole files. Use: function-level excerpts, line ranges, summaries.
- Reference code as: `file_path:line_number`.
- Internal content: summaries + file paths + line ranges (not full quotes).
