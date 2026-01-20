/* eslint-disable @typescript-eslint/no-var-requires */
const cypress = require('cypress');

async function main() {
    const specsArg = process.argv.find((a) => a.startsWith('--spec='));
    const spec = specsArg ? specsArg.replace('--spec=', '') : undefined;
    const options = {
        browser: 'chrome',
        headed: false,
        spec,
    };
    // Best effort to avoid binary verification path
    process.env.CYPRESS_VERIFY_DISABLE =
        process.env.CYPRESS_VERIFY_DISABLE || '1';

    const result = await cypress.run(options);
    if (result.totalFailed > 0 || result.failures) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
