import { Waveform } from './waveform.js';
import createButton from './button.js';
import { createElement } from './createElement.js';
import createLabeledStat from './labeledstat.js';
import { log } from './log.js';

export function renderAudioTrack(demoDiv, track) {
  const stream = new MediaStream();
  stream.addTrack(track);

  var container = createElement(demoDiv, { type: 'div', classNames: ['audioContainer'] });
  // var container = document.createElement('div');
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
    updateStats('update');
  });

  var statsContainer = createElement(container, { type: 'div', classNames: ['trackStats'] });
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
  updateStats('update');
  return audioElement;
}
