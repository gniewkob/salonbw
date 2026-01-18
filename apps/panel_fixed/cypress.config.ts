import { defineConfig } from 'cypress';
import { initPlugin } from '@suchipi/cypress-plugin-snapshots/plugin';

export default defineConfig({
    projectId: 'uzc2b3',

    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: 'cypress/support/e2e.ts',
        viewportWidth: 1280,
        viewportHeight: 720,
        retries: 1,
        setupNodeEvents(on, config) {
            initPlugin(on, config);
            return config;
        },
    },

    video: false,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    component: {
        devServer: {
            framework: 'next',
            bundler: 'webpack',
        },
    },
});
