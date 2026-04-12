---
scenario: hr-services
industry: Human Resources Shared Services
status: active
---

# Active Client Configuration

This file defines the current client context for FusionForge.
To change the active scenario, run:

```bash
node reset.js --scenario <name>
```

Available scenarios: `hr-services` (default) · `manufacturing` · `retail`

---

## Current Scenario

See `client-config/scenarios/hr-services.md` for full details.

| Field | Value |
|---|---|
| Industry | Human Resources Shared Services |
| Scenario | hr-services |
| Default | Yes |

---

> Swap this file to change the industry context for all agents.
> Agents read this file at runtime to adapt their outputs to the active client.
