const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // 1. TIMEOUTS: Give Cloudflare time to finish checking
  defaultCommandTimeout: 20000, 
  pageLoadTimeout: 60000,
  
  // 2. VIEWPORT: Look like a standard laptop
  viewportWidth: 1366,
  viewportHeight: 768,

  // 3. SECURITY: Allow cross-domain iframes (needed for captchas)
  chromeWebSecurity: false,

  // 4. USER AGENT: Use a standard Windows Chrome agent (safer for Headless mode)
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  e2e: {
    setupNodeEvents(on, config) {
      // 5. THE MAGIC SWITCH: Hide the "Automation" flags at the browser level
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          // Removes the "Chrome is being controlled by automated software" banner
          // and hides the `navigator.webdriver` property.
          launchOptions.args.push('--disable-blink-features=AutomationControlled');
          
          // Randomize some fingerprinting metrics
          launchOptions.args.push('--disable-infobars');
          launchOptions.args.push('--window-size=1366,768');
        }
        return launchOptions;
      });
    },
  },
});
