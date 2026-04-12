---
name: TBD # e.g. CAP Developer
slug: TBD # e.g. cap-developer
role: TBD # e.g. Develops CAP-based services
goal: TBD # e.g. Implement and maintain CAP services for the project
backstory: TBD # e.g. Experienced developer with deep knowledge of CAP and SAP ecosystem
type: TBD # one of: pro-code | citizen | low-code | research
reports-to: TBD # one of: human | solution-architect
phase: TBD # one of: 1 | 2 | 3
allow_delegation: TBD # true only for solution-architect; false otherwise
tools: [] # list of skill slugs (e.g., skill-001, skill-002)
artifact_type: TBD # primary output type (e.g., code, document, diagram)
output_schema: TBD # JSON schema ref path (e.g., schemas/code-artifact.json)
permissions: [] # allow-list array (e.g., [read-repo, write-file, open-pr])
---

## Agent Overview
TBD: Provide a concise summary of the agent's purpose, scope, and how it fits into the overall solution.

## Responsibilities
- TBD: List the key responsibilities and duties this agent performs.
- TBD: Include any specific deliverables or milestones owned by this agent.

## Skills
- TBD: Enumerate the skill slugs (e.g., `skill-001`, `skill-002`) required to execute the agent's responsibilities.

## Artifacts Produced
- TBD: Specify the primary artifact types this agent creates (e.g., source code files, configuration files, documentation).
- TBD: Note any specific naming conventions or locations for produced artifacts.

## Artifacts Consumed
- TBD: List the artifact types or files this agent reads or depends on as inputs.
- TBD: Include version or schema constraints if applicable.

## Permissions Policy
- **Baseline restriction:** No agent may execute `push-to-main` or `delete-file`.
- **Pull-request restriction:** Only the `btp-admin` agent may perform `open-pr`.
- The `permissions` array in the frontmatter defines additional allowed actions beyond this baseline. Agents must request any extra permissions explicitly via the `permissions` field.

## Bootstrap Sequence
- This agent must be bootstrapped using the **G-03** standard bootstrap sequence defined in `10_agent_runtime_design`.
- Sequence: (1) Read `client-config/CLIENT.md` (2) Read `MEMORY.md` (3) Read `TEAM_LOG.md` last 10 entries (4) Query DB: `SELECT * FROM sprint_state` (5) Query DB: `SELECT * FROM handoffs WHERE to_agent = '<this-agent>' AND status = 'pending'` — if empty: exit cleanly (6) Re-run any failed skills (retries < 3) (7) `UPDATE agents SET status = 'running', last_run = NOW()`

## Handoff Triggers
- TBD: Define the conditions that cause this agent to hand off work to another agent (e.g., phase completion, manual invocation, error thresholds).
- TBD: Specify the target agent(s) and any required payload or context for the handoff.

> TEMPLATE — copy this file to `agents/<slug>/AGENTS.md` and fill in all TBD fields before Phase N starts.
