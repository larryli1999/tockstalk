const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // TIMEOUTS: Very long timeouts to allow Cloudflare to resolve itself
  defaultCommandTimeout: 40000, 
  pageLoadTimeout: 60000,
  
  viewportWidth: 1280,
  viewportHeight: 720,
  
  chromeWebSecurity: false,

  // STEALTH: Fake User Agent (Windows 10 Chrome)
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  e2e: {
    // CRITICAL: Allows Cypress to click inside Cloudflare's hidden Shadow DOM
    includeShadowDom: true, 

    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          // Nuclear Stealth Args
          launchOptions.args.push('--disable-blink-features=AutomationControlled');
          launchOptions.args.push('--disable-infobars');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        return launchOptions;
      });
    },
  },
});
