// SAP FusionForge | scripts/generate-cost-report.js
'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'fusionforge.db');
const OUTPUT_PATH = path.join(__dirname, '..', 'COST_REPORT.md');

const isWeek = process.argv.includes('--week');
const periodText = isWeek ? 'Last 7 days' : 'All time';

function writeEmpty(reason) {
    const content = `# Cost Report
Generated: ${new Date().toISOString()}
Period: ${periodText}

## Summary
- Total runs: 0
- Total tokens: 0
- Total cost: $0.00
- Average cost per run: $0.00

${reason}
`;
    fs.writeFileSync(OUTPUT_PATH, content);
    console.log(`COST_REPORT.md written (${reason})`);
}

if (!fs.existsSync(DB_PATH)) {
    writeEmpty('No data yet — run node setup.js');
    process.exit(0);
}

const db = new Database(DB_PATH, { readonly: true });

const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='cost_log'"
).get();
if (!tableExists) {
    db.close();
    writeEmpty('No data yet — cost_log table not found');
    process.exit(0);
}

// Schema columns: id, agent, skill, token_count, model, cost_usd, created_at
const whereClause = isWeek ? "WHERE created_at >= datetime('now', '-7 days')" : '';
const rows = db.prepare(`SELECT agent, skill, token_count, model, cost_usd FROM cost_log ${whereClause}`).all();
db.close();

if (rows.length === 0) {
    writeEmpty('No data yet');
    process.exit(0);
}

const totalRuns = rows.length;
const totalTokens = rows.reduce((s, r) => s + (r.token_count || 0), 0);
const totalCost = rows.reduce((s, r) => s + (r.cost_usd || 0), 0);
const avgCost = totalCost / totalRuns;

const byAgent = {};
rows.forEach(r => {
    const a = r.agent || 'Unknown';
    if (!byAgent[a]) byAgent[a] = { runs: 0, tokens: 0, cost: 0 };
    byAgent[a].runs++;
    byAgent[a].tokens += r.token_count || 0;
    byAgent[a].cost += r.cost_usd || 0;
});

const byModel = {};
rows.forEach(r => {
    const m = r.model || 'Unknown';
    if (!byModel[m]) byModel[m] = { runs: 0, tokens: 0, cost: 0 };
    byModel[m].runs++;
    byModel[m].tokens += r.token_count || 0;
    byModel[m].cost += r.cost_usd || 0;
});

const bySkill = {};
rows.forEach(r => {
    const key = `${r.agent || 'Unknown'}||${r.skill || 'Unknown'}`;
    if (!bySkill[key]) bySkill[key] = { agent: r.agent || 'Unknown', skill: r.skill || 'Unknown', runs: 0, tokens: 0, cost: 0 };
    bySkill[key].runs++;
    bySkill[key].tokens += r.token_count || 0;
    bySkill[key].cost += r.cost_usd || 0;
});
const topSkills = Object.values(bySkill).sort((a, b) => b.cost - a.cost).slice(0, 10);

const alerts = [];
Object.values(bySkill).forEach(s => {
    const avgSkillCost = s.cost / s.runs;
    if (avgSkillCost > 0.50) {
        alerts.push(`- Skill **${s.skill}** (${s.agent}): avg $${avgSkillCost.toFixed(2)}/run > $0.50 threshold`);
    }
});
if (isWeek && totalCost > 5.00) {
    alerts.push(`- Weekly total $${totalCost.toFixed(2)} > $5.00 threshold`);
}

let md = `# Cost Report
Generated: ${new Date().toISOString()}
Period: ${periodText}

## Summary
- Total runs: ${totalRuns}
- Total tokens: ${totalTokens.toLocaleString()}
- Total cost: $${totalCost.toFixed(4)}
- Average cost per run: $${avgCost.toFixed(4)}

## By Agent
| Agent | Runs | Tokens | Cost ($) |
|---|---|---|---|
`;
Object.entries(byAgent).sort((a, b) => b[1].cost - a[1].cost).forEach(([name, d]) => {
    md += `| ${name} | ${d.runs} | ${d.tokens.toLocaleString()} | ${d.cost.toFixed(4)} |\n`;
});

md += `
## By Model
| Model | Runs | Tokens | Cost ($) |
|---|---|---|---|
`;
Object.entries(byModel).sort((a, b) => b[1].cost - a[1].cost).forEach(([name, d]) => {
    md += `| ${name} | ${d.runs} | ${d.tokens.toLocaleString()} | ${d.cost.toFixed(4)} |\n`;
});

md += `
## By Skill (Top 10 by cost)
| Agent | Skill | Runs | Avg Tokens | Total Cost ($) |
|---|---|---|---|---|
`;
topSkills.forEach(s => {
    const avgTok = Math.round(s.tokens / s.runs);
    md += `| ${s.agent} | ${s.skill} | ${s.runs} | ${avgTok} | ${s.cost.toFixed(4)} |\n`;
});

md += `
## Budget Alerts
${alerts.length === 0 ? 'No alerts' : alerts.join('\n')}
`;

fs.writeFileSync(OUTPUT_PATH, md);
console.log(`COST_REPORT.md written with ${totalRuns} runs`);
