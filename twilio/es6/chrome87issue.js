/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';
console.log('loaded twilio/es6/chrome87issue.js');
import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import generateVideoTrack from '../../jsutilmodules/syntheticvideo.js';

let number = 0;
export function getNextNumber() {
  return number++;
}

function waitForSometime(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let logClearBtn = null;
let realLogDiv = null;
let logDiv = null;
function createLog(containerDiv) {
  logDiv = createDiv(containerDiv, 'outerLog', 'log');
}

export function log(...args) {
  if (!logClearBtn) {
    logClearBtn = createButton('clear log', logDiv, () => {
      realLogDiv.innerHTML = '';
    });
    realLogDiv = createDiv(logDiv, 'log');
  }

  console.log(args);
  const message = [...args].reduce((acc, arg) => acc + ', ' + arg, '');
  // message = (new Date()).toISOString() + ':' + message;
  realLogDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  realLogDiv.scrollTop = realLogDiv.scrollHeight;
}

export function demo(Video, containerDiv) {
  // create html
  const mainDiv = createDiv(containerDiv, 'foo', 'foo');
  createLog(containerDiv);

  const link = createElement(mainDiv, { type: 'a' });
  link.setAttribute('href', 'https://bugs.chromium.org/p/chromium/issues/detail?id=1127625#c12');
  link.innerHTML = 'Chrome bug 1127625: setLocalDescription fails with Unknown transceiver';

  const twilioVideoVersion = createElement(mainDiv, { type: 'h2', id: 'twilioVideoVersion' });
  twilioVideoVersion.innerHTML = 'Twilio-Video@' + Video.version;

  const roomSid = createElement(mainDiv, { type: 'h3', id: 'roomSid' });

  const roomNameInput = createElement(mainDiv, { type: 'input', id: 'room-name' });
  roomNameInput.placeholder = 'Enter room name';

  // process parameters.
  var urlParams = new URLSearchParams(window.location.search);
  roomNameInput.value = urlParams.get('room');

  const { protocol, host } = window.location;
  let tokenUrl = `${protocol}//${host}/token`;

  createButton('repro', mainDiv, async () => {
    const aliceToken = (await getRoomCredentials(tokenUrl)).token;
    const bobToken = (await getRoomCredentials(tokenUrl)).token;
    const roomName = roomNameInput.value;
    const connectOptions = {
      name: roomName,
      logLevel: 'warn',
      environment: 'prod'
    };

    // publish track simultaneously in both rooms.
    const aliceTrack = await generateVideoTrack(document.createElement('canvas'), 'Alice-' + getNextNumber());
    const aliceLocalTrack = new Video.LocalVideoTrack(aliceTrack, { logLevel: 'warn', name: aliceTrack });
    const aliceRoom = await Video.connect(aliceToken, { ...connectOptions, tracks: [aliceLocalTrack] });
    roomSid.innerHTML = aliceRoom.sid;
    console.log('Alice joined the room with video track');

    const bobTrack = await generateVideoTrack(document.createElement('canvas'), 'Bob-' + getNextNumber());
    const bobLocalTrack = new Video.LocalVideoTrack(bobTrack, { logLevel: 'warn', name: aliceTrack });
    const bobRoom = await Video.connect(bobToken, { ...connectOptions, tracks: [bobLocalTrack] });
    console.log('Bob joined the room with video track');


    await waitForSometime(2000);


    let alicePub = [...aliceRoom.localParticipant.tracks.values()][0] || null;
    let bobPub = [...bobRoom.localParticipant.tracks.values()][0] || null;

    alicePub.unpublish();
    bobPub.unpublish();
    await waitForSometime(2000);
    console.warn('makarand: un-publish done');
    aliceRoom.disconnect();
    bobRoom.disconnect();
  });

  /**
   * Get the Room credentials from the server.
   * @param {string} [identity] identity to use, if not specified server generates random one.
   * @returns {Promise<{identity: string, token: string}>}
   */
  async function getRoomCredentials(tokenUrl) {
    const topology = 'group-small';
    const environment = 'prod';
    const roomName = roomNameInput.value;
    let url = new URL(tokenUrl);
    const tokenOptions = { environment, topology, roomName };
    url.search = new URLSearchParams(tokenOptions);
    const response = await fetch(url); // /?tokenUrl=http://localhost:3000/token
    return response.json();
  }
}
