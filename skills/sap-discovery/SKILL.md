# Skill: sap-discovery

## What this skill does
Researches SAP Discovery Center missions relevant to project user stories using a 3-tier intelligence system with sub-question decomposition planning, producing an alignment report with adaptation recommendations for the solution architect.

## Bootstrap (run before anything else — mandatory)

1. Read client-config/CLIENT.md → understand active client + industry
2. Read MEMORY.md → load long-term project context
3. Read TEAM_LOG.md (last 10 entries) → understand current team state
4. Query DB: SELECT * FROM sprint_state → load active phase + scenario
5. Query DB: SELECT * FROM handoffs WHERE to_agent = 'discovery-advisor' AND status = 'pending'
   → if empty: log 'No pending work' and EXIT cleanly (do not run skill)
6. Query DB: SELECT * FROM skill_runs WHERE agent = 'discovery-advisor' AND status = 'failed' AND retries < 3
   → if any: re-run failed skills first before new work
7. Update DB: UPDATE agents SET status = 'running', last_run = NOW() WHERE id = 'discovery-advisor'

## Trigger
- When: handoff from business-analyst (user stories ready) OR dispatched by solution-architect
- Parallel with: solution-architect/design-landscape
- Condition: pending handoffs WHERE to_agent = 'discovery-advisor' AND status = 'pending'

## Phase 0 — Sub-Question Planning (sub-question decomposition pattern)
Before running any tier, the planner (DISCOVERY_PLANNER_MODEL = claude-sonnet-4-6) decomposes the project brief into 5–8 targeted BTP discovery sub-questions (minimum 5, maximum 8). Each sub-question runs Tier 1 + Tier 2 independently. Results are deduplicated (same mission ID from multiple sub-questions), scored by hit frequency, then passed to Tier 3 as a unified mission list.

Example sub-questions from 'leave request app':
1. What SAP Discovery Center missions cover leave request + approval workflow?
2. Which BTP missions show citizen dev to pro-code progression for HR?
3. Are there CAP + BPA workflow missions for employee self-service?
4. What missions show SAP Build Apps frontend with CAP backend?
5. Is there a mission for HANA-free CAP with PostgreSQL substitute?
6. What missions demonstrate BTP workflow approval patterns?
7. Are there HR process automation missions using SAP Build Process Automation?

## Steps
1. Load user stories from DB: SELECT * FROM user_stories WHERE status = 'ready'
2. Phase 0: Generate 5–8 discovery sub-questions via DISCOVERY_PLANNER_MODEL
3. **TIER 1 — Catalog Match** (always runs):
   - For each sub-question: extract keywords using compromise NLP
   - Score each mission in docs/discovery-center-catalog.yaml against keywords
   - Filter: score > 0.3, sort descending
   - Deduplicate hits across sub-questions, re-score by hit frequency
   - Flag catalog entries with last_verified older than 90 days
4. **TIER 2 — Live Web Intel** (runs if: 0 catalog matches OR stale entries OR `config.discovery.live = true` in CLIENT.md):
   - Check: if `args.live` flag passed but `config.discovery.live` not set → log warning and proceed without live tier
   - Tavily search: query = 'SAP Discovery Center mission {keywords} BTP', include_domains: [discovery.sap.com, developers.sap.com], max_results: 10
   - Firecrawl scrape on discovery.sap.com search URL for structured mission data
   - Parse results, deduplicate against Tier 1 hits
   - Self-update: append new missions to docs/discovery-center-catalog.yaml with last_verified = today
5. **TIER 3 — Redesign Advisory** (STORM pattern — always runs on Tier 1+2 output):
   For each matched mission, run 5 base perspective analyses:
   - **Perspective 1 Business:** process fit, ROI, user adoption risk, change management → KEEP/CHANGE/RISK items
   - **Perspective 2 Technical:** integration complexity, API availability, CAP compatibility, auth model → KEEP/CHANGE/RISK items
   - **Perspective 3 UX:** UI implications, mobile/desktop, citizen dev vs pro-code gap → KEEP/CHANGE/RISK items
   - **Perspective 4 Risk:** implementation risk, vendor lock-in, dependency chain, timeline → severity HIGH/MEDIUM/LOW
   - **Perspective 5 Cost:** BTP credit consumption, licensing implications, dev effort → LOW/MEDIUM/HIGH
   **Industry additions:** Manufacturing → add Perspective 6 (Supply Chain); Retail → add Perspective 6 (Customer Experience); Healthcare → add Perspective 6 (Compliance); Financial Services → add Perspective 6 (Regulatory)
   **Synthesiser (DISCOVERY_PLANNER_MODEL):** KEEP items (≥3 of 5 base perspective categories flag KEEP), CHANGE items (any perspective flags CHANGE/RISK), ADR inputs
6. Write Discovery Alignment Report to docs/discovery-alignment-report.md
   **Report sections:** Executive Summary, Matched Missions, Adaptation Recommendations (per mission), No Match Found (if applicable), ADR Inputs for Solution Architect table, Catalog Update Log
7. If scripts/validate-output.js exists: run `node scripts/validate-output.js --agent discovery-advisor`, else log warning and skip (continue)
8. DB writes (see Output section below)
9. Write TEAM_LOG entry (see Output section below)

## Output
- **artifact_type:** discovery_alignment_report
- **Artifacts produced:**
  - docs/discovery-alignment-report.md
  - docs/discovery-center-catalog.yaml (updated with Tier 2 findings)
- **DB writes:**
    INSERT INTO artifacts (agent='discovery-advisor', type='discovery_alignment_report', path='docs/discovery-alignment-report.md', schema_version='1.0')
    INSERT INTO handoffs (from_agent='discovery-advisor', to_agent='solution-architect', message='Discovery alignment report ready — [actual_count] missions matched', artifact_path='docs/discovery-alignment-report.md', status='pending')
    UPDATE skill_runs SET status='done', completed_at=NOW() WHERE agent='discovery-advisor' AND status='running'
- **TEAM_LOG entry:**
    [{timestamp}] 🔍 Discovery Advisor
      STATUS: ✅ Done
      DONE: Matched [actual_count] missions ([catalog_count] catalog + [live_count] live), 5–6-perspective Tier 3 analysis complete
      ARTIFACTS: docs/discovery-alignment-report.md
      CATALOG UPDATED: [new_catalog_count] new missions appended to docs/discovery-center-catalog.yaml
      HANDOFF → Solution Architect: Report ready for ADR writing
*(Note: Replace [placeholder] with actual integer values)*

## Validation (run after skill — mandatory)
- docs/discovery-alignment-report.md exists ✅
- Report contains ## Matched Missions section ✅
- Report contains ## Adaptation Recommendations section ✅
- At least 1 handoff row inserted for solution-architect ✅
- If 0 missions found: ## No Match Found section present with reasoning ✅
  (zero matches is a VALID outcome — SA uses this as evidence to design custom)

## On Failure
- Update skill_runs: status = 'failed', retries = retries + 1, error_msg = <message>
- Append to TEAM_LOG with ERROR tag
- Graceful degradation chain:
  - Tier 2 fails → continue with Tier 1 results only (log warning)
  - Tier 1 + Tier 2 both empty → produce No Match Found section (not an error)
  - Sub-question planning fails → fall back to direct single-keyword search on user story text
- Exit with code 1 ONLY if Tier 3 synthesis crashes (unrecoverable DB state)
- Never exit 1 for zero mission matches — that is valid output