// scripts/check-readiness.js
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import betterSqlite3 from 'better-sqlite3';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const REQUIRED_KEYS = [
    'LLM_PROVIDER',
    'LLM_API_KEY',
    'DATABASE_PATH',
    'CLIENT_SCENARIO',
    'GITHUB_TOKEN',
    'SOLUTION_ARCHITECT_MODEL',
    'BUSINESS_ANALYST_MODEL',
    'DISCOVERY_ADVISOR_MODEL',
    'CAP_DEVELOPER_MODEL',
    'BUILD_APPS_DEVELOPER_MODEL',
    'BPA_DESIGNER_MODEL',
    'BTP_ADMIN_MODEL'
];

const REQUIRED_TABLES = [
    'agents',
    'handoffs',
    'skill_runs',
    'artifacts',
    'user_stories',
    'decisions',
    'sprint_state',
    'cost_log'
];

// --- Helpers ---
const logPass = (msg) => console.log(chalk.green('[PASS]'), msg);
const logFail = (msg, detail) => console.log(chalk.red('[FAIL]'), msg + (detail ? ` — ${detail}` : ''));

// --- Checks ---

function checkEnvExists() {
    if (!fs.existsSync('.env')) return { pass: false, detail: '.env file not found' };
    const stats = fs.statSync('.env');
    if (stats.size === 0) return { pass: false, detail: '.env file is empty' };
    return { pass: true };
}

function checkRequiredKeys() {
    const missing = REQUIRED_KEYS.filter(k => !process.env[k] || process.env[k].trim() === '');
    if (missing.length > 0) return { pass: false, detail: `Missing: ${missing.join(', ')}` };
    return { pass: true };
}

function checkDatabaseWritable() {
    const dbPath = process.env.DATABASE_PATH || './fusionforge.db';
    const dbDir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dbDir)) return { pass: false, detail: `Directory not found: ${dbDir}` };
    const testFile = path.join(dbDir, `.tmp_write_test_${Date.now()}`);
    try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return { pass: true };
    } catch (e) {
        return { pass: false, detail: e.message };
    }
}

function checkDbSchema() {
    const dbPath = process.env.DATABASE_PATH || './fusionforge.db';
    if (!fs.existsSync(dbPath)) return { pass: false, detail: `DB file not found: ${dbPath}` };
    try {
        const db = betterSqlite3(dbPath, { readonly: true });
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
        db.close();
        const missing = REQUIRED_TABLES.filter(t => !tables.includes(t));
        if (missing.length > 0) return { pass: false, detail: `Missing tables: ${missing.join(', ')}` };
        return { pass: true };
    } catch (e) {
        return { pass: false, detail: e.message };
    }
}

function checkProviderApi() {
    const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
    const apiKey = process.env.LLM_API_KEY;

    let url, headers;

    switch (provider) {
        case 'anthropic':
            url = 'https://api.anthropic.com/v1/models';
            headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
            break;
        case 'openai':
            url = 'https://api.openai.com/v1/models';
            headers = { 'Authorization': `Bearer ${apiKey}` };
            break;
        case 'openrouter':
            url = 'https://openrouter.ai/api/v1/models';
            headers = { 'Authorization': `Bearer ${apiKey}` };
            break;
        case 'gemini':
            url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            headers = {};
            break;
        case 'azure': {
            const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
            if (!endpoint) return Promise.resolve({ pass: false, detail: 'AZURE_OPENAI_ENDPOINT not set' });
            url = `${endpoint}/openai/deployments?api-version=2024-02-01`;
            headers = { 'api-key': apiKey };
            break;
        }
        default:
            return Promise.resolve({ pass: false, detail: `Unknown provider: ${provider}` });
    }

    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers
        };
        const req = https.request(options, (res) => {
            res.resume(); // drain
            if (res.statusCode === 200) {
                resolve({ pass: true });
            } else {
                resolve({ pass: false, detail: `HTTP ${res.statusCode}` });
            }
        });
        req.on('error', (e) => resolve({ pass: false, detail: e.message }));
        req.end();
    });
}

function checkAgentsIdle() {
    const dbPath = process.env.DATABASE_PATH || './fusionforge.db';
    if (!fs.existsSync(dbPath)) return { pass: false, detail: 'DB not found' };
    try {
        const db = betterSqlite3(dbPath, { readonly: true });
        const row = db.prepare("SELECT COUNT(*) as count FROM agents WHERE status != 'idle'").get();
        db.close();
        if (row.count > 0) return { pass: false, detail: `${row.count} agent(s) not idle` };
        return { pass: true };
    } catch (e) {
        return { pass: false, detail: e.message };
    }
}

// --- Main ---
(async () => {
    console.log(chalk.bold.cyan('\nSAP FusionForge — Readiness Check'));
    console.log(chalk.gray('─'.repeat(40)));

    const results = [];

    const run = (label, result) => {
        if (result.pass) {
            logPass(label);
        } else {
            logFail(label, result.detail);
        }
        results.push(result.pass);
    };

    // 1. .env exists
    const envResult = checkEnvExists();
    run('.env EXISTS', envResult);

    if (!envResult.pass) {
        console.log(chalk.yellow('\nSkipping checks 2–6: .env file missing or empty.'));
    } else {
        dotenv.config();

        // 2. Required keys
        run('REQUIRED KEYS', checkRequiredKeys());

        // 3. DB writable
        run('DATABASE WRITABLE', checkDatabaseWritable());

        // 4. DB schema
        run('DB SCHEMA VALID', checkDbSchema());

        // 5. Provider API reachable
        run('PROVIDER API REACHABLE', await checkProviderApi());

        // 6. All agents idle
        run('ALL AGENTS IDLE', checkAgentsIdle());
    }

    console.log(chalk.gray('─'.repeat(40)));

    const failCount = results.filter(r => !r).length;
    if (failCount === 0) {
        console.log(chalk.bold.green('All checks passed. Ready to run.\n'));
        process.exit(0);
    } else {
        console.log(chalk.bold.red(`${failCount} check(s) failed. Fix before running agents.\n`));
        process.exit(1);
    }
})();
