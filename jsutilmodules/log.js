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

export function log(message) {
  createLog();
  message = (new Date()).toISOString() + ':' + message;
  console.log(message);
  realLogDiv.innerHTML += '<p>&gt;&nbsp;' + message  + '</p>';
  realLogDiv.scrollTop = realLogDiv.scrollHeight;
}
