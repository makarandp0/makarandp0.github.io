import { createDiv, createLabeledStat } from './controls';
import { log } from './videoapidemo';
export function createTrackStats(track, container) {
  var statsContainer = createDiv(container, 'trackStats');

  const readyState = createLabeledStat(statsContainer, 'readyState', {
    className: 'readyState',
    useValueToStyle: true,
  });
  const enabled = createLabeledStat(statsContainer, 'enabled', {
    className: 'enabled',
    useValueToStyle: true,
  });
  const muted = createLabeledStat(statsContainer, 'muted', {
    className: 'muted',
    useValueToStyle: true,
  });
  const started = createLabeledStat(statsContainer, 'Track.started', { className: 'started', useValueToStyle: true });
  const trackEnabled = createLabeledStat(statsContainer, 'Track.enabled', {
    className: 'enabled',
    useValueToStyle: true,
  });
  const bytes = createLabeledStat(statsContainer, 'bytes', { className: 'bytes', useValueToStyle: true });
  bytes.setText('0');

  function listenOnMSTrack(msTrack) {
    msTrack.addEventListener('ended', () => updateStats('ended'));
    msTrack.addEventListener('mute', () => updateStats('mute'));
    msTrack.addEventListener('unmute', () => updateStats('unmute'));
  }

  track.on('disabled', () => updateStats('disabled'));
  track.on('enabled', () => updateStats('enabled'));
  track.on('stopped', () => {
    updateStats('stopped');
  });

  track.on('started', () => {
    updateStats('started');
    listenOnMSTrack(track.mediaStreamTrack);
  });

  function updateStats(event, byteUpdate) {
    if (event === 'bytes') {
      bytes.setText(byteUpdate);
    } else {
      log(`${track.sid || track.id} got: ${event}`);
      readyState.setText(track.mediaStreamTrack.readyState);
      enabled.setText(track.mediaStreamTrack.enabled);
      started.setText(track.isStarted);
      muted.setText(track.mediaStreamTrack.muted);
      trackEnabled.setText(track.isEnabled);
    }
  }

  return { updateStats };
}
