---
skill: architecture-decision-record
artifact_type: ADR
reads_client_md: true
output_schema: {id: string, title: string, context: string, options: {id: string, description: string, pros: string[], cons: string[]}[], decision: string, consequences: {positive: string[], negative: string[], risks: string[]}, sap_activate_phase: string, status: string, schema_version: string}
agent: solution-architect
version: 0.1.0
---

## What this skill does
This skill orchestrates a structured, multi-turn drafting process (based on the adr.js pattern) to produce formal Architecture Decision Records (ADRs) grounded in SAP BTP reference architecture. ADRs are tailored to the client scenario using CLIENT.md and input artifacts (BRD/discovery_alignment_report). Each section is drafted separately, validated through a simulated ADR Review Seminar, then PII-scanned before final commit. The process ensures decisions are traceable to SAP Activate phases and SAP Discovery Center recommendations.

## Bootstrap (mandatory)
Execute the standard G-03 bootstrap sequence for the Solution Architect agent:
1. **Initialize Agent Context:** Set agent identity as `solution-architect`, load role permissions and scope.
2. **Load Client Configuration:** Read `client-config/CLIENT.md` for business context, constraints, and technical landscape.
3. **Load Reference Corpus:** Read `docs/sap-btp-reference.md` for SAP BTP services, principles, and integration patterns.
4. **Query Input Artifacts:** Retrieve from `artifacts` table where `artifact_type IN ('BRD','discovery_alignment_report') AND status='pending'`.
5. **Check Handoffs:** Retrieve from `handoffs` table where `to_agent='solution-architect' AND status='pending'`.
6. **Load Sprint State:** Retrieve `sprint_state.phase_gate` and `team_config` for current phase context.
7. **Log Start:** Insert record into `skill_runs` with `status='started', agent='solution-architect', skill='architecture-decision-record'.

## Trigger
Skill triggers when a handoff is received with:
- `to_agent = 'solution-architect'`
- `status = 'pending'`
- Associated artifact is of type `'BRD'` or `'discovery_alignment_report'` with `status='pending'`.

## Inputs
- `client-config/CLIENT.md`: Primary client scenario, constraints, goals.
- `docs/sap-btp-reference.md`: SAP BTP service catalog, architectural principles, patterns.
- DB: `artifacts` table records where `artifact_type IN ('BRD','discovery_alignment_report') AND status='pending'`.
- DB: `handoffs` table records where `to_agent='solution-architect' AND status='pending'`.
- DB: `sprint_state` table for current `phase_gate` and phase.

## Multi-Turn Drafting Protocol (adr.js pattern)
ADR sections use SAP Activate phase names (Discover, Prepare, Explore, Realize, Deploy, Run) where relevant. The pattern follows seven sequential drafting turns, culminating in a Review Seminar before final validation and commit.

**Turn 1 — Load Reference Corpus:** Parse `docs/sap-btp-reference.md`. Extract relevant SAP BTP services (e.g., CAP, Cloud Foundry Runtime, SAP Integration Suite), integration patterns (Event-Driven, API-First), and architectural constraints (TENANT_ISOLATION, DATA_RESIDENCY) applicable to the client's scenario.

**Turn 2 — Draft Context Section:** Using CLIENT.md and the BRD/discovery_alignment_report artifact, write the ADR `context`. Include: business driver, current system landscape (e.g., legacy SAP ECC system), key constraints (budget, timeline, compliance), and the SAP Activate phase where this decision is being made (e.g., Explore).

**Turn 3 — Enumerate Considered Options:** Generate at least two viable architectural options. For each option, provide:
- `id` (e.g., OPTION_A)
- `description` (must reference specific BTP services/patterns)
- `pros[]` (benefits list)
- `cons[]` (trade-offs list)
Example: "OPTION_A: Use CAP with PostgreSQL hyperscaler option and OData v4 services."

**Turn 4 — Draft Decision Outcome:** State the chosen option (`decision` field) and primary rationale. Cross-reference SAP Discovery Center mission alignment from `discovery_alignment_report` if available (e.g., "Aligns with SAP Discovery Center mission DC-2024-087 for cloud-native development").

**Turn 5 — Draft Consequences:** Populate the `consequences` object:
- `positive`: List business/technical benefits.
- `negative`: List trade-offs (cost, performance, complexity).
- `risks`: List risks, each tagged with the SAP Activate phase when it materializes (e.g., "Risk: OData v4 compatibility drift — phase: Realize").

**ADR Review Seminar (ChatDev pattern)**
**Executed after Turn 5, before Turn 6 (PII Scan).** Simulate a two-perspective review:
- **Business Analyst Perspective:** Validate alignment with original user stories and acceptance criteria from the BRD. Flag any deviations.
- **CAP-Developer Perspective:** Assess technical feasibility given CAP/OData/Event model constraints. Identify implementation risks.
Log any objections or concerns, and incorporate significant ones as additional risks in the `consequences.risks` array.

**Turn 6 — PII Scan:** Scan the complete ADR draft (including all sections and Review Seminar notes) for Personally Identifiable Information (PII): names, emails, organization-specific IDs, credentials. If PII is found:
1. Redact the PII from the draft.
2. Log the redaction action to `TEAM_LOG.md`.
3. Ensure redacted sections remain coherent without reintroducing PII.

**Turn 7 — Validate and Commit:** Validate the final draft against the `output_schema`:
- Ensure all required fields (`id`, `title`, `context`, `options`, `decision`, `consequences`, `sap_activate_phase`, `status`, `schema_version`) are populated and non-empty.
- Confirm `options` array contains at least 2 options.
- Verify `schema_version = 'ADR v1.0'`.
- Confirm `sap_activate_phase` is one of: Discover, Prepare, Explore, Realize, Deploy, Run.
- Confirm no PII remains (post-scan).
- Generate `id` as `ADR-{YYYY}-{NNN}` where `NNN` = (count of ADRs in `artifacts` table for this `client_id`) + 1, formatted as 3-digit sequence.
Then:
1. Save artifact to `artifacts/adr-{id}.md` with YAML frontmatter.
2. Insert row into `artifacts` table: `artifact_type='ADR', artifact_id='adr-{id}', status='ready'`.
3. Create handoff to `'design-landscape'` agent: `{from_agent='solution-architect', to_agent='design-landscape', artifact_type='ADR', artifact_id='adr-{id}', status='pending'}`.

## Output
Final artifact saved as `artifacts/adr-{id}.md` with YAML frontmatter exactly matching the defined `output_schema`. The markdown body contains the structured ADR content.

## Validation (mandatory per G-05)
- `context`, `decision`, `consequences` sections are non-empty.
- At least 2 options documented in the `options` array.
- `schema_version` field equals `'ADR v1.0'`.
- `sap_activate_phase` is a valid SAP Activate phase.
- No PII present in the final artifact (confirmed by scan).
- Row inserted into `artifacts` table with `artifact_type='ADR'`.
- Handoff row created with `to_agent='design-landscape'` and `status='pending'`.

## On Failure
- Log error details to `skill_runs` table, increment `retry_count`.
- On 3rd consecutive failure: Append `ERROR: ADR drafting blocked - [error detail]` to `TEAM_LOG.md`. Set `phase_gate='blocked'` in `sprint_state` table. Notify `release-lead` agent.

## Handoff
On successful execution:
- Set the ADR artifact `status='ready'` in the `artifacts` table.
- Create a handoff record: `{from_agent='solution-architect', to_agent='design-landscape', artifact_type='ADR', artifact_id='adr-{id}', status='pending'}`.