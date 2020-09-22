/* eslint-disable no-console */
import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import { createLabeledCheckbox } from '../../jsutilmodules/createLabeledCheckbox.js';
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
    options: ['group-small', 'peer-to-peer', 'group'],
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

  const identityLabel = createElement(roomControlsDiv, { type: 'label', classNames: ['identityLabel'] });
  identityLabel.innerHTML = 'Identity: ';
  const localIdentity = createElement(roomControlsDiv, { type: 'input', id: 'localIdentity' });
  localIdentity.placeholder = 'Enter identity or random name will be generated';

  const roomNameLabel = createElement(roomControlsDiv, { type: 'label', classNames: ['roomNameLabel'] });
  roomNameLabel.innerHTML = 'Room: ';
  const roomNameInput = createElement(roomControlsDiv, { type: 'input', id: 'room-name' });
  roomNameInput.placeholder = 'Enter room name';

  const connectOptionsLabel = createElement(roomControlsDiv, { type: 'label', classNames: ['connectOptionsLabel'] });
  connectOptionsLabel.innerHTML = 'ConnectOptions: ';
  const extraConnectOptions = createElement(roomControlsDiv, { type: 'textarea', classNames: ['connectOptions'] });
  extraConnectOptions.placeholder = 'connectOptions as json here';


  const controlOptionsDiv = createDiv(roomControlsDiv, 'control-options', 'control-options');

  // container, labelText, id
  const autoPublish = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Publish', id: 'autoPublish' });
  const autoAttach = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Attach', id: 'autoAttach' });
  const autoJoin = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Join', id: 'autoJoin' });

  // process parameters.
  var urlParams = new URLSearchParams(window.location.search);
  roomNameInput.value = urlParams.get('room');
  localIdentity.value = urlParams.get('identity');

  // note to specify connectOptions on url you must encodeURIComponent(JSON.stringify({logLevel: 'debug'}))
  extraConnectOptions.value = urlParams.get('connectOptions') || JSON.stringify({ logLevel: 'debug' });
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
    const { protocol, host, pathname } = window.location;
    console.log({ protocol, host, pathname });
    let token = urlParams.get('token') || `${protocol}//${host}/token`;
    let tokenUrl = null;

    if (token.indexOf('http') >= 0) {
      tokenUrl = token;
      token = null;
    } else {
      // if real token is part of the url delete it.
      urlParams.delete('token');
      window.history.replaceState(null, '', window.encodeURI(`${protocol}//${host}${pathname}?${urlParams}`));
    }

    const topology = topologySelect.getValue();
    const environment = envSelect.getValue();
    const roomName = roomNameInput.value;

    let url = new URL(tokenUrl);
    const tokenOptions = { environment, topology, roomName };
    // if identity is specified use it.
    if (localIdentity.value) {
      tokenOptions.identity = localIdentity.value;
    }
    url.search = new URLSearchParams(tokenOptions);
    const response = await fetch(url); // /?tokenUrl=http://localhost:3000/token
    return response.json();
  }

  function joinRoom(token) {
    var roomName = roomNameInput.value;
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
    var connectOptions = Object.assign({
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
    const token = (await getRoomCredentials()).token;
    return joinRoom(token);
  });

  if (autoJoin.checked) {
    btnJoin.click();
  }

  // let preflightTest = null;
  // createButton('preparePreflight', roomControlsDiv, async () => {
  //   const aliceToken = (await getRoomCredentials()).token;
  //   const bobToken = (await getRoomCredentials()).token;
  //   createButton('testPreflight', roomControlsDiv, async () => {
  //     console.log('starting preflight');
  //     preflightTest = Video.testPreflight(aliceToken, bobToken, { duration: 10000 });
  //     const deferred = {};
  //     deferred.promise = new Promise((resolve, reject) => {
  //       deferred.resolve = resolve;
  //       deferred.reject = reject;
  //     });

  //     preflightTest.on('progress', progress => {
  //       console.log('preflight progress:', progress);
  //     });

  //     preflightTest.on('error', error => {
  //       console.error('preflight error:', error);
  //       deferred.reject(error);
  //     });

  //     preflightTest.on('completed', report => {
  //       console.log('preflight completed:', report);
  //       deferred.resolve(report);
  //     });

  //     await deferred.promise;
  //   });
  // });

  return {
    shouldAutoAttach: () => autoAttach.checked,
    shouldAutoPublish: () => autoPublish.checked,
  };
}
