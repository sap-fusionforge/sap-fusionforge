# HEARTBEAT — SAP FusionForge

**Last Run:** *(placeholder — updated by BTP Admin)*
**Next Run:** *(6h after last run)*

---

## Health Checks
- [ ] **DB reachable:** `fusionforge.db` exists, all tables present
- [ ] **Agent heartbeats:** All 6 agents have heartbeat row in `agents` table within last 24h
- [ ] **Pending handoffs:** No pending handoffs older than 48h in `handoffs` table
- [ ] **LLM API key valid:** Test call returns HTTP 200
- [ ] **GitHub Actions:** No failed workflow runs in last 24h
- [ ] **Boot status:** `boot_status.completed` = 1

---

## DB Integrity
- [ ] **Row counts sanity:** `agents` = 6, `skills` >= 18
- [ ] **Phase data:** No NULL `phase_gate` in `phases` table
- [ ] **Stuck skills:** No in-progress skills with `started` > 2h ago and no completion
- [ ] **Client scenario:** Client scenario loaded in `client_config` table

---

## Last Skill Run Status

| Agent | Skill | Last Run | Status | Notes |
|-------|-------|----------|--------|-------|
| business-analyst | write-user-story | — | — | — |
| solution-architect | design-landscape | — | — | — |
| cap-developer | scaffold-cap | — | — | — |
| build-apps-developer | create-app | — | — | — |
| bpa-designer | design-workflow | — | — | — |
| btp-admin | provision-subaccount | — | — | — |

---

## On Failure Protocol

1. **Log:** Append failure to `traces/heartbeat-failures.jsonl` with timestamp and failed check name
2. **Issue:** Open GitHub Issue titled `HEARTBEAT FAILURE — {timestamp}` via `GITHUB_CREATE_AN_ISSUE`
3. **Degrade:** Set agent `heartbeat_status` = `degraded` in `agents` table for affected agent

---

## Heartbeat Log *(last 5 runs)*

| Timestamp | Status | Checks Passed | Checks Failed | Notes |
|-----------|--------|---------------|---------------|-------|
| — | — | — | — | — |
| — | — | — | — | — |
| — | — | — | — | — |
| — | — | — | — | — |
| — | — | — | — | — |
