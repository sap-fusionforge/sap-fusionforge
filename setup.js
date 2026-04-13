import https from 'https';
import fs from 'fs';
import { select, input, password, confirm } from '@inquirer/prompts';

// === CONFIGURATION & CONSTANTS ===

const AGENTS = [
    { key: 'SOLUTION_ARCHITECT_MODEL', name: 'Solution Architect' },
    { key: 'BUSINESS_ANALYST_MODEL', name: 'Business Analyst' },
    { key: 'DISCOVERY_ADVISOR_MODEL', name: 'Discovery Advisor' },
    { key: 'CAP_DEVELOPER_MODEL', name: 'CAP Developer' },
    { key: 'BUILD_APPS_DEVELOPER_MODEL', name: 'Build Apps Developer' },
    { key: 'BPA_DESIGNER_MODEL', name: 'BPA Designer' },
    { key: 'BTP_ADMIN_MODEL', name: 'BTP Admin' },
];

const HARDCODED_MODELS = {
    anthropic: [
        { value: 'claude-opus-4-5', name: 'claude-opus-4-5 (Opus)' },
        { value: 'claude-sonnet-4-6', name: 'claude-sonnet-4-6 (Sonnet)' },
        { value: 'claude-haiku-4-5', name: 'claude-haiku-4-5 (Haiku)' }
    ],
    openai: [
        { value: 'gpt-4o', name: 'gpt-4o' },
        { value: 'gpt-4o-mini', name: 'gpt-4o-mini' },
        { value: 'gpt-4-turbo', name: 'gpt-4-turbo' }
    ],
    azure: [
        { value: 'gpt-4o', name: 'gpt-4o' },
        { value: 'gpt-4', name: 'gpt-4' },
        { value: 'gpt-35-turbo', name: 'gpt-35-turbo' }
    ]
};

// === HELPER FUNCTIONS ===

function httpsGet(url, headers) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse JSON response'));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

function printBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║          SAP FusionForge Setup                        ║
╚═══════════════════════════════════════════════════════╝
    `);
}

// === MAIN LOGIC ===

async function main() {
    printBanner();

    // 1. Select Provider
    const provider = await select({
        message: 'Select LLM Provider:',
        choices: [
            { name: 'Anthropic', value: 'anthropic' },
            { name: 'OpenAI', value: 'openai' },
            { name: 'Azure OpenAI', value: 'azure' }
        ],
        default: 'anthropic'
    });

    // 2. Azure Endpoint (if applicable)
    let azureEndpoint = '';
    if (provider === 'azure') {
        azureEndpoint = await input({
            message: 'Enter Azure OpenAI Endpoint URL:',
            validate: (val) => val.startsWith('https://') || 'URL must start with https://'
        });
    }

    // 3. API Key
    const apiKey = await password({
        message: `Enter API Key for ${provider}:`,
        mask: '*',
        validate: (val) => val.length > 0 || 'API Key cannot be empty'
    });

    // 4. Fetch Models
    let models = [];

    try {
        console.log(`\nFetching models from ${provider}...`);

        if (provider === 'anthropic') {
            const res = await httpsGet('https://api.anthropic.com/v1/models', {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            });
            models = (res.data || [])
                .filter(m => m.id.startsWith('claude-'))
                .map(m => ({ value: m.id, name: m.display_name || m.id }));

        } else if (provider === 'openai') {
            const res = await httpsGet('https://api.openai.com/v1/models', {
                'Authorization': `Bearer ${apiKey}`
            });
            models = (res.data || [])
                .filter(m => m.id.startsWith('gpt-'))
                .sort((a, b) => b.id.localeCompare(a.id))
                .map(m => ({ value: m.id, name: m.id }));

        } else if (provider === 'azure') {
            const res = await httpsGet(
                `${azureEndpoint}/openai/deployments?api-version=2024-02-01`,
                { 'api-key': apiKey }
            );
            models = (res.value || []).map(m => ({
                value: m.id,
                name: `${m.id} (${m.model})`
            }));
        }

        if (models.length === 0) throw new Error('No models returned');
        console.log(`\u2705 Successfully fetched ${models.length} models.\n`);

    } catch (err) {
        console.warn(`\n\u26a0\ufe0f  Could not fetch models from ${provider}, using defaults.`);
        models = HARDCODED_MODELS[provider];
    }

    // 5. Assign Models to Agents
    const selectedModels = {};
    for (const agent of AGENTS) {
        selectedModels[agent.key] = await select({
            message: `Select model for ${agent.name}:`,
            choices: models,
            default: models[0].value
        });
    }

    // 6. Check for existing .env
    if (fs.existsSync('.env')) {
        const overwrite = await confirm({
            message: '.env file already exists. Overwrite?',
            default: true
        });
        if (!overwrite) {
            console.log('Setup aborted. Existing .env unchanged.');
            process.exit(0);
        }
    }

    // 7. Write .env
    const date = new Date().toISOString();
    const azureLine = provider === 'azure'
        ? `AZURE_OPENAI_ENDPOINT=${azureEndpoint}`
        : `# AZURE_OPENAI_ENDPOINT=`;

    const envLines = [
        `# SAP FusionForge | Generated by setup.js on ${date}`,
        `LLM_PROVIDER=${provider}`,
        `LLM_API_KEY=${apiKey}`,
        azureLine,
        `GITHUB_TOKEN=`,
        `DATABASE_PATH=./fusionforge.db`,
        `CLIENT_SCENARIO=hr-services`,
        ``,
        `# Agent model assignments`,
        ...AGENTS.map(a => `${a.key}=${selectedModels[a.key]}`)
    ];

    fs.writeFileSync('.env', envLines.join('\n'));

    // 8. Done
    console.log(`
\u2728 Setup complete! Configuration saved to .env

\ud83d\ude80 To verify your setup, run:
   node check-readiness.js
    `);

    process.exit(0);
}

main().catch(console.error);
