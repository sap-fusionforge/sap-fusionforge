-- SAP FusionForge | schema.sql | Generated for Phase 0 S05

CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('pro-code','citizen','research','low-code')),
    phase INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','running','blocked','done')),
    last_run TEXT
);

CREATE TABLE handoffs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,
    artifact_type TEXT,
    artifact_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected')),
    idempotency_key TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE skill_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    skill TEXT NOT NULL,
    run_id TEXT UNIQUE,
    outcome TEXT CHECK(outcome IN ('success','failure','skipped')),
    quality_score REAL,
    token_count INTEGER,
    duration_secs REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    produced_by TEXT NOT NULL,
    content_path TEXT NOT NULL,
    handoff_id INTEGER REFERENCES handoffs(id),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    acceptance_criteria TEXT,
    platform_type TEXT CHECK(platform_type IN ('CAP','Build Apps','BPA','None')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','refined','approved','implemented')),
    sprint INTEGER
);

CREATE TABLE decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    context TEXT,
    decision TEXT NOT NULL,
    consequences TEXT,
    adr_number TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','accepted','deprecated')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sprint_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE cost_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    skill TEXT NOT NULL,
    token_count INTEGER,
    model TEXT,
    cost_usd REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE heartbeat_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    checked_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL CHECK(status IN ('ok','warning','critical')),
    issues_found TEXT
);

CREATE TABLE skill_traces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT,
    agent TEXT NOT NULL,
    skill TEXT NOT NULL,
    skill_version TEXT,
    scenario TEXT,
    outcome TEXT,
    quality_score REAL,
    token_count INTEGER,
    duration_secs REAL,
    error_reason TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE skill_improvements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill TEXT NOT NULL,
    pr_number INTEGER,
    pr_type TEXT CHECK(pr_type IN ('patch','minor','major')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','open','merged','rejected')),
    score_before REAL,
    score_after REAL,
    org_observer_verdict TEXT,
    sa_decision TEXT CHECK(sa_decision IN ('approved','rejected','deferred')),
    merged_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_handoffs_from_to_status ON handoffs(from_agent, to_agent, status);
CREATE INDEX idx_skill_runs_agent_skill ON skill_runs(agent, skill);
CREATE INDEX idx_artifacts_produced_by_type ON artifacts(produced_by, type);
CREATE INDEX idx_user_stories_status_sprint ON user_stories(status, sprint);
CREATE INDEX idx_cost_log_agent_created_at ON cost_log(agent, created_at);
CREATE INDEX idx_skill_traces_agent_skill_timestamp ON skill_traces(agent, skill, timestamp);