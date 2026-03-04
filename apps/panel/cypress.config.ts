import { defineConfig } from 'cypress';

export default defineConfig({
    projectId: 'uzc2b3',

    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: 'cypress/support/e2e.ts',
        viewportWidth: 1280,
        viewportHeight: 720,
        retries: 1,
        screenshotOnRunFailure: true,
    },

    video: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    component: {
        devServer: {
            framework: 'next',
            bundler: 'webpack',
        },
    },
});
