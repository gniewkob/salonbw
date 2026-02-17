# Retro Rubric (Evidence Gate)

## Classification
| Type       | Criteria                                                         | Required format                        |
|------------|------------------------------------------------------------------|----------------------------------------|
| Explicit   | Directly stated by user or directly observable from actions      | Add directly                           |
| Inferred   | Repeated pattern strongly supported by conversation              | Must include `Evidence: "…quote…"`     |
| Assumption | Uncertain; plausible but not confirmed                           | Must include confidence + verify route |

## Evidence format
For any inferred point:
```
- <rule statement>
  Evidence: "…short quote or reference from chat…"
```

## Assumption format
```
- <assumption statement>
  Assumption (confidence: high|med|low). Verify: <how to verify>.
```

## Compression rules
- Rules > explanations. Checklists > prose.
- Prefer: Do/Don't lists, checklists, templates.
- Avoid duplicates across .claude/rules/*.md files.
- Max 500 lines per rules file. Compress older entries if approaching limit.

## Prohibited content
- No secrets, tokens, API keys, passwords.
- No PII beyond what is necessary for collaboration.
- No speculative rules without Evidence or Assumption tag.
