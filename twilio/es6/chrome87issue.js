/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';
console.log('loaded twilio/es6/chrome87issue.js');
import { createButton, createDiv, createElement, createLabeledCheckbox, createSelection } from './controls';
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
  const mainDiv = createDiv(containerDiv, 'main', 'main');
  createLog(containerDiv);
  const twilioVideoVersion = createElement(mainDiv, { type: 'h3', id: 'twilioVideoVersion' });
  const topologySelect = createSelection({
    id: 'topology',
    container: mainDiv,
    options: ["group-small", "peer-to-peer", "group"],
    title: "topology",
    onChange: () => console.log('topology change:', topologySelect.getValue())
  });

  const envSelect = createSelection({
    id: 'env',
    container: mainDiv,
    options: ["dev", "stage", "prod"],
    title: "env",
    onChange: () => console.log('env change:', envSelect.getValue())
  });

  const roomSid = createElement(mainDiv, { type: 'h3', id: 'roomSid' });
  const roomNameInput = createElement(mainDiv, { type: 'input', id: 'room-name' });
  roomNameInput.placeholder = 'Enter room name';
  twilioVideoVersion.innerHTML = 'Twilio-Video@' + Video.version;

  // process parameters.
  var urlParams = new URLSearchParams(window.location.search);
  roomNameInput.value = urlParams.get('room');
  topologySelect.setValue(urlParams.get('topology') || "group-small");
  envSelect.setValue(urlParams.get('env') || "prod");

  const { protocol, host, pathname } = window.location;
  console.log({ protocol, host, pathname });
  let tokenUrl = `${protocol}//${host}/token`;
  createButton('sdpdemo', mainDiv, async () => {
    const aliceToken = (await getRoomCredentials(tokenUrl)).token;
    const bobToken = (await getRoomCredentials(tokenUrl)).token;
    const roomName = roomNameInput.value;
    const connectOptions = {
      name: roomName,
      logLevel: 'warn',
      environment: envSelect.getValue()
    };

    // publish track simultaneously in both rooms.
    const aliceTrack = await generateVideoTrack(document.createElement('canvas'), 'Alice-' + getNextNumber());
    const aliceLocalTrack = new Video.LocalVideoTrack(aliceTrack, { logLevel: 'warn', name: aliceTrack });
    const aliceRoom = await Video.connect(aliceToken, { ...connectOptions, tracks: [aliceLocalTrack] });

    const bobTrack = await generateVideoTrack(document.createElement('canvas'), 'Bob-' + getNextNumber());
    const bobLocalTrack = new Video.LocalVideoTrack(bobTrack, { logLevel: 'warn', name: aliceTrack });
    const bobRoom = await Video.connect(bobToken, { ...connectOptions, tracks: [aliceLocalTrack] });

    roomSid.innerHTML = aliceRoom.sid;

    // const aliceTrackRendered = renderLocalTrack(aliceLocalTrack);
    // const bobTrackRendered = renderLocalTrack(bobLocalTrack);
    let alicePub = [...aliceRoom.localParticipant.tracks.values()][0] || null;
    let bobPub = [...bobRoom.localParticipant.tracks.values()][0] || null;

    let tryButton = createButton('try repro', mainDiv, async () => {
      tryButton.disable();
      if (!alicePub) {
        const alicePublishes = aliceRoom.localParticipant.publishTrack(aliceLocalTrack);
        const bobPublishes = bobRoom.localParticipant.publishTrack(bobLocalTrack);
        alicePub = await alicePublishes;
        bobPub = await bobPublishes;
        console.warn('makarand: publish promise done');
      } else {
        alicePub.unpublish();
        bobPub.unpublish();
        alicePub = null;
        bobPub = null;
        await waitForSometime(2000);
        console.warn('makarand: un-publish done');
        aliceRoom.disconnect();
        bobRoom.disconnect();
      }
      // tryButton.enable();
    });
  });

  /**
   * Get the Room credentials from the server.
   * @param {string} [identity] identity to use, if not specified server generates random one.
   * @returns {Promise<{identity: string, token: string}>}
   */
  async function getRoomCredentials(tokenUrl) {
    const topology = topologySelect.getValue();
    const environment = envSelect.getValue();
    const roomName = roomNameInput.value;
    let url = new URL(tokenUrl);
    const tokenOptions = { environment, topology, roomName };
    url.search = new URLSearchParams(tokenOptions);
    const response = await fetch(url); // /?tokenUrl=http://localhost:3000/token
    return response.json();
  }


  window.tracks = [];
}
