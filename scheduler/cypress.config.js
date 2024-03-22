const { defineConfig } = require("cypress");

const path = require('path');

const REACT_DEVTOOLS_CHROME_EXT_PATH = "C:\\Users\\shamg\\Documents\\web\\scheduler_031224\\scheduler\\cypress\\extensions\\ReactDevTools\\5.0.2_0"

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        console.log('launching browser %o', browser)

        // only load React DevTools extension when opening Chrome in interactive mode
        if (browser.family === 'chromium') {
          // we could also restrict the extension to only load when browser.isHeaded is true
          const extensionFolder = path.resolve(REACT_DEVTOOLS_CHROME_EXT_PATH)
          console.log('adding React DevTools extension from', REACT_DEVTOOLS_CHROME_EXT_PATH);
          launchOptions.extensions.push(REACT_DEVTOOLS_CHROME_EXT_PATH);

          return launchOptions;
        }
      });
    },
    experimentalStudio: true
  },
});
