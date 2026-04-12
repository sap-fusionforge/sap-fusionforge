## What is SAP FusionForge
Paperclip AI company template. Hub-and-spoke multi-agent team simulating an SAP BTP Center of Excellence. Runs on GitHub Actions; zero managed infrastructure.

## Hub-and-spoke agent flow
```
[Solution Architect (hub)]
       ↑    ↓ routes
┌──────┬─────┬───────┬─────────────┬──────────┬──────┐
BA   Disc   CAP     Build        BPA       BTP
Analyst  Advisor  Developer    Apps Dev   Designer   Admin
```

## Runtime: GitHub Actions
Triggered by cron heartbeats and webhook events (e.g., issue creation). No persistent servers.

## Artifact chain
BRD → ADR → SDD → UI_spec → BPMN → deployment_bundle
Each agent's specialized skill consumes the prior artifact as primary input.

## Handoff mechanism
SQLite pull model. Agents read from a central `handoffs` table; they never push directly. Each agent runs `check-readiness.js`, which exits cleanly if no ready work exists.

## MEMORY.md
Four Mem0 sections: `Approved Decisions | Rejected Decisions | Open Decisions | Deprecated`. Maintained by the Solution Architect. Decisions are applied only when SA sets status='approved'.

## Phase gate
Solution Architect writes `phase_gate='approved'` to the `sprint_state` table before Phase 2 developers (CAP Developer, Build Apps Developer, BPA Designer) activate. No approval = no dev work starts.

## Self-improvement
Three-layer optimization loop:
1. Execution traces auto-logged to `RETRO.md`.
2. Skill-optimizer reads `RETRO.md`, proposes `SKILL.md` delta.
3. Solution Architect approves → changes applied in next run.

## Key files index
- `COMPANY.md` — Template company mission, agent roster, pipeline overview.
- `CLAUDE.md` — Core agent interaction principles and session protocols.
- `BOOT.md` — Initialization sequence and environment sanity checks.
- `AGENT_REGISTRY.json` — Canonical list of all agents: slugs, phases, skills, artifact types.
- `HEARTBEAT.md` — Cron schedule definitions and last-execution status per agent.
- `client-config/CLIENT.md` — Target SAP BTP client landscape (swapped per engagement).
- `MEMORY.md` — System memory: approved/rejected/open/deprecated decisions.
- `docs/sap-btp-reference.md` — BTP service reference loaded by all agents (replaces 16 planning docs).
