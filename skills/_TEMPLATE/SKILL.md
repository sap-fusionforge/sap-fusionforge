---
name: <Skill Name>                        # e.g. Draft User Stories
slug: <slug>                               # e.g. draft-user-stories  (kebab-case, unique)
agent: <agent-slug>                        # one of: business-analyst | solution-architect | cap-developer | build-apps-developer | bpa-designer | btp-admin | discovery-advisor
phase: discover | explore | realize | deploy  # pick one
artifact_type: <type>                      # from schema.sql artifact_types: brd | adr | sdd | ui_spec | bpmn | cap_service | deployment_bundle | report
output_schema:
  required_fields: []                      # field names that MUST be present in the output artifact
  optional_fields: []                      # field names that MAY be present
version: 1.0.0
---

# <Skill Name>

## Purpose
<!-- One sentence: what this skill produces and why it matters. -->

## Prerequisites
<!-- What must exist before this skill can run (DB rows, prior artifacts, env vars). -->

## Bootstrap (mandatory — copy verbatim, do not modify)
1. Read `client-config/CLIENT.md`
2. Read `MEMORY.md`
3. Read `docs/team-logs/` — last 10 entries
4. `SELECT * FROM sprint_state`
5. `SELECT * FROM handoffs WHERE to_agent = '<this-agent>' AND status = 'pending'` → if empty: log "No pending work" and EXIT
6. `SELECT * FROM skill_runs WHERE agent = '<this-agent>' AND status = 'failed' AND retries < 3` → if any: re-run failed skills first
7. `UPDATE agents SET status = 'running', last_run = NOW()`

## Trigger
<!-- cron schedule OR event name (e.g., handoff_received | sprint_start | manual) -->

## Steps
<!-- Numbered list of what the skill does. Be specific — reference table names, file paths, API calls. -->
1. TBD

## Output
<!-- Artifact name + location + format. -->
- **File:** `TBD`
- **DB write:** `INSERT INTO artifacts (type, agent, sprint_id, path, status) VALUES (...)`

## Validation
<!-- Criteria that must pass before the artifact is handed off. -->
- [ ] TBD

## On Failure
- Increment `skill_runs.retries`; if `retries >= 3` append ERROR entry to `docs/team-logs/YYYY-MM-DD.md`

## Self-Improvement (mandatory — do not remove)

### Self-Verification
After each run, score output against the Validation checklist above. Log pass/fail to `skill_runs`.

### RETRO.md Append
Append one entry to `RETRO.md`: `| <date> | <skill-slug> | <pass|fail> | <one-line observation> |`

### Trace Write
Write execution trace to `docs/team-logs/YYYY-MM-DD.md` with timestamp, inputs used, output path.

### Bootstrap Addition (Step 8)
On the *next* run, read the last RETRO.md entry for this skill and apply any approved improvement delta before Step 1.

---
> TEMPLATE — copy to `skills/<slug>/SKILL.md` and fill in all placeholders.
> Required fields: `artifact_type` and `output_schema` must be filled before Phase 1 review.
