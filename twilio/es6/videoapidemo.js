/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';

import { createLog, log } from '../../jsutilmodules/log.js';
import { createCollapsibleDiv } from '../../jsutilmodules/createCollapsibleDiv.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createLocalTracksControls } from './createLocalTracksControls.js';
import { createRoomControls } from './createRoomControls.js';
import { renderRoom } from './renderRoom.js';

export function demo(Video, containerDiv) {
  // create html
  const mainDiv = createDiv(containerDiv, 'main', 'main');
  createLog(containerDiv);
  log("Version: ", Video.version);
  log("IsSupported: ", Video.isSupported);
  log("UserAgent: ", navigator.userAgent);

  const container = createCollapsibleDiv({ container: mainDiv, headerText: 'Local Controls', divClass: 'localControls' });

  const localTracks = [];
  const rooms = [];
  window.Twilio = { Video, rooms };
  const  { shouldAutoAttach, shouldAutoPublish, getEnv } = createRoomControls({
    container,
    Video,
    localTracks,
    roomJoined,
  });

  const { roomAdded, roomRemoved } = createLocalTracksControls({
    container,
    Video,
    localTracks,
    rooms,
    shouldAutoAttach,
    shouldAutoPublish,
  });

  // Successfully connected!
  function roomJoined(room, logger) {
    logger = logger || Video.Logger.getLogger('twilio-video');
    rooms.push(room);
    // var tag = document.createElement('script');
    // tag.src = 'http://localhost:1234/index.js';
    // window.getTwilioRoom = () => room; // Update this function to return your Twilio Room object
    // document.body.appendChild(tag);
    roomAdded(room);
    log(`Joined ${room.sid} as "${room.localParticipant.identity}"`);
    renderRoom({ room, container: mainDiv, shouldAutoAttach, env: getEnv(), logger });
    room.on('disconnected', (_, err) => {
      log(`Left ${room.sid} as "${room.localParticipant.identity}"`);
      if (err) {
        log('Error:', err);
      }
      const index = rooms.indexOf(room);
      if (index > -1) {
        rooms.splice(index, 1);
      }
      roomRemoved(room);
    });
  }
}


