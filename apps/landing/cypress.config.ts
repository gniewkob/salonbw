import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "uzc2b3",

  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    viewportWidth: 1280,
    viewportHeight: 720,
    retries: 1,
    // WDI screenshot QA requires a physical browser window wider than the
    // 1440px app viewport. Cypress/Electron defaults to 1280x720 headless and
    // otherwise silently crops full-page desktop screenshots to 1280px.
    // Strict opt-in: normal local/E2E Cypress runs are unchanged.
    setupNodeEvents(on) {
      if (process.env.WDI_SCREENSHOT_SCREEN_WIDTH !== '1600') return;
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1600;
          launchOptions.preferences.height = 1000;
        }
        return launchOptions;
      });
    },
  },

  video: false,
  screenshotsFolder: "cypress/screenshots",
  videosFolder: "cypress/videos",

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
