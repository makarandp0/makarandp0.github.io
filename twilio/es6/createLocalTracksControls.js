import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import generateAudioTrack from '../../jsutilmodules/syntheticaudio.js';
import generateVideoTrack from '../../jsutilmodules/syntheticvideo.js';
import { getBooleanUrlParam } from '../../jsutilmodules/getBooleanUrlParam.js';
import { renderLocalTrack } from './renderLocalTrack.js';

export function createLocalTracksControls({ container, rooms, Video, localTracks, shouldAutoAttach, shouldAutoPublish }) {
  let number = 0;
  const autoAudio = getBooleanUrlParam('autoAudio', false);
  const autoVideo = getBooleanUrlParam('autoVideo', false);

  const localAudioTrackContainer = createDiv(container, 'audioTrackContainer', 'audioTrack');
  const localVideoTrackContainer = createDiv(container, 'videoTrackContainer', 'videoTrack');

  const renderedTracks = new Map();
  function renderLocalTrack2(track) {
    localTracks.push(track);
    renderedTracks.set(track, renderLocalTrack({
      container: track.kind === 'video' ? localVideoTrackContainer : localAudioTrackContainer,
      rooms,
      track,
      shouldAutoAttach: shouldAutoAttach(),
      shouldAutoPublish: shouldAutoPublish(),
      onClosed: () => {
        const index = localTracks.indexOf(track);
        if (index > -1) {
          localTracks.splice(index, 1);
        }
        renderedTracks.delete(track);
      }
    }));
  }

  // eslint-disable-next-line no-unused-vars
  const btnPreviewAudio = createButton('Local Audio', localAudioTrackContainer, async () => {
    const thisTrackName = 'mic-' + number++;
    const localTrack = await Video.createLocalAudioTrack({ logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });

  // eslint-disable-next-line no-unused-vars
  const btnSyntheticAudio = createButton('Synthetic Audio', localAudioTrackContainer, async () => {
    const thisTrackName = 'Audio-' + number++;
    const msTrack = await generateAudioTrack(10);
    const localTrack = new Video.LocalAudioTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });

  // eslint-disable-next-line no-unused-vars
  const btnPreviewVideo = createButton('Local Video', localVideoTrackContainer, async () => {
    const thisTrackName = 'camera-' + number++;
    const localTrack = await Video.createLocalVideoTrack({ logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });

  // eslint-disable-next-line no-unused-vars
  const btnSyntheticVideo = createButton('Synthetic Video', localVideoTrackContainer, async () => {
    const canvas = document.createElement('canvas');
    const thisTrackName = 'Video-' + number++;
    const msTrack = await generateVideoTrack(canvas, thisTrackName);
    const localTrack = new Video.LocalVideoTrack(msTrack, { logLevel: 'warn', name: thisTrackName });
    renderLocalTrack2(localTrack);
  });

  if (autoAudio) {
    btnPreviewAudio.click();
  }
  if (autoVideo) {
    btnPreviewVideo.click();
  }

  return {
    roomAdded: room  => {
      [...renderedTracks.values()].forEach(renderedTrack => renderedTrack.roomAdded(room));
    },
    roomRemoved: room => {
      [...renderedTracks.values()].forEach(renderedTrack => renderedTrack.roomRemoved(room));
    },
  };
}
