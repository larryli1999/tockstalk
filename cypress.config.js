const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // TIMEOUTS: Increase drastically to allow manual Cloudflare checks to pass
  defaultCommandTimeout: 30000, 
  pageLoadTimeout: 60000,
  
  viewportWidth: 1280,
  viewportHeight: 720,
  
  chromeWebSecurity: false, // Critical for cross-site iframes

  // FAKE USER AGENT: This is a Windows 10 Chrome string
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          // 1. DISABLE AUTOMATION FLAGS
          launchOptions.args.push('--disable-blink-features=AutomationControlled');
          
          // 2. FAKE WINDOW ARGUMENTS (Makes it look like a real app)
          launchOptions.args.push('--start-maximized');
          launchOptions.args.push('--disable-infobars');
          
          // 3. MASK THE BOT
          // This forces the browser to disable the "selenium" flag used for detection
          launchOptions.args.push('--disable-dev-shm-usage'); 
          launchOptions.args.push('--no-sandbox'); 
        }
        return launchOptions;
      });
    },
  },
});
