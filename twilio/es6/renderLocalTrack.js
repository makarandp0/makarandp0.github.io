import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import { renderTrack } from './renderTrack.js';

// creates buttons to publish unpublish track in a given room.
function createRoomPublishControls(container, room, track, shouldAutoPublish) {
  container = createDiv(container, 'localTrackControls');
  const roomSid = createElement(container, { type: 'h8', id: 'roomSid' });
  roomSid.innerHTML = room.localParticipant.identity;

  let unPublishBtn = null;
  let publishBtn = null;
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
    stopRendering: () => {
      container.remove();
    }
  };
}

export function renderLocalTrack({ rooms, track, container, shouldAutoAttach, shouldAutoPublish, onClosed }) {
  const localTrackContainer = createDiv(container, 'localTrackContainer');
  const { stopRendering } = renderTrack({ track, container: localTrackContainer, shouldAutoAttach });

  const localTrackControls = createDiv(localTrackContainer, 'localTrackControls');
  createButton('disable', localTrackControls, () => track.disable());
  createButton('enable', localTrackControls, () => track.enable());
  createButton('stop', localTrackControls, () => track.stop());
  createButton('msstop', localTrackControls, () => {
    track.mediaStreamTrack.stop();
  });

  const roomPublishControls = new Map();
  const roomAdded = room => {
    if (!roomPublishControls.get(room)) {
      roomPublishControls.set(room, createRoomPublishControls(localTrackContainer, room, track, shouldAutoPublish));
    }
  };

  const roomRemoved = room => {
    const roomPublishControl = roomPublishControls.get(room);
    if (roomPublishControl) {
      roomPublishControl.stopRendering();
      roomPublishControls.delete(room);
    }
  };

  rooms.forEach(room => {
    roomAdded(room);
  });

  const closeBtn = createButton('close', localTrackControls, () => {
    [...roomPublishControls.keys()].forEach(room => {
      const roomPublishControl = roomPublishControls.get(room);
      roomPublishControl.unPublishBtn.click();
      roomPublishControl.stopRendering();
      roomPublishControls.delete(room);
    });
    track.stop();
    localTrackContainer.remove();
    stopRendering();
    onClosed();
  });

  return {
    closeBtn,
    roomAdded,
    roomRemoved
  };
}
