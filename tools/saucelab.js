const Selenium = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const capabilities = Object.assign(
  {
    'idleTimeout': 1000,
    'maxDuration': 10800,
    'browserName': 'chrome',
    'extendedDebugging': true,
    'sauce:options': { 'maxDuration': 10800 },
    'browserVersion': 84
  },
);


const seleniumBuilder = new Selenium.Builder().withCapabilities(capabilities);
//
// replace the string with server url
seleniumBuilder.usingServer('replace_this_with_saucelab_server_url');
const browserOptions = new chrome.Options();

browserOptions.addArguments('--use-fake-ui-for-media-stream');
browserOptions.addArguments('--use-fake-device-for-media-stream');
browserOptions.addArguments('--enable-gpu-rasterization');
browserOptions.addArguments('--allow-file-access');
browserOptions.addArguments('--disable-web-security');
browserOptions.addArguments('--allow-running-insecure-content');
browserOptions.addArguments('--allow-insecure-localhost');

seleniumBuilder.setChromeOptions(browserOptions);
const driver = seleniumBuilder.build();

driver.get('https://makarandp0.github.io/').then(() => {
  const timerId = setInterval(() => {
    driver.getCurrentUrl();
  }, 1000);
});
