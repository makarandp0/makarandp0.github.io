import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { renderTrack } from './renderTrack.js';
export function renderLocalTrack({ room, track, container, shouldAutoAttach, shouldAutoPublish, onClosed }) {
  const localTrackContainer = createDiv(container, 'localTrackContainer');
  const { stopRendering } = renderTrack({ track, container: localTrackContainer, shouldAutoAttach });

  const localTrackControls = createDiv(localTrackContainer, 'localTrackControls');
  createButton('disable', localTrackControls, () => track.disable());
  createButton('enable', localTrackControls, () => track.enable());
  createButton('stop', localTrackControls, () => track.stop());
  createButton('msstop', localTrackControls, () => {
    track.mediaStreamTrack.stop();
  });

  let trackPublication = null;
  let unPublishBtn = null;
  const publishBtn = createButton('publish', localTrackControls, async () => {
    publishBtn.disable();
    if (!trackPublication) {
      // eslint-disable-next-line require-atomic-updates
      trackPublication = await room.localParticipant.publishTrack(track);
      publishBtn.show(!trackPublication);
      unPublishBtn.show(!!trackPublication);
    }
    publishBtn.enable();
  });

  unPublishBtn = createButton('unpublish', localTrackControls, () => {
    if (trackPublication) {
      trackPublication.unpublish();
      trackPublication = null;
      publishBtn.show(!trackPublication);
      unPublishBtn.show(!!trackPublication);
    }
  });

  const updateRoom = newRoom => {
    if (newRoom) {
      trackPublication = [...newRoom.localParticipant.tracks.values()].find(trackPub => trackPub.track === track);
    }
    publishBtn.show(newRoom && !trackPublication);
    unPublishBtn.show(newRoom && !!trackPublication);
    room = newRoom;
  };

  // if autoPublish and room exits, publish the track
  if (room && shouldAutoPublish) {
    publishBtn.click();
  }

  const closeBtn = createButton('close', localTrackControls, () => {
    unPublishBtn.click();
    track.stop();
    localTrackContainer.remove();
    stopRendering();
    onClosed();
  });

  return {
    closeBtn,
    unPublishBtn,
    publishBtn,
    updateRoom,
  };
}
