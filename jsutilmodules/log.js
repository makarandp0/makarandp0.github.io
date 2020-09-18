/* eslint-disable no-console */
import createButton from './button.js';

let logClearBtn;
let realLogDiv;
export function createLog(logDiv) {
  if (!logClearBtn) {
    if (!logDiv) {
      logDiv = document.createElement('div');
      document.body.appendChild(logDiv);
    }
    logClearBtn = createButton('clear log', logDiv, () => {
      realLogDiv.innerHTML = '';
    });

    realLogDiv = document.createElement('div');
    logDiv.appendChild(realLogDiv);
  }
}

export function log(...args) {
  createLog();
  const message = args.map(arg => String(arg)).join(', ');
  realLogDiv.innerHTML += '<p>' + message  + '</p>';
  realLogDiv.scrollTop = realLogDiv.scrollHeight;
  console.log(...args);
}
