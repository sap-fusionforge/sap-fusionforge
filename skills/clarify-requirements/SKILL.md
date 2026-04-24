---
skill: clarify-requirements
artifact_type: clarification_log
reads_client_md: true
output_schema: {scenario: string, ambiguities_found: string[], clarifications: {question: string, answer: string}[], open_items: string[], confidence_score: float}
agent: business-analyst
version: 0.1.0
---

## What this skill does
Analyzes the client-provided requirements in CLIENT.md in a multi-turn loop to identify ambiguities, contradictions, and gaps. It structures and logs clarifying questions, calculates a confidence score on requirement completeness, and determines if handoff to the `requirement-doc` skill can proceed.

## Bootstrap (mandatory)
1. Read client-config/CLIENT.md
2. Read MEMORY.md
3. Read TEAM_LOG.md (last 10 entries)
4. Query DB: SELECT * FROM sprint_state
5. Query DB: SELECT * FROM handoffs WHERE to_agent = 'business-analyst' AND status = 'pending'
   → if empty: log 'No pending work' and EXIT cleanly
6. Query DB: SELECT * FROM skill_runs WHERE agent = 'business-analyst' AND status = 'failed' AND retries < 3
   → if any: re-run failed skills first
7. UPDATE agents SET status = 'running', last_run = NOW()

## Trigger
A new or updated `CLIENT.md` file is detected via a handoff from the `product-owner` agent with status `pending`.

## Inputs
- `client-config/CLIENT.md`: Primary source of initial requirements.
- `handoffs` DB record: Contains client context and source.

## Steps (detailed)
1. Parse `CLIENT.md` to extract stated goals, user stories, and constraints.
2. Perform gap analysis across five dimensions: scope, user_roles, processes, constraints, integrations.
3. For each identified ambiguity, generate a clarifying question. Log the question, its business rationale, and the risk of assumption.
4. Synthesize findings into `ambiguities_found[]` and `clarifications[]` arrays.
5. Calculate `confidence_score` (0.0-1.0) based on clarity, coverage, and specificity of original input.
6. If `confidence_score` < 0.7, mark handoff as `blocked` and status as `needs_clarification`. Log open items.
7. If `confidence_score` >= 0.7, format and save the `clarification_log.md` artifact and prepare handoff to `requirement-doc`.

## Output (clarification_log format)
Artifact saved to `artifacts/clarification_log.md` with YAML frontmatter matching the `output_schema`. The body contains the scenario summary and a structured Q&A table.

## Validation (mandatory per G-05)
- Schema Compliance: Output must validate against the declared `output_schema`.
- Non-emptiness: `ambiguities_found` and `clarifications` must be populated.
- Confidence Logic: A score >= 0.7 must coincide with `open_items` being empty or minimal.

## On Failure
Log error to `skill_runs` DB, increment retry count. On 3rd failure, update handoff status to `failed` and alert `technical-lead`.

## Handoff
If successful and `confidence_score` >= 0.7: Create a handoff to the `requirements-doc` skill with the `clarification_log.md` artifact as input.