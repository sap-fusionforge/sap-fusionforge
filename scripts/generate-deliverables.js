// SAP FusionForge | scripts/generate-deliverables.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'fusionforge.db');
const OUTPUT_PATH = path.join(__dirname, '..', 'DELIVERABLES.md');

function generateDeliverables() {
    if (!fs.existsSync(DB_PATH)) {
        const minimalContent = `# Deliverables
Generated: ${new Date().toISOString()}
## Summary
No data yet — run node setup.js
`;
        fs.writeFileSync(OUTPUT_PATH, minimalContent);
        console.log('DELIVERABLES.md written with 0 artifacts (no DB found)');
        return;
    }

    const db = new Database(DB_PATH, { readonly: true });

    // Column names match schema.sql: produced_by, content_path, created_at
    const artifacts = db.prepare(`
        SELECT produced_by AS agent, type, content_path AS path, version, handoff_id, created_at AS created
        FROM artifacts
        ORDER BY produced_by, type
    `).all();

    // sprint_state is key-value: key TEXT PRIMARY KEY, value TEXT
    const getState = db.prepare('SELECT value FROM sprint_state WHERE key = ?');
    const sprintState = {
        current_phase:  (getState.get('current_phase')  || {}).value || 'N/A',
        phase_gate:     (getState.get('phase_gate')      || {}).value || 'N/A',
        boot_completed: (getState.get('boot_completed')  || {}).value || 'N/A',
    };

    db.close();

    const byAgent = {};
    const byType = {};
    for (const a of artifacts) {
        const agent = a.agent || 'Unknown';
        const type = a.type || 'Unknown';
        byAgent[agent] = (byAgent[agent] || 0) + 1;
        byType[type] = (byType[type] || 0) + 1;
    }

    const groupedByAgent = {};
    for (const a of artifacts) {
        const agent = a.agent || 'Unknown';
        if (!groupedByAgent[agent]) groupedByAgent[agent] = [];
        groupedByAgent[agent].push(a);
    }
    for (const agent in groupedByAgent) {
        groupedByAgent[agent].sort((a, b) => (a.type || '').localeCompare(b.type || ''));
    }

    const lines = [];
    lines.push('# Deliverables');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(`- Total artifacts: ${artifacts.length}`);

    Object.keys(byAgent).sort().forEach(a => lines.push(`- By agent: ${a}: ${byAgent[a]}`));
    Object.keys(byType).sort().forEach(t => lines.push(`- By type: ${t}: ${byType[t]}`));

    lines.push('');
    lines.push('## Artifact Catalog');

    Object.keys(groupedByAgent).sort().forEach(agent => {
        lines.push('');
        lines.push(`### ${agent}`);
        lines.push('| # | Type | Path | Version | Handoff ID | Created |');
        lines.push('|---|---|---|---|---|---|');
        let rowNum = 1;
        for (const a of groupedByAgent[agent]) {
            lines.push(`| ${rowNum++} | ${a.type || ''} | ${a.path || ''} | ${a.version || ''} | ${a.handoff_id || ''} | ${a.created || ''} |`);
        }
    });

    lines.push('');
    lines.push('## Sprint Status');
    lines.push(`Phase: ${sprintState.current_phase}`);
    lines.push(`Gate: ${sprintState.phase_gate}`);
    lines.push(`Boot: ${sprintState.boot_completed}`);

    fs.writeFileSync(OUTPUT_PATH, lines.join('\n'));
    console.log(`DELIVERABLES.md written with ${artifacts.length} artifacts`);
}

generateDeliverables();
