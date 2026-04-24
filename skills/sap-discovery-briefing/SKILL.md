---
skill: sap-discovery-briefing
artifact_type: discovery_alignment_report
reads_client_md: true
output_schema: {matched_missions: {id: string, title: string, url: string, tier: string, adaptation: string}[], sub_questions: string[], perspective_notes: {business: string, technical: string, ux: string, risk: string, cost: string}, recommendation: string, catalog_updated: boolean, schema_version: string}
agent: solution-architect
version: 0.1.0
---

## What this skill does
This skill orchestrates the discovery phase for SAP BTP solutions. The Solution Architect agent dispatches to the Discovery Advisor agent and reads back its structured output. Following a GPT-Researcher pattern, it first decomposes the client scenario into targeted BTP discovery sub-questions. It then synthesizes the advisory output from the Discovery Advisor—which includes catalog matches, live web intelligence, and redesign guidance—into a concise, multi-perspective brief. This brief serves as the foundational input for drafting the Architecture Decision Record (ADR). This skill executes in parallel with the Business Analyst's requirement-doc skill.

## Bootstrap (mandatory)
1. Verify agent identity is `solution-architect`.
2. Check for a pending handoff from `business-analyst`.
3. Load the central project configuration.
4. Validate access to the required databases: `artifacts`, `handoffs`, `skill_runs`.
5. Validate that the declared `output_schema` matches the expected structure (keys: matched_missions, sub_questions, perspective_notes, recommendation, catalog_updated, schema_version).
6. Initialize the local artifact storage path (`/artifacts`).
7. Log the skill start in `TEAM_LOG.md` and the `skill_runs` table.

## Trigger
A handoff from the `business-analyst` agent where `artifact_type` is `'clarification_log'` or `'BRD'` and `status` is `'pending'`. This runs concurrently with the `requirement-doc` skill.

## Inputs
- `client-config/CLIENT.md`: The primary client scenario document.
- `DB: handoffs WHERE to_agent='solution-architect' AND status='pending'`: The triggering handoff.
- `DB: artifacts WHERE artifact_type IN ('clarification_log','BRD')`: The latest business analysis artifact.
- `DB: artifacts WHERE artifact_type='discovery_alignment_report'`: A pre-existing discovery report, if available.

## Steps

### Phase 0 — Sub-Question Planning (GPT-Researcher pattern)
Analyze `CLIENT.md` and the `clarification_log` artifact. Generate 5-8 specific sub-questions to guide the BTP discovery process. Questions should target distinct dimensions: integration, data model, identity & access, process automation, UI/UX, extensibility, and compliance. Log the generated `sub_questions[]` array to the output object.

### Phase 1 — Dispatch to Discovery Advisor
If no existing `discovery_alignment_report` artifact is found:
- Insert a handoff row: `to_agent='discovery-advisor'`, `artifact_type='clarification_log'`, `status='pending'`.
- Poll the database: `SELECT * FROM handoffs WHERE from_agent='discovery-advisor' AND status='completed'` (maximum 5 retries with a 30-second interval).
- On timeout: Log a warning to `TEAM_LOG.md`, write a partial `discovery_alignment_report.md` using only `CLIENT.md` data, and proceed with reduced fidelity.

### Phase 2 — Read and Parse Discovery Output
Load the artifact where `artifact_type='discovery_alignment_report'` and `status='ready'`.
Extract the key structured data: `matched_missions[]` array, the tier (`Tier1`=catalog match, `Tier2`=live intelligence match) for each mission, and any adaptation notes. If `matched_missions[]` is empty or absent, set `catalog_updated` to false.

### Phase 3 — Synthesise 5-Perspective Tier 3 Advisory (Stanford STORM pattern)
For each matched mission, analyze its "Redesign Advisory" section, which is structured around five perspectives:
- **Business**: Alignment with revenue, cost, or compliance goals.
- **Technical**: Fit with specific BTP services and integration complexity.
- **UX**: Feasibility using SAP Build Apps or Fiori elements.
- **Risk**: Implementation risk, vendor lock-in potential, and skill gaps.
- **Cost**: Estimated BTP service subscription and implementation effort.
Consolidate this analysis into a structured `perspective_notes{}` object.

### Phase 4 — Write SA Brief
Produce the final `discovery_alignment_report.md` document with the following sections:
1. **Executive Summary**: A 2-3 sentence summary for the project sponsor.
2. **Matched Missions Table**: Listing id, title, tier, and key adaptation for each match, or an explicit "No Match" section if `matched_missions[]` is empty.
3. **Sub-Questions Resolved**: How the discovery process answered the initial sub-questions.
4. **Multi-Perspective Advisory**: One paragraph summarizing findings for each of the five perspectives.
5. **Recommendation**: A final verdict: `ALIGN WITH MODIFICATIONS` or `DESIGN CUSTOM`.
6. **ADR Inputs**: A bulleted list of specific, actionable decisions the ADR drafting skill must address.

Save the document to `artifacts/discovery_alignment_report.md`. Insert a row into the `artifacts` table with `artifact_type='discovery_alignment_report'` and `artifact_path='artifacts/discovery_alignment_report.md'`.

## Output
The primary output is saved to `artifacts/discovery_alignment_report.md`. A record is created in the `artifacts` table with `artifact_type='discovery_alignment_report'`.

## Validation (mandatory per G-05)
- Either `matched_missions[]` contains ≥1 entry, OR Section 2 explicitly contains a "No Match" heading with supporting rationale.
- All five fields in `perspective_notes` (business, technical, ux, risk, cost) are non-empty strings.
- The `recommendation` field is exactly `'ALIGN WITH MODIFICATIONS'` or `'DESIGN CUSTOM'`.
- The 'ADR Inputs' section exists and contains ≥3 bullet points.
- `schema_version` is set to `'discovery_alignment_report v1.0'`.
- A handoff to `'architecture-decision-record'` skill is inserted with `status='pending'` and includes artifact path.

## On Failure
Log error details to `skill_runs`. On third *consecutive* failure (excluding Phase 1 timeouts, which trigger partial brief immediately): write a partial brief using available data and append `PARTIAL_DISCOVERY` to `TEAM_LOG.md`. Do not block ADR drafting—the Solution Architect may draft ADR using `CLIENT.md` alone if discovery data is unavailable.

## Handoff
On successful validation: Insert handoff to `'architecture-decision-record'` skill. Include `artifact_path='artifacts/discovery_alignment_report.md'` in the handoff payload.