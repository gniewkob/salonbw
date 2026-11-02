import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'apps/landing/cypress/screenshots/wdi-creative-studio.cy.ts';
const files = readdirSync(root).filter((name) => /^creative-(fashion|cinematic|atelier)-(home|services)-(390|1440)\.png$/.test(name));
const expected = 12;
if (files.length !== expected) throw new Error(`Creative captures missing: ${files.length}/${expected}`);
for (const file of files) {
    const bytes = readFileSync(join(root, file));
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Not PNG: ' + file);
    const width = bytes.readUInt32BE(16);
    const target = Number(file.match(/-(390|1440)\.png$/)?.[1]);
    if (width !== target) throw new Error(`Wrong PNG width ${file}: ${width} expected ${target}`);
}
console.log(`WDI_CREATIVE_SCREENSHOTS=PASS (${files.length} images)`);
