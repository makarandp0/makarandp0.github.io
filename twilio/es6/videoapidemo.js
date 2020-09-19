/* eslint-disable no-undefined */
/* eslint-disable require-atomic-updates */
/* eslint-disable no-console */
/* eslint-disable quotes */
'use strict';

import { createLog, log } from '../../jsutilmodules/log.js';
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

  const localControls = createDiv(mainDiv, 'localControls', 'localControls');

  const localTracks = [];
  var { autoAttach, autoPublish } = createRoomControls(localControls, Video, roomJoined, localTracks);
  createLocalTracksControls({
    container: localControls,
    Video,
    localTracks,
    roomChangeMonitor,
    shouldAutoAttach: () => autoAttach.checked,
    shouldAutoPublish: () => autoPublish.checked,
  });

  (function main() {
    roomChangeMonitor.emitRoomChange(null);
  }());

  // Successfully connected!
  function roomJoined(room) {
    roomChangeMonitor.emitRoomChange(room);

    log("Joined as '" + activeRoom.localParticipant.identity + "'");
    renderRoom(room, mainDiv, () => autoAttach.checked);
    room.on('disconnected', (_, err) => {
      log('Left:', err);
      roomChangeMonitor.emitRoomChange(null);
      activeRoom = null;
    });
  }
}


