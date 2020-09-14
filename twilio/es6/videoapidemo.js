/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';

import { createButton, createDiv, createElement, createLabeledCheckbox, createSelection } from './controls';
import { renderTrack, trackStatUpdater, updateTrackStats } from './renderTrack';
import generateAudioTrack from '../../jsutilmodules/syntheticaudio.js';
import generateVideoTrack from '../../jsutilmodules/syntheticvideo.js';

let number = 0;
export function getNextNumber() {
  return number++;
}

function getChildDiv(container, divClass) {
  return container.querySelector('.' + divClass) || createDiv(container, divClass);
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
  log("Version: ", Video.version);
  log("IsSupported: ", Video.isSupported);
  log("UserAgent: ", navigator.userAgent);

  const localControls = createDiv(mainDiv, 'localControls', 'localControls');
  const localAudioTrackContainer = createDiv(localControls, 'audioTrackContainer', 'audioTrack');
  const localVideoTrackContainer = createDiv(localControls, 'videoTrackContainer', 'videoTrack');
  const roomControlsDiv = createDiv(localControls, 'room-controls', 'room-controls');
  const twilioVideoVersion = createElement(roomControlsDiv, { type: 'h3', id: 'twilioVideoVersion' });
  const topologySelect = createSelection({
    id: 'topology',
    container: roomControlsDiv,
    options: ["group-small", "peer-to-peer", "group"],
    title: "topology",
    onChange: () => console.log('topology change:', topologySelect.getValue())
  });

  const envSelect = createSelection({
    id: 'env',
    container: roomControlsDiv,
    options: ["dev", "stage", "prod"],
    title: "env",
    onChange: () => console.log('env change:', envSelect.getValue())
  });

  const roomSid = createElement(roomControlsDiv, { type: 'h3', id: 'roomSid' });
  const localIdentity = createElement(roomControlsDiv, { type: 'input', id: 'localIdentity' });
  const roomNameInput = createElement(roomControlsDiv, { type: 'input', id: 'room-name' });
  localIdentity.placeholder = 'Enter identity or random name will be generated';
  roomNameInput.placeholder = 'Enter room name';

  const controlOptionsDiv = createDiv(roomControlsDiv, 'control-options', 'control-options');

  // container, labelText, id
  const autoPublish = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Publish', id: 'autoPublish' });
  const autoAttach = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Attach', id: 'autoAttach' });
  const autoJoin = createLabeledCheckbox({ container: controlOptionsDiv, labelText: 'Auto Join', id: 'autoJoin' });

  var activeRoom;
  const roomChangeCallbacks = [];
  class RoomChanged {
    register(callback) {
      roomChangeCallbacks.push(callback);
      callback(activeRoom);
    }

    unregister(callback) {
      var index = roomChangeCallbacks.indexOf(callback);
      if (index > -1) {
        roomChangeCallbacks.splice(index, 1);
      }
    }

    emitRoomChange(room) {
      window.room = activeRoom = room;
      roomChangeCallbacks.forEach(callback => callback(room));
    }

    get room() {
      return activeRoom;
    }
  }

  const roomChangeMonitor = new RoomChanged();
  const btnJoin = createButton('Join', roomControlsDiv, () => {
    getTokenAndJoinRoom();
  });

  const btnLeave = createButton('Leave', roomControlsDiv, () => {
    log('Leaving room...');
    activeRoom.disconnect();
    roomChangeMonitor.emitRoomChange(null);
  });

  const remoteParticipantsContainer = createDiv(mainDiv, 'remote-participants', 'remote-participants');
  twilioVideoVersion.innerHTML = 'Twilio-Video@' + Video.version;

  function getBooleanUrlParam(urlParams, paramName, defaultValue) {
    if (urlParams.has(paramName)) {
      const paramValue = urlParams.get(paramName);
      if (paramValue.length === 0) {
        return true; // &autoJoin&foo should return autoJoin = true;
      }
      if (!paramValue || paramValue.toLowerCase() === 'false') {
        return false;
      }

      return true;
    }
    return defaultValue;
  }

  // process parameters.
  var urlParams = new URLSearchParams(window.location.search);
  roomNameInput.value = urlParams.get('room');
  localIdentity.value = urlParams.get('identity');
  autoAttach.checked = getBooleanUrlParam(urlParams, 'autoAttach', true);
  autoPublish.checked = getBooleanUrlParam(urlParams, 'autoPublish', true);
  autoJoin.checked = urlParams.has('room') && urlParams.has('autoJoin');
  topologySelect.setValue(urlParams.get('topology') || "group-small");
  envSelect.setValue(urlParams.get('env') || "prod");
  const autoAudio = getBooleanUrlParam(urlParams, 'autoAudio', false);
  const autoVideo = getBooleanUrlParam(urlParams, 'autoVideo', false);

  const { protocol, host, pathname } = window.location;
  console.log({ protocol, host, pathname });

  let token = urlParams.get('token') || `${protocol}//${host}/token`;
  let tokenUrl = null;


  if (token.indexOf('http') >= 0) {
    tokenUrl = token;
    token = null;
  } else if (token === 'default') {
    tokenUrl = `${protocol}//${host}/token`;
    token = null;
  } else if (token === 'local') {
    tokenUrl = 'http://localhost:3000/token';
    token = null;
  } else {
    // if real token is part of the url delete it.
    urlParams.delete('token');
    window.history.replaceState(null, '', window.encodeURI(`${protocol}//${host}${pathname}?${urlParams}`));
  }

  createButton('testPreflight', roomControlsDiv, async () => {
    const aliceToken = (await getRoomCredentials(tokenUrl)).token;
    const bobToken = (await getRoomCredentials(tokenUrl)).token;
    const preflightTest = Video.testPreflight(aliceToken, bobToken);
    preflightTest.on('completed', report => {
      console.log(report);
    });
  });

  const btnPreviewAudio = createButton('Local Audio', localAudioTrackContainer, async () => {
    const thisTrackName = 'mic-' + getNextNumber();
    const localTrack = await Video.createLocalAudioTrack({ logLevel: 'warn', name: thisTrackName });
    await renderLocalTrack(localTrack);
  });

  const btnSyntheticAudio = createButton('Synthetic Audio', localAudioTrackContainer, async () => {
    const thisTrackName = 'Audio-' + getNextNumber();
    const msTrack = await generateAudioTrack(10);
    const localTrack = new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    renderLocalTrack(localTrack);
  });

  const btnPreviewVideo = createButton('Local Video', localVideoTrackContainer, async () => {
    const thisTrackName = 'camera-' + getNextNumber();
    const localTrack = await Video.createLocalVideoTrack({ logLevel: 'warn', name: thisTrackName });
    await renderLocalTrack(localTrack);
  });

  const btnSyntheticVideo = createButton('Synthetic Video', localVideoTrackContainer, async () => {
    const canvas = document.createElement('canvas');
    const thisTrackName = 'Video-' + getNextNumber();
    const msTrack = await generateVideoTrack(canvas, thisTrackName);
    const localTrack = new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    renderLocalTrack(localTrack);
  });

  const localTracks = [];

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
    // if identity is specified use it.
    if (localIdentity.value) {
      tokenOptions.identity = localIdentity.value;
    }
    url.search = new URLSearchParams(tokenOptions);
    const response = await fetch(url); // /?tokenUrl=http://localhost:3000/token
    return response.json();
  }


  function renderTrackPublication(trackPublication, container) {
    const trackContainerId = 'trackPublication_' + trackPublication.trackSid;
    const publicationContainer = createDiv(container, 'publication', trackContainerId);
    const trackKind = createElement(publicationContainer, { type: 'h3', classNames: ['trackName'] });
    const trackSid = createElement(publicationContainer, { type: 'h6', classNames: ['participantSid'] });
    trackKind.innerHTML = trackPublication.kind + ': published';
    trackSid.innerHTML = trackPublication.trackSid;

    if (trackPublication.isSubscribed) {
      renderTrack({
        track: trackPublication.track,
        container: publicationContainer,
        shouldAutoAttach: autoAttach.checked,
      });
    } else {
      console.log('not subscribed:', trackPublication);
    }
    trackPublication.on('subscribed', function(track) {
      log('Subscribed to ' + trackPublication.kind + ' track');
      renderTrack({
        track: track,
        container: publicationContainer,
        shouldAutoAttach: autoAttach.checked,
      });
    });
    trackPublication.on('unsubscribed', track => detachTrack(track, publicationContainer));
    return publicationContainer;
  }

  window.tracks = [];
  function renderLocalTrack(track) {
    const shouldAutoAttach = autoAttach.checked;
    const shouldAutoPublish = autoPublish.checked;
    localTracks.push(track);
    const onRenderClosed = track => {
      const index = localTracks.indexOf(track);
      if (index > -1) {
        localTracks.splice(index, 1);
      }
    };

    const container = track.kind === 'video' ? localVideoTrackContainer : localAudioTrackContainer;
    window.tracks.push(track);
    const { trackContainer } = renderTrack({ track, container, shouldAutoAttach });

    createButton('disable', trackContainer, () => track.disable());
    createButton('enable', trackContainer, () => track.enable());
    createButton('stop', trackContainer, () => track.stop());
    createButton('msstop', trackContainer, () => {
      track.mediaStreamTrack.stop();
    });

    let trackPublication = null;
    let unPublishBtn = null;
    const publishBtn = createButton('publish', trackContainer, async () => {
      trackPublication = await roomChangeMonitor.room.localParticipant.publishTrack(track);
      publishBtn.show(!trackPublication);
      unPublishBtn.show(!!trackPublication);
    });

    unPublishBtn = createButton('unpublish', trackContainer, () => {
      if (trackPublication) {
        trackPublication.unpublish();
        trackPublication = null;
        publishBtn.show(!trackPublication);
        unPublishBtn.show(!!trackPublication);
      }
    });

    const onRoomChanged = room => {
      if (room) {
        trackPublication = [...room.localParticipant.tracks.values()].find(trackPub => trackPub.track === track);
      }
      publishBtn.show(room && !trackPublication);
      unPublishBtn.show(room && !!trackPublication);
    };

    // show hide publish button on room joining/leaving.
    roomChangeMonitor.register(onRoomChanged);

    // if autoPublish and room exits, publish the track
    if (roomChangeMonitor.room && shouldAutoPublish) {
      publishBtn.click();
    }

    const closeBtn = createButton('close', trackContainer, () => {
      onRenderClosed();
      trackContainer.remove();
      roomChangeMonitor.unregister(onRoomChanged);
    });

    return {
      closeBtn,
      unPublishBtn,
      publishBtn,
    };
  }


  // Detach given track from the DOM.
  function detachTrack(track, container) {
    const trackContainer = document.getElementById(track.sid);
    track.detach().forEach(function(element) {
      element.remove();
    });
    trackStatUpdater.delete(track);
    container.removeChild(trackContainer);
  }

  // Attach array of Tracks to the DOM.
  function renderTracks(tracks, container, isLocal) {
    tracks.forEach(track => renderTrack(track, container, isLocal));
  }

  // A new RemoteTrack was published to the Room.
  function trackPublished(publication, container) {
    renderTrackPublication(publication, container);
  }

  // A RemoteTrack was unpublished from the Room.
  function trackUnpublished(publication, container) {
    const publicationDivId = 'trackPublication_' + publication.trackSid;
    const trackContainer = document.getElementById(publicationDivId);
    container.removeChild(trackContainer);
  }

  // A new RemoteParticipant joined the Room
  function participantConnected(participant, container, isLocal = false) {
    let selfContainer = createDiv(container, 'participantDiv', `participantContainer-${participant.identity}`);

    const name = createElement(selfContainer, { type: 'h2', classNames: ['participantName'] });
    name.innerHTML = participant.identity;

    const participantMediaDiv = getChildDiv(selfContainer, 'participantMediaDiv');

    if (isLocal) {
      renderTracks(getTracks(participant), participantMediaDiv, isLocal);
    } else {
      participant.tracks.forEach(publication => trackPublished(publication, participantMediaDiv));
      participant.on('trackPublished', publication => trackPublished(publication, participantMediaDiv));
      participant.on('trackUnpublished', publication => trackUnpublished(publication, participantMediaDiv));
    }
  }

  function participantDisconnected(participant) {
    const container = document.getElementById(`participantContainer-${participant.identity}`);
    var tracks = getTracks(participant);
    tracks.forEach(track => detachTrack(track, container));
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }

  // When we are about to transition away from this page, disconnect
  // from the room, if joined.
  window.addEventListener('beforeunload', leaveRoomIfJoined);

  function joinRoom(token) {
    var roomName = roomNameInput.value;
    if (!roomName) {
      // eslint-disable-next-line no-alert
      alert('Please enter a room name.');
      return;
    }

    log(`Joining room ${roomName} ${autoPublish.checked ? 'with' : 'without'} ${localTracks.length} localTracks`);
    var connectOptions = {
      tracks: autoPublish.checked ? localTracks : [],
      name: roomName,
      logLevel: 'debug',
      environment: envSelect.getValue()
    };
    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.

    Video.connect(token, connectOptions)
      .then(roomJoined)
      .catch(error => {
        log('Could not connect to Twilio: ' + error.message);
      });
  }

  function updateControls(connected) {
    roomSid.innerHTML = connected ? activeRoom.sid : 'Room: Not Joined';
    if (connected) {
      localIdentity.value = activeRoom.localParticipant.identity;
    }

    roomControlsDiv.style.display = 'block';

    [btnLeave].forEach(btn => {
      btn.show(connected);
    });

    [btnJoin].forEach(btn => {
      btn.show(!connected);
    });

    [btnPreviewAudio, btnPreviewVideo, btnSyntheticAudio, btnSyntheticVideo].forEach(btn => {
      btn.enable();
    });
  }

  async function getTokenAndJoinRoom() {
    if (!token && !tokenUrl) {
      log('token was not specified.');
    } else {
      if (tokenUrl) {
        try {
          log(`getting token from: ${tokenUrl}`);
          token = (await getRoomCredentials(tokenUrl)).token;
        } catch (err) {
          log('failed to obtain token:', err);
        }
      }
      joinRoom(token);
    }
  }

  (function main() {
    updateControls(false);
    roomChangeMonitor.emitRoomChange(null);

    if (autoAudio) {
      btnPreviewAudio.click();
    }
    if (autoVideo) {
      btnPreviewVideo.click();
    }
    if (autoJoin.checked) {
      btnJoin.click();
    }
  }());

  // Get the Participant's Tracks.
  function getTracks(participant) {
    return Array.from(participant.tracks.values())
      .filter(function(publication) {
        return publication.track;
      })
      .map(function(publication) {
        return publication.track;
      });
  }

  // Successfully connected!
  function roomJoined(room) {
    roomChangeMonitor.emitRoomChange(room);
    updateControls(true);

    log("Joined as '" + activeRoom.localParticipant.identity + "'");
    room.participants.forEach(function(participant) {
      log("Already in Room: '" + participant.identity + "'");
      participantConnected(participant, remoteParticipantsContainer);
    });

    // When a Participant joins the Room, log the event.
    room.on('participantConnected', function(participant) {
      log("Joining: '" + participant.identity + "'");
      participantConnected(participant, remoteParticipantsContainer);
    });

    // When a Participant leaves the Room, detach its Tracks.
    room.on('participantDisconnected', function(participant) {
      log("RemoteParticipant '" + participant.identity + "' left the room");
      participantDisconnected(participant);
    });

    var statUpdater = setInterval(async () => {
      const statReports = await room.getStats();
      statReports.forEach(statReport => {
        ['remoteVideoTrackStats', 'remoteAudioTrackStats', 'localAudioTrackStats', 'localVideoTrackStats'].forEach(
          trackType => {
            statReport[trackType].forEach(trackStats => updateTrackStats({ ...trackStats, trackType }));
          }
        );
      });
    }, 100);

    // Once the LocalParticipant leaves the room, detach the Tracks
    // of all Participants, including that of the LocalParticipant.
    room.on('disconnected', (_, err) => {
      log('Left:', err);
      clearInterval(statUpdater);
      room.participants.forEach(participantDisconnected);
      activeRoom = null;
      updateControls(false);
    });
  }

  // Leave Room.
  function leaveRoomIfJoined() {
    if (activeRoom) {
      activeRoom.disconnect();
    }
    roomChangeMonitor.emitRoomChange(null);
  }
}
