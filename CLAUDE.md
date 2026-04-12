# CLAUDE.md — SAP FusionForge Session Protocol

## Identity

SAP FusionForge is a Paperclip AI agent company template simulating a SAP BTP Fusion Team / Center of Excellence. Built for the `paperclipai/companies` ecosystem. Runtime: GitHub Actions.

## Session Start Protocol

**Claude MUST run these steps in order at session start:**

1. **Read CONTEXT.md** — locked project decisions (if file exists)
2. **Read docs/ARCHITECTURE.md** — system design overview
3. **Read HANDOFFS.md** — check for pending cross-agent handoffs
4. **Query fusionforge.db:**
   ```sql
   SELECT * FROM agents;
   SELECT * FROM skills;
   SELECT phase_gate FROM phases;
   ```

## Available Slash Commands

| Command | Purpose |
|:---|:---|
| `/session-log` | Write completion note to session logs |
| `/sync` | Sync database state with repo |
| `/dry-run` | Run `paperclipai company import --from . --dry-run` |

## Key Rules

1. **No agent pushes to `main`** — only BTP Admin opens PRs to main
2. **Phase gate** — Phase 2 only starts when Solution Architect writes `phase_gate='approved'` to DB
3. **Branch naming** — all agent outputs committed to branches named `agent/<slug>-<task>`
4. **Validation** — after any code is written, run `paperclipai company import --from . --dry-run`

## Repo Structure

```
sap-fusionforge/
├── agents/              # Agent definitions (AGENTS.md per role)
├── skills/              # Skill definitions (SKILL.md per skill)
├── client-config/       # Pluggable client scenario files
│   ├── CLIENT.md        # Active client (swap to change industry)
│   └── scenarios/       # hr-services.md, manufacturing.md, retail.md
├── docs/
│   └── ARCHITECTURE.md  # System design — read at session start
├── scripts/             # setup.js, verify-db.js, load-client.js
├── .github/workflows/   # GitHub Actions (one per agent heartbeat)
├── CONTEXT.md           # Locked decisions — read at session start
├── HANDOFFS.md          # Cross-agent work items
├── AGENT_REGISTRY.json  # Agent manifest (6 entries)
└── fusionforge.db       # SQLite state store (gitignored)
```

## Session Flow

1. **Start** → run protocol steps 1–4 above
2. **Work** → create feature branch `agent/<slug>-<task>` before any edits
3. **Validate** → run `/dry-run` after code changes
4. **Close** → run `/session-log` and update HANDOFFS.md if needed
