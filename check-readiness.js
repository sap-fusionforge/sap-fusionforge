// SAP FusionForge | check-readiness.js | Pre-flight checks

const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');

const ENV_PATH = path.join(process.cwd(), '.env');
const DB_PATH = path.join(process.cwd(), 'fusionforge.db');

let failures = 0;

function logCheck(passed, msg, hint = '') {
  if (passed) {
    console.log(`✓ ${msg}`);
  } else {
    console.log(`✗ ${msg}`);
    if (hint) console.log(`  Hint: ${hint}`);
    failures++;
  }
}

function parseEnv(filePath) {
  const env = {};
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return env;
  }
  const lines = content.split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    env[key] = value;
  }
  return env;
}

function pingProvider(provider, apiKey) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: '', path: '', method: 'GET', headers: {} };

    if (provider === 'anthropic') {
      opts.hostname = 'api.anthropic.com';
      opts.path = '/v1/models';
      opts.headers = { 'x-api-key': apiKey };
    } else if (provider === 'openai') {
      opts.hostname = 'api.openai.com';
      opts.path = '/v1/models';
      opts.headers = { 'Authorization': `Bearer ${apiKey}` };
    } else if (provider === 'openrouter') {
      opts.hostname = 'openrouter.ai';
      opts.path = '/api/v1/models';
      opts.headers = { 'Authorization': `Bearer ${apiKey}` };
    } else {
      reject(new Error('Unknown provider'));
      return;
    }

    const req = https.request(opts, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.resume();
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

(async () => {
  try {
    // 1. Check .env and LLM_API_KEY
    const env = parseEnv(ENV_PATH);
    if (!fs.existsSync(ENV_PATH)) {
      logCheck(false, '.env file missing', 'Create a .env file in the repository root with LLM_API_KEY set.');
    } else if (!env.LLM_API_KEY || env.LLM_API_KEY.trim() === '') {
      logCheck(false, 'LLM_API_KEY missing or empty', 'Add LLM_API_KEY to your .env file.');
    } else {
      logCheck(true, '.env exists and LLM_API_KEY is set');
    }

    // 2. Ping LLM provider
    const provider = (env.PROVIDER || 'anthropic').toLowerCase();
    if (!['anthropic', 'openai', 'openrouter'].includes(provider)) {
      console.log(`ℹ Provider ping not supported for '${provider}' – verify key manually.`);
      logCheck(true, 'Provider ping skipped (unsupported provider)');
    } else {
      try {
        await pingProvider(provider, env.LLM_API_KEY);
        logCheck(true, 'LLM provider key validated');
      } catch (err) {
        logCheck(false, 'LLM provider key validation failed', 'Check that the API key is correct and the provider is reachable.');
      }
    }

    // 3-5. DB checks
    const dbExists = fs.existsSync(DB_PATH);
    if (!dbExists) {
      logCheck(false, 'fusionforge.db does not exist', 'Run node setup.js to initialize the database.');
      logCheck(false, 'Agents status check', 'DB not initialized – run node setup.js.');
      logCheck(false, 'Sprint state boot check', 'DB not initialized – run node setup.js.');
    } else {
      try {
        fs.accessSync(DB_PATH, fs.constants.W_OK);
        logCheck(true, 'fusionforge.db is writable');
      } catch (e) {
        logCheck(false, 'fusionforge.db is not writable', 'Check file permissions.');
      }

      let db;
      try {
        db = new Database(DB_PATH, { readonly: false });

        try {
          const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM agents WHERE status != ?').get('idle');
          if (cnt > 0) {
            logCheck(false, 'All agents idle', 'Some agents are not idle; reset them before running a skill.');
          } else {
            logCheck(true, 'All agents are idle');
          }
        } catch (err) {
          logCheck(false, 'Agents status check', 'DB not initialized – run node setup.js.');
        }

        try {
          const row = db.prepare("SELECT value FROM sprint_state WHERE key = 'boot_completed'").get();
          if (!row || row.value !== 'true') {
            logCheck(false, 'Sprint state boot_completed', "Set boot_completed='true' in sprint_state after running node setup.js.");
          } else {
            logCheck(true, 'Sprint state boot_completed is true');
          }
        } catch (err) {
          logCheck(false, 'Sprint state boot check', 'DB not initialized – run node setup.js.');
        }

        db.close();
      } catch (err) {
        logCheck(false, 'Database connection', 'Could not open fusionforge.db – check file integrity.');
      }
    }

    if (failures > 0) {
      console.log('\nPre-flight checks failed.');
      process.exit(1);
    } else {
      console.log('\nAll pre-flight checks passed.');
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected error during pre-flight checks:', err);
    process.exit(1);
  }
})();
