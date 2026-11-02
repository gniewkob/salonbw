/**
 * Validate actual PNG pixel dimensions of screenshot evidence.
 *
 * Cypress cy.viewport() sets the page CSS viewport, while capture:'viewport'
 * can still be constrained by the Electron outer window. Full-page and
 * full-page screenshots must match their declared viewport width.
 * PNG header is inspected without image/third-party packages.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const screenshotRoot = new URL('../cypress/screenshots/', import.meta.url).pathname;
const required = new Map([
    ['wdi-home-full-pl-320.png', 320],
    ['wdi-home-full-pl-390.png', 390],
    ['wdi-home-full-pl-768.png', 768],
    ['wdi-home-full-pl-1440.png', 1440],
    ['wdi-home-full-en-390.png', 390],
    ['wdi-home-full-de-390.png', 390],
    ['wdi-services-full-1440.png', 1440],
    ['wdi-services-care-full-390.png', 390],
    ['wdi-services-all-full-390.png', 390],
    ['wdi-lab-editorial-390.png', 390],
    ['wdi-lab-editorial-1440.png', 1440],
    ['wdi-lab-cinematic-390.png', 390],
    ['wdi-lab-cinematic-1440.png', 1440],
    ['wdi-lab-atelier-390.png', 390],
    ['wdi-lab-atelier-1440.png', 1440],
]);

function filesIn(directory) {
    return readdirSync(directory).flatMap((item) => {
        const path = join(directory, item);
        return statSync(path).isDirectory() ? filesIn(path) : [path];
    });
}

const screenshots = filesIn(screenshotRoot);
const found = new Map(screenshots.map((path) => [path.split('/').pop(), path]));
const failures = [];
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

for (const [name, expectedWidth] of required) {
    const path = found.get(name);
    if (!path) {
        failures.push(`${name}: missing`);
        continue;
    }
    const header = readFileSync(path);
    if (header.length < 24 || !header.subarray(0, 8).equals(PNG_SIGNATURE)) {
        failures.push(`${name}: not a valid PNG header`);
        continue;
    }
    const width = header.readUInt32BE(16);
    const height = header.readUInt32BE(20);
    process.stdout.write(`WDI_SCREENSHOT ${name}: ${width}x${height} (expected width ${expectedWidth})\n`);
    if (width !== expectedWidth) {
        failures.push(`${name}: width ${width} != expected ${expectedWidth}`);
    }
}
if (failures.length) {
    for (const failure of failures) process.stderr.write(`WDI_SCREENSHOT_FAILED ${failure}\n`);
    process.exitCode = 1;
} else {
    process.stdout.write(`WDI_SCREENSHOT_DIMENSIONS=PASS (${required.size} files)\n`);
}
