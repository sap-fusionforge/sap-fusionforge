# BOOT — First-Run Initialization Gate

**Status: NOT_COMPLETED**

## Prerequisites
- [ ] Node.js 20+ installed (`node --version`)
- [ ] `.env` file exists (copied from `.env.example`)
- [ ] `LLM_API_KEY` set in `.env` (LLM provider API key)
- [ ] `GITHUB_TOKEN` set in `.env` with `repo` scope
- [ ] Git repository cloned locally

## Boot Steps
1. **Verify .env configuration**
   ```bash
   node -e "require('dotenv').config(); ['LLM_API_KEY','GITHUB_TOKEN','DATABASE_PATH','CLIENT_SCENARIO'].forEach(k => { if (!process.env[k]) throw new Error('Missing: '+k) })"
   ```

2. **Test LLM API key**
   ```bash
   node scripts/test-llm-key.js
   ```

3. **Initialize database**
   ```bash
   node scripts/setup.js
   ```

4. **Verify DB tables created**
   ```bash
   node scripts/verify-db.js
   ```
   Checks tables: `agents`, `skills`, `handoffs`, `phases`, `client_config`, `boot_status`

5. **Load client scenario**
   ```bash
   node scripts/load-client.js --scenario=hr-services
   ```

6. **Verify agent registry**
   ```bash
   node -e "console.log(require('./AGENT_REGISTRY.json').length + ' agents registered')"
   ```
   Expected: 6 entries

7. **Mark boot complete**
   ```bash
   node scripts/setup.js --mark-complete
   ```

## Post-Boot State
- Database contains 6 agents and 18+ skills
- Client scenario `hr-services` loaded and active
- All `phase_gate` values = `'pending'` except phase 0 = `'approved'`
- `boot_status.completed` = 1

## Troubleshooting
| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| `Missing: LLM_API_KEY` | .env not loaded or variable missing | Ensure .env exists with all required variables |
| LLM test fails | Invalid/expired API key | Verify key in LLM provider dashboard |
| DB tables missing | SQLite path incorrect | Check DATABASE_PATH in .env points to writable location |
| GitHub API errors | Token missing repo scope | Regenerate token with `repo` permissions |
| Agent count mismatch | AGENT_REGISTRY.json corrupted | Restore from repository version |

## Boot Status
NOT_COMPLETED *(auto-updated by setup.js)*
