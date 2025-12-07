const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // 1. PRETEND TO BE A REAL USER (Mac + Chrome)
  // This is the most important line to bypass the 403 error.
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // 2. DISABLE SECURITY CHECKS
  // Allows the bot to access cross-origin iframes (often used for captchas/logins)
  chromeWebSecurity: false,

  // 3. INCREASE TIMEOUTS
  // Tock/Cloudflare often has a 5-second "checking your browser" screen. 
  // We increase the timeout so Cypress doesn't fail while waiting for this check.
  defaultCommandTimeout: 10000, // Wait up to 10 seconds for elements to appear
  pageLoadTimeout: 30000,       // Wait up to 30 seconds for the page to fully load

  // Keep your existing viewport settings
  viewportWidth: 1024,
  viewportHeight: 2048,

  e2e: {
    setupNodeEvents(on, config) {
      // You can implement node event listeners here if needed
    },
  },
});
