// SAP FusionForge | scripts/validate-skill-registry.js
const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(__dirname, '..', 'SKILL_REGISTRY.json');
const SKILLS_DIR = path.join(__dirname, '..', 'skills');

let errorCount = 0;
let validatedCount = 0;

function logResult(success, message) {
    const symbol = success ? '✓' : '✗';
    console.log(`${symbol} ${message}`);
    if (!success) errorCount++;
}

function parseFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    const lines = match[1].split('\n');
    const data = {};
    lines.forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim();
            data[key] = value;
        }
    });
    return data;
}

function validate() {
    // Check 1: Registry exists
    if (!fs.existsSync(REGISTRY_PATH)) {
        logResult(false, 'SKILL_REGISTRY.json not found');
        console.log(`\n0 skills validated, ${errorCount} errors`);
        process.exit(1);
    }
    logResult(true, 'SKILL_REGISTRY.json exists');

    // Check 2: Valid JSON
    let registry;
    try {
        const fileContent = fs.readFileSync(REGISTRY_PATH, 'utf8');
        registry = JSON.parse(fileContent);
        logResult(true, 'Valid JSON parse');
    } catch (e) {
        logResult(false, 'Invalid JSON: ' + e.message);
        console.log(`\n0 skills validated, ${errorCount} errors`);
        process.exit(1);
    }

    const registrySlugs = new Set();

    // Checks 3 & 4: each registry entry
    if (Array.isArray(registry)) {
        registry.forEach(entry => {
            if (!entry.slug) {
                logResult(false, "Entry missing 'slug' field");
                return;
            }
            registrySlugs.add(entry.slug);

            const skillPath = path.join(SKILLS_DIR, entry.slug, 'SKILL.md');
            if (!fs.existsSync(skillPath)) {
                logResult(false, `File missing: ${entry.slug}/SKILL.md`);
            } else {
                logResult(true, `File exists: ${entry.slug}/SKILL.md`);
                validatedCount++;

                const fileContent = fs.readFileSync(skillPath, 'utf8');
                const frontmatter = parseFrontmatter(fileContent);
                if (!frontmatter) {
                    logResult(false, `Missing frontmatter in ${entry.slug}/SKILL.md`);
                } else {
                    const requiredFields = ['name', 'slug', 'agent', 'artifact_type'];
                    requiredFields.forEach(field => {
                        if (frontmatter[field]) {
                            logResult(true, `  Field '${field}' present in ${entry.slug}/SKILL.md`);
                        } else {
                            logResult(false, `  Missing field '${field}' in ${entry.slug}/SKILL.md`);
                        }
                    });
                }
            }
        });
    } else {
        logResult(false, 'Registry is not an array');
    }

    // Check 5: Warn on orphaned SKILL.md files (warn only, do not fail)
    if (fs.existsSync(SKILLS_DIR)) {
        const dirContents = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
        dirContents.forEach(dirent => {
            if (dirent.isDirectory() && !registrySlugs.has(dirent.name)) {
                console.log(`⚠ Orphaned skill directory: ${dirent.name} (not in registry)`);
            }
        });
    }

    console.log(`\n${validatedCount} skills validated, ${errorCount} errors`);
    process.exit(errorCount > 0 ? 1 : 0);
}

validate();
