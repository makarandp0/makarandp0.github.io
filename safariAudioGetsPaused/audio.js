/* eslint-disable sort-imports */
/* eslint-disable no-undefined */
/* eslint-disable no-console */

import createButton from '../jsutilmodules/button.js';
import createLabeledStat from '../jsutilmodules/labeledstat.js';
import { createLog, log } from '../jsutilmodules/log.js';
import negotiate from '../jsutilmodules/negotiate.js';

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


function renderTrack(track) {
  const stream = new MediaStream();
  stream.addTrack(track);

  var container = createDiv(demoDiv, track.kind === 'video' ? 'videoContainer' : 'audioContainer');
  const mediaElement = document.createElement(track.kind === 'video' ? 'video' : 'audio');
  mediaElement.autoplay = true;
  mediaElement.controls = true;
  mediaElement.srcObject = stream;
  container.appendChild(mediaElement);

  const readyState = createLabeledStat(container, 'readyState', { className: 'readyState', useValueToStyle: true });
  const enabled = createLabeledStat(container, 'enabled', { className: 'enabled', useValueToStyle: true });
  const muted = createLabeledStat(container, 'muted', { className: 'muted', useValueToStyle: true });
  const paused = createLabeledStat(container, 'paused', { className: 'paused', useValueToStyle: true });

  track.addEventListener('ended', () => updateStats('ended'));
  track.addEventListener('mute', () => updateStats('mute'));
  track.addEventListener('unmute', () => updateStats('unmute'));
  mediaElement.addEventListener('pause', () => updateStats('pause'));
  mediaElement.addEventListener('play', () => updateStats('play'));

  function updateStats(event) {
    log(`${track.sid || track.id} got: ${event}`);
    readyState.setText(track.readyState);
    enabled.setText(track.enabled);
    muted.setText(track.muted);
    paused.setText(mediaElement.paused);
  }

  createButton('close', container, () => {
    mediaElement.srcObject = null;
    mediaElement.remove();
    container.remove();
  });
  createButton('update', container, () => {
    updateStats('update');
  });
  createButton('pause', container, () => {
    mediaElement.pause();
  });
  createButton('play', container, () => {
    mediaElement.play();
  });

  updateStats('update');
  document.addEventListener('visibilitychange', () => updateStats('visibilityChange'), false);
}


async function getAndPlayLocalAndRemoteTrack(audio) {
  const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audio, video: !audio });
  const localTrack = mediaStream.getTracks()[0];

  // playing local track
  renderTrack(localTrack);

  log('negotiating...');
  const { remoteTracks } = await negotiate([localTrack]);
  log('done negotiating...');

  // playing remote track
  renderTrack(remoteTracks[0]);
}

export function demo() {
  createButton('Audio', demoDiv, async () => {
    await getAndPlayLocalAndRemoteTrack(true);
  });

  createButton('Video', demoDiv, async () => {
    await getAndPlayLocalAndRemoteTrack(false);
  });
}

