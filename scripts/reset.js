#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// --- Configuration ---
const DB_PATH = path.join(ROOT_DIR, 'fusionforge.db');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const MEMORY_PATH = path.join(ROOT_DIR, 'MEMORY.md');
const TEAM_LOG_PATH = path.join(ROOT_DIR, 'TEAM_LOG.md');
const TEAM_LOG_ARCHIVE_PATH = path.join(ROOT_DIR, 'TEAM_LOG.archive.md');
const CLIENT_PATH = path.join(ROOT_DIR, 'CLIENT.md');

// --- CLI Argument Parsing ---
const args = process.argv.slice(2);
const flags = {
    dryRun: args.includes('--dry-run'),
    scenario: args.find(arg => arg.startsWith('--scenario'))?.split('=')[1] || args[args.indexOf('--scenario') + 1],
    phase: args.find(arg => arg.startsWith('--phase'))?.split('=')[1] || args[args.indexOf('--phase') + 1]
};

// --- Helpers ---

const log = (msg) => console.log(msg);
const warn = (msg) => console.warn(chalk.red(msg));
const success = (msg) => console.log(chalk.green.bold(msg));
const info = (msg) => console.log(chalk.blue(msg));

function generateTimestamp() {
    return new Date().toISOString();
}

// --- Core Logic ---

async function confirmAction(warningText) {
    if (flags.dryRun) {
        info(`[DRY RUN] Skipping confirmation.`);
        return true;
    }

    warn("============================================================");
    warn("                      WARNING");
    warn("============================================================");
    warn(warningText);
    warn("============================================================");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(chalk.red.bold('\nTo proceed, type "RESET" and press Enter: '), (answer) => {
            rl.close();
            if (answer.trim() === 'RESET') {
                resolve(true);
            } else {
                console.log(chalk.yellow('\nAborted. Invalid confirmation.'));
                resolve(false);
            }
        });
    });
}

function archiveTeamLog() {
    const action = 'Archive TEAM_LOG.md';
    if (!fs.existsSync(TEAM_LOG_PATH)) {
        log(`[SKIP] ${action}: File not found.`);
        return;
    }

    const content = fs.readFileSync(TEAM_LOG_PATH, 'utf-8');
    if (!content.trim()) {
        log(`[SKIP] ${action}: File is empty.`);
        return;
    }

    if (flags.dryRun) {
        info(`[DRY RUN] ${action}: Append to ${TEAM_LOG_ARCHIVE_PATH} and clear.`);
        return;
    }

    const timestamp = generateTimestamp();
    const archiveEntry = `\n\n--- Archived: ${timestamp} ---\n${content}`;

    fs.appendFileSync(TEAM_LOG_ARCHIVE_PATH, archiveEntry);
    fs.writeFileSync(TEAM_LOG_PATH, '');
    log(`${action}: Done.`);
}

function resetMemory() {
    const action = 'Reset MEMORY.md';
    if (flags.dryRun) {
        info(`[DRY RUN] ${action}: Overwrite with template.`);
        return;
    }

    const template = `## Approved

## Rejected Options

## Deprecated Context
`;
    fs.writeFileSync(MEMORY_PATH, template);
    log(`${action}: Done.`);
}

function resetDatabase() {
    const action = 'Reset Database';
    if (!fs.existsSync(DB_PATH)) {
        warn(`[SKIP] ${action}: Database not found at ${DB_PATH}`);
        return;
    }

    if (flags.dryRun) {
        info(`[DRY RUN] ${action}: Truncating tables and resetting agents.`);
        return;
    }

    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = OFF');

    const tablesToClear = ['skill_runs', 'handoffs', 'artifacts', 'user_stories', 'decisions'];
    const phaseFilter = flags.phase ? parseInt(flags.phase) : null;

    try {
        for (const table of tablesToClear) {
            const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
            if (!tableExists) continue;

            if (phaseFilter) {
                try {
                    db.prepare(`DELETE FROM ${table} WHERE phase >= ?`).run(phaseFilter);
                } catch (e) {
                    // phase column doesn't exist on this table — clear all
                    db.prepare(`DELETE FROM ${table}`).run();
                }
            } else {
                db.prepare(`DELETE FROM ${table}`).run();
            }
        }

        // Reset sprint_state
        const sprintStateExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='sprint_state'`).get();
        if (sprintStateExists) {
            db.prepare(`DELETE FROM sprint_state`).run();
        }

        // Reset all agents to idle
        db.prepare(`UPDATE agents SET status = 'idle', last_run = NULL`).run();

        log(`${action}: Done.`);
    } catch (err) {
        console.error(chalk.red(`Database Error: ${err.message}`));
    } finally {
        db.close();
    }
}

async function handleScenario() {
    if (!flags.scenario) return;

    const sourcePath = path.join(ROOT_DIR, 'scenarios', `${flags.scenario}.md`);
    const action = `Switch Scenario to ${flags.scenario}`;

    if (!fs.existsSync(sourcePath)) {
        warn(`[ERROR] ${action}: Source scenario file not found at ${sourcePath}`);
        return;
    }

    if (flags.dryRun) {
        info(`[DRY RUN] ${action}: Copy ${sourcePath} to ${CLIENT_PATH}`);
        return;
    }

    fs.copyFileSync(sourcePath, CLIENT_PATH);
    log(`${action}: Done.`);
}

function deleteEnvFile() {
    const action = 'Delete .env';
    if (!fs.existsSync(ENV_PATH)) {
        log(`[SKIP] ${action}: File not found.`);
        return;
    }

    if (flags.dryRun) {
        info(`[DRY RUN] ${action}: Delete ${ENV_PATH}`);
        return;
    }

    fs.unlinkSync(ENV_PATH);
    log(`${action}: Done.`);
}

// --- Main Execution ---

async function main() {
    console.log(chalk.cyan.bold('\n--- SAP FusionForge Reset Script ---\n'));

    let warningMsg = "This action will PERMANENTLY DELETE data:\n";
    warningMsg += "- Archive and clear TEAM_LOG.md\n";
    warningMsg += "- Reset MEMORY.md\n";
    warningMsg += "- Clear DB tables (skill_runs, handoffs, artifacts, user_stories, decisions)\n";
    warningMsg += "- Reset agents status to idle\n";
    if (flags.scenario) warningMsg += `- Switch CLIENT.md to scenario: ${flags.scenario}\n`;
    if (flags.phase) warningMsg += `- Limiting DB clear to phase >= ${flags.phase}\n`;
    warningMsg += "- Delete .env file (API Keys, DB Config)\n";

    const confirmed = await confirmAction(warningMsg);

    if (!confirmed) {
        process.exit(0);
    }

    archiveTeamLog();
    resetMemory();
    resetDatabase();
    await handleScenario();
    deleteEnvFile();

    console.log(chalk.green.bold('\n--- RESET COMPLETE ---'));
    console.log(chalk.green('Environment has been reset successfully.'));
}

main().catch(err => {
    console.error(chalk.red('Fatal Error:'), err);
    process.exit(1);
});
