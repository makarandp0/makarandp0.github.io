/* eslint-disable no-console */
import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import createLabeledStat from '../../jsutilmodules/labeledstat.js';
import { log } from '../../jsutilmodules/log.js';
import { renderTrack } from './renderTrack.js';

const publishControls = new Map(); //  Map(track => Map( room => publishControl ))
export function updateTrackStats({ room, trackId, trackSid, bytesSent, bytesReceived, trackType }) {
  const trackPublishControls = publishControls.get(trackId);
  if (trackPublishControls) {
    const publishControl = trackPublishControls.get(room);
    if (publishControl) {
      if (['localAudioTrackStats', 'localVideoTrackStats'].includes(trackType)) {
        publishControl.updateTrackStats({ room, trackId, trackSid, bytesSent, bytesReceived, trackType });
      }
    }
  }
}

// creates buttons to publish unpublish track in a given room.
function createRoomPublishControls(container, room, track, shouldAutoPublish) {
  container = createDiv(container, 'localTrackControls');
  const roomSid = createElement(container, { type: 'h8', classNames: ['roomHeader'] });

  roomSid.innerHTML = room.localParticipant.identity;

  let unPublishBtn = null;
  let publishBtn = null;
  let statBytes = null;
  let trackPublication = [...room.localParticipant.tracks.values()].find(trackPub => trackPub.track === track);
  const updateControls = () => {
    publishBtn.show(!trackPublication);
    unPublishBtn.show(!!trackPublication);
  };

  publishBtn = createButton('publish', container, async () => {
    publishBtn.disable();
    if (!trackPublication) {
      // eslint-disable-next-line require-atomic-updates
      trackPublication = await room.localParticipant.publishTrack(track);
      updateControls();
    }
    publishBtn.enable();
  });

  statBytes = createLabeledStat(container, 'bytes sent', { className: 'bytes', useValueToStyle: true });
  statBytes.setText('0');

  unPublishBtn = createButton('unpublish', container, () => {
    if (trackPublication) {
      trackPublication.unpublish();
      trackPublication = null;
      updateControls();
    }
  });
  updateControls();

  if (shouldAutoPublish) {
    publishBtn.click();
  }

  return {
    unPublishBtn,
    updateTrackStats: ({ trackSid, bytesSent }) => {
      if (trackPublication && trackPublication.trackSid === trackSid) {
        statBytes.setText(bytesSent);
      }
    },
    stopRendering: () => {
      container.remove();
    }
  };
}

export function renderLocalTrack({ rooms, track, container, shouldAutoAttach, shouldAutoPublish, onClosed, videoDevices = [] }) {
  const localTrackContainer = createDiv(container, 'localTrackContainer');
  const { stopRendering } = renderTrack({ track, container: localTrackContainer, shouldAutoAttach });

  const localTrackControls = createDiv(localTrackContainer, 'localTrackControls');
  createButton('disable', localTrackControls, () => track.disable());
  createButton('enable', localTrackControls, () => track.enable());
  createButton('stop', localTrackControls, () => {
    log('stopping track');
    track.stop();
    log('done stopping track');
  });

  createButton('restart', localTrackControls, () => {
    track.restart().catch(err => {
      console.log('track.restart failed', err);
    });
  });

  videoDevices.forEach(device => {
    createButton(`restart: ${device.label}`, localTrackControls, () => {
      const videoConstraints = {
        deviceId: { exact: device.deviceId },
      };
      console.log('calling restart with: ', videoConstraints);
      track.restart(videoConstraints).catch(err => {
        console.log('track.restart failed', err);
      });
    });
  });

  const trackPublishControls = new Map(); // room => publishControl
  publishControls.set(track.id, trackPublishControls);

  // for existing rooms, publish track if shouldAutoPublish
  rooms.forEach(room => {
    trackPublishControls.set(room, createRoomPublishControls(localTrackContainer, room, track, shouldAutoPublish));
  });

  const roomAdded = room => {
    if (!trackPublishControls.get(room)) {
      // for any rooms that are joined after track - do not auto publish,
      // as room starts of ith tracks depending on auto publish.
      trackPublishControls.set(room, createRoomPublishControls(localTrackContainer, room, track, false));
    }
  };

  const roomRemoved = room => {
    const roomPublishControl = trackPublishControls.get(room);
    if (roomPublishControl) {
      roomPublishControl.stopRendering();
      trackPublishControls.delete(room);
    }
  };

  const closeBtn = createButton('close', localTrackControls, () => {
    [...trackPublishControls.keys()].forEach(room => {
      const roomPublishControl = trackPublishControls.get(room);
      roomPublishControl.unPublishBtn.click();
      roomPublishControl.stopRendering();
      trackPublishControls.delete(room);
    });
    stopRendering();
    track.stop();
    localTrackContainer.remove();
    onClosed();
  });

  return {
    closeBtn,
    roomAdded,
    roomRemoved
  };
}
