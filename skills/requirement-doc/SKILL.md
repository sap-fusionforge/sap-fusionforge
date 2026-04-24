---
skill: requirement-doc
artifact_type: BRD
reads_client_md: true
output_schema: {title: string, scope: string, user_stories: [{id: string, title: string, description: string, acceptance_criteria: string[], github_issue_url: string}], constraints: string[], btp_services: string[], open_questions: string[]}
agent: business-analyst
version: 0.1.0
---

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

## What this skill does
Transforms clarified requirements into a formal Business Requirements Document (BRD) and creates corresponding GitHub Issues for each user story.

## Trigger
Agent receives handoff from `clarify-requirements` skill AND `artifacts/clarification_log.md` exists with `confidence_score >= 0.7`.

## Inputs
- `artifacts/clarification_log.md`
- `client-config/CLIENT.md` (project context)
- `MEMORY.md` (historical context)

## Steps (numbered, detailed)
1. Validate `confidence_score >= 0.7`. If not, exit with error.
2. Extract core requirements, scope, and constraints from `clarification_log.md`.
3. Draft BRD structure in memory.
4. Write INVEST-compliant user stories. Assign sequential IDs (US-001...).
5. For each story, create GitHub Issue via octokit-issues tool using defined template.
6. Capture returned issue URLs and update story mapping.
7. Write final `artifacts/brd.md`.
8. Write condensed `artifacts/user_stories.md` for developer handoff.

## Output (BRD structure)
- `title`: Project Title
- `executive_summary`: Brief overview
- `scope`: In-scope/out-of-scope items
- `user_stories`: Array with id, title, description, acceptance_criteria (Given/When/Then), estimated_complexity, btp_service_mapped
- `btp_services_in_scope`: List of SAP BTP services required
- `constraints`: Technical/business limits
- `open_questions`: Unresolved items

## GitHub Issue Template
- **Title:** `[US-XXX] <story_title>`
- **Body:** `**Description:**` (As a... I want... so that...). `**Acceptance Criteria:**` (bullet list).
- **Label:** `user-story`
- **Milestone:** `Phase 1`

## Validation (mandatory per G-05)
Every user_story object in the BRD must have: `title`, `description`, `acceptance_criteria`, and a populated `github_issue_url`. Agent fails if any are missing.

## On Failure
Log error to `TEAM_LOG.md`. Update `skill_runs` DB entry with `status='failed'`. If `retries < 3`, skill will be re-run in next bootstrap cycle.

## Handoff
Update DB: `handoffs` with `to_agent='tech-lead', artifact='user_stories.md', status='pending'`. Log completion to `TEAM_LOG.md`.