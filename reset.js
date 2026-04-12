// SAP FusionForge | reset.js | Full database reset
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');

function parseArgs(args) {
  const flags = { scenario: null, dryRun: false, phase: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--scenario' && i + 1 < args.length) {
      flags.scenario = args[++i];
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg === '--phase' && i + 1 < args.length) {
      flags.phase = parseInt(args[++i], 10);
    }
  }
  return flags;
}

async function promptUser() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('This will DELETE fusionforge.db and .env. Type YES to continue: ', (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase() === 'YES');
    });
  });
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const allowReset = process.env.FUSIONFORGE_ALLOW_RESET === 'true';

  let confirmed = allowReset;
  if (!allowReset) confirmed = await promptUser();

  if (!confirmed) {
    console.log('Reset cancelled.');
    process.exit(0);
  }

  const rootDir = __dirname;
  const dbPath = path.join(rootDir, 'fusionforge.db');
  const envPath = path.join(rootDir, '.env');
  const schemaPath = path.join(rootDir, 'schema.sql');
  const seedPath = path.join(rootDir, 'seed.sql');

  if (flags.dryRun) {
    console.log('[Dry Run] Would delete fusionforge.db if exists');
    console.log('[Dry Run] Would delete .env if exists');
    console.log(`[Dry Run] Would execute schema.sql (${fs.existsSync(schemaPath) ? 'found' : 'MISSING'})`);
    console.log(`[Dry Run] Would execute seed.sql (${fs.existsSync(seedPath) ? 'found' : 'MISSING'})`);
    if (flags.scenario) {
      const scenarioFile = path.join(rootDir, 'client-config', 'scenarios', `${flags.scenario}.md`);
      console.log(`[Dry Run] Would copy scenario ${flags.scenario}.md to client-config/CLIENT.md (${fs.existsSync(scenarioFile) ? 'found' : 'MISSING'})`);
    }
    process.exit(0);
  }

  if (!fs.existsSync(schemaPath)) {
    console.error('Error: schema.sql not found in repository root');
    process.exit(1);
  }
  if (!fs.existsSync(seedPath)) {
    console.error('Error: seed.sql not found in repository root');
    process.exit(1);
  }

  if (fs.existsSync(dbPath)) { fs.unlinkSync(dbPath); console.log('✓ Deleted fusionforge.db'); }
  if (fs.existsSync(envPath)) { fs.unlinkSync(envPath); console.log('✓ Deleted .env'); }

  const db = new Database(dbPath);
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    schemaSql.split(';').filter(s => s.trim().length > 0).forEach(s => db.exec(s.trim()));

    const seedSql = fs.readFileSync(seedPath, 'utf-8');
    seedSql.split(';').filter(s => s.trim().length > 0).forEach(s => db.exec(s.trim()));

    console.log('✓ Database reset complete');
  } catch (err) {
    console.error('Error executing SQL:', err);
    db.close();
    process.exit(1);
  }
  db.close();

  if (flags.scenario) {
    const scenarioSrc = path.join(rootDir, 'client-config', 'scenarios', `${flags.scenario}.md`);
    const scenarioDest = path.join(rootDir, 'client-config', 'CLIENT.md');
    if (!fs.existsSync(scenarioSrc)) {
      console.error(`Error: scenario file not found: ${scenarioSrc}`);
      process.exit(1);
    }
    fs.copyFileSync(scenarioSrc, scenarioDest);
    console.log(`✓ Scenario set to ${flags.scenario}`);
  }

  console.log('✓ Run node setup.js to reconfigure');
}

main().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
