/* eslint-disable sort-imports */
/* eslint-disable no-undefined */
/* eslint-disable no-console */

// demonstrates https://bugs.webkit.org/show_bug.cgi?id=212780
// On IOS Mobile Safari (13.4)
// Step 1: Create audio track
// Step 2: Render local and remote (webrtc) track
// Step 3: Switch to youtube or some other app that uses audio - and play something
// Step 4: Go back to Safari, and notice that remote track stays in paused state.

import createButton from '../jsutilmodules/button.js';
import createLabeledStat from '../jsutilmodules/labeledstat.js';
import { createLog, log } from '../jsutilmodules/log.js';
import negotiate from '../jsutilmodules/negotiate.js';
import generateAudioTrack from '../jsutilmodules/syntheticaudio.js';
import generateVideoTrack from '../jsutilmodules/syntheticvideo.js';

const logDiv = document.getElementById('log');
const demoDiv = document.getElementById('demo');
createLog(logDiv);

function createElement(container, { type, id, classNames }) {
  const el = document.createElement(type);
  if (id) {
    el.id = id;
  }
  if (classNames) {
    el.classList.add(...classNames);
  }

  container.appendChild(el);
  return el;
}

function createDiv(container, divClass, id) {
  return createElement(container, { type: 'div', classNames: [divClass], id });
}


function renderTrack(track, trackName) {
  const stream = new MediaStream();
  stream.addTrack(track);

  var container = createDiv(demoDiv, track.kind === 'video' ? 'videoContainer' : 'audioContainer');
  const name = createElement(container, { type: 'h2' });
  name.innerHTML = trackName;

  const mediaElement = createElement(container, { type: track.kind === 'video' ? 'video' : 'audio' });
  mediaElement.autoplay = true;
  mediaElement.controls = true;
  mediaElement.srcObject = stream;

  const readyState = createLabeledStat(container, 'readyState', { className: 'readyState', useValueToStyle: true });
  const enabled = createLabeledStat(container, 'enabled', { className: 'enabled', useValueToStyle: true });
  const muted = createLabeledStat(container, 'muted', { className: 'muted', useValueToStyle: true });
  const paused = createLabeledStat(container, 'paused', { className: 'paused', useValueToStyle: true });

  function updateStats(event) {
    log(`${trackName} got: ${event}`);
    readyState.setText(track.readyState);
    enabled.setText(track.enabled);
    muted.setText(track.muted);
    paused.setText(mediaElement.paused);
  }

  const onVisibilityChange = () => updateStats('visibilityChange: ' + document.visibilityState);
  const onTrackEnded = () => updateStats('ended');
  const onTrackMute = () => updateStats('mute');
  const onTrackUnmute = () => updateStats('unmute');
  const onPause = () => updateStats('pause');
  const onPlay = () => updateStats('play');

  track.addEventListener('ended', onTrackEnded);
  track.addEventListener('mute', onTrackMute);
  track.addEventListener('unmute', onTrackUnmute);
  mediaElement.addEventListener('pause', onPause);
  mediaElement.addEventListener('play', onPlay);
  document.addEventListener('visibilitychange', onVisibilityChange, false);

  createButton('close', container, () => {
    mediaElement.srcObject = null;
    mediaElement.remove();
    container.remove();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    track.removeEventListener('ended', onTrackEnded);
    track.removeEventListener('mute', onTrackMute);
    track.removeEventListener('unmute', onTrackUnmute);
    mediaElement.removeEventListener('pause', onPause);
    mediaElement.removeEventListener('play', onPlay);
  });

  createButton('update', container, () => updateStats('update'));
  createButton('pause', container, () =>  mediaElement.pause());
  createButton('play', container, () => mediaElement.play());
  updateStats('update');
}

async function playLocalAndRemoteTracks(localTrack, trackType) {
  // playing local track
  renderTrack(localTrack, `${trackType}: local`);

  log('negotiating...');
  const { remoteTracks } = await negotiate([localTrack]);
  log('done negotiating...');

  // playing remote track
  renderTrack(remoteTracks[0], `${trackType}: remote`);
}

export function demo() {
  createButton('Local Audio', demoDiv, async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const localTrack = mediaStream.getTracks()[0];
    await playLocalAndRemoteTracks(localTrack, 'GUM Audio');
  });

  createButton('Synthetic Audio', demoDiv, async () => {
    const syntheticTrack = generateAudioTrack();
    await playLocalAndRemoteTracks(syntheticTrack, 'Synthetic Audio');
  });

  createButton('Local Video', demoDiv, async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    const localTrack = mediaStream.getTracks()[0];
    await playLocalAndRemoteTracks(localTrack, 'GUM Video');
  });

  createButton('Synthetic Video', demoDiv, async () => {
    const canvas = document.createElement('canvas');
    const syntheticTrack = generateVideoTrack(canvas, 'Yo');
    await playLocalAndRemoteTracks(syntheticTrack, 'Synthetic Video');
  });


}

