/* eslint-disable no-console */

import { Waveform } from './waveform.js';

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
  document.body.appendChild(newDiv);
  createButton('close', newDiv, () => {
    audio.srcObject = null;
    console.log('10. Remove <audio> element');
    audio.remove();
    newDiv.remove();
    console.log('Check to see if the audio is still playing...');
  });
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

  document.body.appendChild(container);
  return audioElement;
}

let localAudioTrack;
let remoteStreamDetails;
const body = document.body;
export function demo() {
  console.log('version 1');
  createButton('GetLocalAudio', body, async () => {
    localAudioTrack = await getMediaStreamTrack(false, 10);
  });

  createButton('PlayLocalTrack', body, () => {
    playAudioTrack(localAudioTrack);
  });

  createButton('RenderLocalTrack', body, () => {
    renderAudioTrack(localAudioTrack);
  });

  createButton('GetRemoteAudio', body, async () => {
    remoteStreamDetails = await routeTrack(localAudioTrack);
  });

  createButton('PlayRemoteTrack', body, () => {
    const remoteAudioTrack = remoteStreamDetails.remoteTrack;
    playAudioTrack(remoteAudioTrack);
  });

  createButton('RenderRemoteTrack', body, () => {
    const remoteAudioTrack = remoteStreamDetails.remoteTrack;
    renderAudioTrack(remoteAudioTrack);
  });

  createButton('ClosePCs', body, () => {
    remoteStreamDetails.localPC.close();
    remoteStreamDetails.remotePC.close();
  });
}

