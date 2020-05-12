/* eslint-disable no-undefined */
/* eslint-disable no-console */

import { Waveform } from './waveform.js';
const logDiv = document.getElementById('log');
const demoDiv = document.getElementById('demo');

function routeTrack(localTrack) {
  const localPC = new RTCPeerConnection();
  const remotePC = new RTCPeerConnection();
  remotePC.onicecandidate = event => event.candidate && localPC.addIceCandidate(event.candidate);
  localPC.onicecandidate = event => event.candidate && remotePC.addIceCandidate(event.candidate);

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async resolve => {
    // this.addTransceiver('video', { direction: 'recvonly' })
    localPC.addTrack(localTrack);
    remotePC.ontrack = event => {
      console.log('got remote track:', event.track);
      resolve({
        remoteTrack: event.track,
        localPC,
        remotePC
      });
    };

    localPC.addTransceiver('audio', { direction: 'recvonly' });
    localPC.addTransceiver('video', { direction: 'recvonly' });
    const offer = await localPC.createOffer();
    localPC.setLocalDescription(offer);
    remotePC.setRemoteDescription(offer);
    const answer = await remotePC.createAnswer();
    remotePC.setLocalDescription(answer);
    localPC.setRemoteDescription(answer);
  });
}

async function getMediaStreamTrack(useOscillator, frequency) {
  let mediaStream;
  if (useOscillator) {
    mediaStream = getOscillatorStream(frequency);
  } else {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  const track = mediaStream.getAudioTracks()[0];
  console.log('Track Id: ', track.id);
  return track;
}

function getOscillatorStream(frequency = 100) {
  console.log('1. Construct AudioContext');
  window.myAudioContext = window.myAudioContext || typeof AudioContext !== 'undefined' ? new AudioContext() : new webkitAudioContext();
  const audioContext = window.myAudioContext;
  if (audioContext === null) {
    console.error('audioContext is null');
    return;
  }

  console.log('2. Create OscillatorNode');
  const oscillatorNode = audioContext.createOscillator();

  oscillatorNode.type = 'square';
  oscillatorNode.frequency.setValueAtTime(frequency, audioContext.currentTime); // value in hertz

  console.log('3. Create MediaStreamDestinationNode');
  const mediaStreamDestinationNode = audioContext.createMediaStreamDestination();

  console.log('4. Connect OscillatorNode to MediaStreamDestinationNode');
  oscillatorNode.connect(mediaStreamDestinationNode);

  console.log('5. Start OscillatorNode');
  oscillatorNode.start();

  console.log('6. Add MediaStreamDestinationNode\'s MediaStreamTrack to new MediaStream');
  // eslint-disable-next-line consistent-return
  return mediaStreamDestinationNode.stream;
}

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


function createButton(text, container, onClick) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.onclick = onClick;
  container.appendChild(btn);
  return {
    btn,
    show: visible => { btn.style.display = visible ? 'inline-block' : 'none'; },
    text: newText => { btn.innerHTML = newText; },
    click: () => onClick()
  };
}

function playAudioTrack(track) {
  const stream = new MediaStream();
  stream.addTrack(track);

  var newDiv = document.createElement('div');
  const audio = document.createElement('audio');
  audio.autoplay = true;
  audio.controls = true;
  audio.srcObject = stream;
  newDiv.appendChild(audio);
  demoDiv.appendChild(newDiv);
  createButton('close', newDiv, () => {
    audio.srcObject = null;
    console.log('10. Remove <audio> element');
    audio.remove();
    newDiv.remove();
    console.log('Check to see if the audio is still playing...');
  });
}

// styleMap uses the values to decide the style.
function createLabeledStat(container, label, { id, className, useValueToStyle = false }) {
  const el = createElement(container, { type: 'p', id, classNames: [className, 'labeledStat'] });
  let lastText = null;
  return {
    setText: text => {
      if (useValueToStyle && lastText !== null) {
        el.classList.remove(`${className}_${lastText}`);
      }
      el.textContent = label + ': ' + text;
      if (useValueToStyle) {
        el.classList.add(`${className}_${text}`);
        lastText = text;
      }
    }
  };
}

function renderAudioTrack(track) {
  const stream = new MediaStream();
  stream.addTrack(track);

  var container = document.createElement('div');
  const audioElement = document.createElement('audio');
  audioElement.srcObject = stream;

  container.appendChild(audioElement);

  const waveform = new Waveform();
  waveform.setStream(audioElement.srcObject);
  const canvasContainer = document.createElement('div');
  canvasContainer.classList.add('canvasContainer');
  container.appendChild(canvasContainer);

  canvasContainer.appendChild(waveform.element);
  createButton('close', container, () => {
    container.remove();
  });

  createButton('update', container, () => {
    updateStats();
  });

  var statsContainer = createDiv(container, 'trackStats');
  const readyState = createLabeledStat(statsContainer, 'readyState', { className: 'readyState', useValueToStyle: true });
  const enabled = createLabeledStat(statsContainer, 'enabled', { className: 'enabled', useValueToStyle: true });
  const muted = createLabeledStat(statsContainer, 'muted', { className: 'muted', useValueToStyle: true });

  track.addEventListener('ended', () => updateStats('ended'));
  track.addEventListener('mute', () => updateStats('mute'));
  track.addEventListener('unmute', () => updateStats('unmute'));

  function updateStats(event) {
    log(`${track.sid || track.id} got: ${event}`);
    readyState.setText(track.readyState);
    enabled.setText(track.enabled);
    muted.setText(track.muted);
  }
  updateStats();
  demoDiv.appendChild(container);
  return audioElement;
}


let logClearBtn;
let realLogDiv;
function log(message) {
  if (!logClearBtn) {
    logClearBtn = createButton('clear', logDiv, () => {
      realLogDiv.innerHTML = '';
    });
    realLogDiv = createDiv(logDiv);
  }

  message = (new Date()).toISOString() + ':' + message;
  console.log(message);
  realLogDiv.innerHTML += '<p>&gt;&nbsp;' + message  + '</p>';
  realLogDiv.scrollTop = realLogDiv.scrollHeight;
}

function listenForVisibilityChange() {
  // Set the name of the hidden property and the change event for visibility
  let hidden;
  let visibilityChange;
  if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
  }

  log(`Will use: ${hidden}, ${visibilityChange}`);
  function handleVisibilityChange() {
    if (document[hidden]) {
      log('document was hidden');
    } else {
      log('document was visible');
    }
  }
  // Warn if the browser doesn't support addEventListener or the Page Visibility API
  if (typeof document.addEventListener === 'undefined' || hidden === undefined) {
    log('This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.');
  } else {
    // Handle page visibility change
    document.addEventListener(visibilityChange, handleVisibilityChange, false);
  }
}


let localAudioTrack;
let remoteStreamDetails;
export function demo() {
  console.log('version 2');
  createButton('GetLocalAudio', demoDiv, async () => {
    localAudioTrack = await getMediaStreamTrack(false, 10);
  });

  createButton('PlayLocalTrack', demoDiv, () => {
    playAudioTrack(localAudioTrack);
  });

  createButton('RenderLocalTrack', demoDiv, () => {
    renderAudioTrack(localAudioTrack);
  });

  createButton('GetRemoteAudio', demoDiv, async () => {
    remoteStreamDetails = await routeTrack(localAudioTrack);
  });

  createButton('PlayRemoteTrack', demoDiv, () => {
    const remoteAudioTrack = remoteStreamDetails.remoteTrack;
    playAudioTrack(remoteAudioTrack);
  });

  createButton('RenderRemoteTrack', demoDiv, () => {
    const remoteAudioTrack = remoteStreamDetails.remoteTrack;
    renderAudioTrack(remoteAudioTrack);
  });

  createButton('ClosePCs', demoDiv, () => {
    remoteStreamDetails.localPC.close();
    remoteStreamDetails.remotePC.close();
  });
  log('done creating buttons');
  listenForVisibilityChange();
}

