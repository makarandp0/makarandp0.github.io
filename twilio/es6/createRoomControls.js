/* eslint-disable no-console */
import { randomName, randomRoomName } from './randomName.js';
import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import { createLabeledCheckbox } from '../../jsutilmodules/createLabeledCheckbox.js';
import { createLabeledInput } from '../../jsutilmodules/createLabeledInput.js';
import { createLink } from '../../jsutilmodules/createLink.js';
import { createSelection } from '../../jsutilmodules/createSelection.js';
import { getBooleanUrlParam } from '../../jsutilmodules/getBooleanUrlParam.js';
import { log } from '../../jsutilmodules/log.js';


/**
 *
 * @param {*} container
 * @param {*} Video
 * @param {*} roomJoined - callback is called when a room is joined to.
 * @param {*} localTracks - array of local tracks.
 */
export function createRoomControls({ container, Video, roomJoined, localTracks }) {
  const roomControlsDiv = createDiv(container, 'room-controls', 'room-controls');

  const twilioVideoVersion = createElement(roomControlsDiv, { type: 'h3', id: 'twilioVideoVersion' });
  twilioVideoVersion.innerHTML = 'Twilio-Video@' + Video.version;

  const topologySelect = createSelection({
    id: 'topology',
    container: roomControlsDiv,
    options: ['group-small', 'peer-to-peer', 'group', 'go'],
    title: 'topology',
    onChange: () => log('topology change:', topologySelect.getValue())
  });

  const envSelect = createSelection({
    id: 'env',
    container: roomControlsDiv,
    options: ['dev', 'stage', 'prod'],
    title: 'env',
    onChange: () => log('env change:', envSelect.getValue())
  });

  const tokenInput = createLabeledInput({
    container: roomControlsDiv,
    labelText: createLink({ container: roomControlsDiv, linkText: 'Token or TokenUrl', linkUrl: 'https://www.twilio.com/console/video/project/testing-tools', newTab: true }),
    placeHolder: 'Enter token or token server url',
    labelClasses: ['tokenLabel'],
  });

  const localIdentity = createLabeledInput({
    container: roomControlsDiv,
    labelText: 'Identity: ',
    placeHolder: 'Enter identity or random one will be generated',
    labelClasses: ['identityLabel'],
  });

  const roomNameInput = createLabeledInput({
    container: roomControlsDiv,
    labelText: 'Room: ',
    placeHolder: 'Enter room name or random name will be generated',
    labelClasses: ['roomNameLabel'],
  });

  const extraConnectOptions = createLabeledInput({
    container: roomControlsDiv,
    labelText: 'ConnectOptions: ',
    placeHolder: 'connectOptions as json here',
    labelClasses: ['connectOptionsLabel'],
    inputClasses: ['connectOptions'],
    inputType: 'textarea'
  });

  const controlOptionsDiv = createDiv(roomControlsDiv, 'control-options', 'control-options');

  // container, labelText, id
  const autoPublish = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Publish', id: 'autoPublish' });
  const autoAttach = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Attach', id: 'autoAttach' });
  const autoJoin = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Join', id: 'autoJoin' });

  // process parameters.
  const urlParams = new URLSearchParams(window.location.search);
  roomNameInput.value = urlParams.get('room') || randomRoomName();
  localIdentity.value = urlParams.get('identity') || randomName();
  const { protocol, host, pathname } = window.location;
  console.log({ protocol, host, pathname });
  tokenInput.value = urlParams.get('token') || `${protocol}//${host}/token`; // 'http://localhost:3000/token'

  extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify({ logLevel: 'warn' });
  autoJoin.checked = urlParams.has('room') && urlParams.has('autoJoin');
  topologySelect.setValue(urlParams.get('topology') || 'group-small');
  envSelect.setValue(urlParams.get('env') || 'prod');
  autoAttach.checked = getBooleanUrlParam('autoAttach', true);
  autoPublish.checked = getBooleanUrlParam('autoPublish', true);

  /**
   * Get the Room credentials from the server.
   * @param {string} [identity] identity to use, if not specified server generates random one.
   * @returns {Promise<{identity: string, token: string}>}
   */

  async function getRoomCredentials() {
    const identity = localIdentity.value || randomName();
    let token = tokenInput.value;
    if (token.indexOf('http') >= 0) {
      let tokenUrl = token;
      const topology = topologySelect.getValue();
      const environment = envSelect.getValue();
      const roomName = roomNameInput.value;

      let url = new URL(tokenUrl);

      const tokenOptions = { environment, topology, roomName, identity };
      url.search = new URLSearchParams(tokenOptions);
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
      throw new Error(`Failed to obtain token from ${url}, Status: ${response.status}`);
    } else if (token.length === 0) {
      throw new Error('Must specify token or tokenUrl');
    }

    return { token, identity };
  }

  function joinRoom(token) {
    const roomName = roomNameInput.value;
    if (!roomName) {
      // eslint-disable-next-line no-alert
      alert('Please enter a room name.');
      return;
    }

    let additionalConnectOptions = {};
    if (extraConnectOptions.value !== '') {
      try {
        additionalConnectOptions = JSON.parse(extraConnectOptions.value);
      } catch (e) {
        console.warn('failed to parse additional connect options.', e);
        return;
      }
    }

    log(`Joining room ${roomName} ${autoPublish.checked ? 'with' : 'without'} ${localTracks.length} localTracks`);
    const connectOptions = Object.assign({
      tracks: autoPublish.checked ? localTracks : [],
      name: roomName,
      environment: envSelect.getValue()
    }, additionalConnectOptions);
    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
    log(`Joining room ${roomName} with ${JSON.stringify(connectOptions, null, 2)}`);
    Video.connect(token, connectOptions)
      .then(roomJoined)
      .catch(error => {
        log('Could not connect to Twilio: ' + error.message);
      });
  }

  const btnJoin = createButton('Join', roomControlsDiv, async () => {
    try {
      const token = (await getRoomCredentials()).token;
      return joinRoom(token);
    } catch (ex) {
      log('Failed: ', ex);
    }
  });

  if (autoJoin.checked) {
    btnJoin.click();
  }

  if (typeof Video.testPreflight === 'function') {
    let preflightTest = null;
    createButton('preparePreflight', roomControlsDiv, async () => {
      const aliceToken = (await getRoomCredentials()).token;
      const bobToken = (await getRoomCredentials()).token;
      createButton('testPreflight', roomControlsDiv, async () => {
        console.log('starting preflight');
        preflightTest = Video.testPreflight(aliceToken, bobToken, { duration: 10000 });
        const deferred = {};
        deferred.promise = new Promise((resolve, reject) => {
          deferred.resolve = resolve;
          deferred.reject = reject;
        });

        preflightTest.on('debug', (room1, room2) => {
          console.log('preflight debug:', room1, room2);
          roomJoined(room1);
          roomJoined(room2);
        });

        preflightTest.on('progress', progress => {
          console.log('preflight progress:', progress);
        });

        preflightTest.on('error', error => {
          console.error('preflight error:', error);
          deferred.reject(error);
        });

        preflightTest.on('completed', report => {
          console.log('preflight completed:', JSON.stringify(report, null, 4));
          deferred.resolve(report);
        });

        await deferred.promise;
      });
    });
  }
  return {
    shouldAutoAttach: () => autoAttach.checked,
    shouldAutoPublish: () => autoPublish.checked,
    getEnv: () => envSelect.getValue()
  };
}


