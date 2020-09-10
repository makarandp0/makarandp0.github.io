const Selenium = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const capabilities = Object.assign(
  {
    'idleTimeout': 1000,
    'maxDuration': 10800,
    'browserName': 'chrome',
    'extendedDebugging': true,
    'sauce:options': { 'maxDuration': 10800 },
    'browserVersion': 85
  },
);


const seleniumBuilder = new Selenium.Builder().withCapabilities(capabilities);
//
// replace the string with server url
const driverUrl = 'cahnge_this';
seleniumBuilder.usingServer(driverUrl);
const browserOptions = new chrome.Options();

browserOptions.addArguments('--use-fake-ui-for-media-stream');
browserOptions.addArguments('--use-fake-device-for-media-stream');
browserOptions.addArguments('--enable-gpu-rasterization');
browserOptions.addArguments('--allow-file-access');
browserOptions.addArguments('--disable-web-security');
browserOptions.addArguments('--allow-running-insecure-content');
browserOptions.addArguments('--allow-insecure-localhost');

seleniumBuilder.setChromeOptions(browserOptions);

function waitForSometime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function startSession(number) {
  return waitForSometime(number * 10000).then(() => {
    const identity = 'i_am_' + number;
    const driver = seleniumBuilder.build();
    // http://localhost:8080/?identity=master_two&room=boo&autoJoin=true
    const serverUrl = 'https://6f9af90fe7a3.ngrok.io/?' + (new URLSearchParams({
      identity,
      room: 'mak12',
      autoJoin: true,
      autoVideo: true,
      autoAudio: true,
      topology: 'group',
      autoAttach: false,
    })).toString();
    // eslint-disable-next-line no-console
    console.log('starting: ' + serverUrl);
    return driver.get(serverUrl).then(() => {
      setInterval(() => {
        driver.getCurrentUrl();
      }, 1000);
    });
  });
}

const x = Array(50).fill(0).map(Number.call, Number);
x.map(number => startSession(number));

