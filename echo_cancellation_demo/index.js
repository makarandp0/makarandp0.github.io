/* eslint-disable no-console */
/* eslint-disable camelcase */
import { negotiate } from './negotiate.js';
import { renderAudioTrack } from './renderAudioTrack.js';

function log(message) {
  console.log(message);
  const p = document.createElement('p');
  p.innerText = message;
  document.body.appendChild(p);
}

function getStatValues(report, statName, kind, reportTypes) {
  let results = [];
  report.forEach(stat => {
    if (
      (reportTypes.length === 0 || reportTypes.includes(stat.type)) &&
      (kind.length === 0 || kind.includes(stat.kind)) &&
      typeof stat[statName] === 'number') {
      results.push(stat[statName]);
    }
  });
  return results;
}

async function getRemoteAudioLevel(pc) {
  const report = await pc.getStats();
  const results = getStatValues(report, 'audioLevel', 'audio', ['inbound-rtp']);
  return results[0];
}

async function getLocalAudioLevel(pc) {
  const report = await pc.getStats();
  const results = getStatValues(report, 'audioLevel', 'audio', ['media-source']);
  return results[0];
}

export function createFieldSet(container, legendText) {
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.innerHTML = legendText;
  fieldset.appendChild(legend);
  container.appendChild(fieldset);
  return fieldset;
}

export function createButton(container, text, onClick) {
  const btn = document.createElement('button');
  btn.innerHTML = text;
  btn.onclick = onClick;
  container.appendChild(btn);
}

export function createLabeledInput(container, labelText) {
  const identityLabel = document.createElement('label');
  identityLabel.innerHTML = labelText;
  container.appendChild(identityLabel);

  const inputElement = document.createElement('input');
  inputElement.disabled = true;
  container.appendChild(inputElement);
  return inputElement;
}

export function main() {
  let demoCleanup = null;
  document.getElementById('demo').onclick = async () => {
    if (demoCleanup) {
      demoCleanup();
      demoCleanup = null;
    }

    const root = document.getElementById('root');
    const remoteAudioElement = document.getElementById('remote_audio');
    const echoCancellation = document.getElementById('enableEchoCancellation').checked;

    log('Step 1: get GUM stream');
    const userMediaStream  = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation }, video: false });

    const localAudioTrack = userMediaStream.getAudioTracks()[0];
    console.log('Track Settings: ', localAudioTrack.getSettings());
    console.log('Track Capabilities: ', localAudioTrack.getCapabilities());
    const localRender = renderAudioTrack(localAudioTrack);
    localRender.canvas.style.background = 'lightgreen';

    // local audio
    const localAudioFieldSet = createFieldSet(root, 'Local Audio');
    const localAudioLevelInput = createLabeledInput(localAudioFieldSet, 'Audio Level: ');
    localAudioFieldSet.appendChild(localRender.canvas);


    log('Step 2: Negotiate and Get Remote Stream');
    const { remoteStream, remoteTrack, remotePC, localPC } = await negotiate(localAudioTrack);
    remoteAudioElement.srcObject = remoteStream;
    remoteAudioElement.onplay = () => console.log('playing');
    const remoteRender = renderAudioTrack(remoteTrack);
    remoteRender.canvas.style.background = 'lightyellow';

    // remote audio
    const remoteAudioFieldSet = createFieldSet(root, 'Remote Audio');
    const remoteAudioLevelInput = createLabeledInput(remoteAudioFieldSet, 'Audio Level: ');
    remoteAudioFieldSet.appendChild(remoteRender.canvas);

    log('Step 3: observer Remote Audio Level');
    setInterval(async () => {
      const remoteAudioLevel = await getRemoteAudioLevel(remotePC);
      const localAudioLevel =  await getLocalAudioLevel(localPC);
      localAudioLevelInput.value = localAudioLevel;
      remoteAudioLevelInput.value = remoteAudioLevel;
      console.log({ remoteAudioLevel,  localAudioLevel });
    }, 2000);
    demoCleanup = () => {
      remoteRender.stop();
      localRender.stop();
      localAudioTrack.stop();
      remoteTrack.stop();
      localAudioFieldSet.remove();
      remoteAudioFieldSet.remove();
    };
  };
}
