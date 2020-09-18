/* eslint-disable no-undef */
export default function generateAudioTrack() {
  // NOTE(mpatwardhan): We have to delay require-ing AudioContextFactory, because
  // it exports a default instance whose constructor calls Object.assign.
  const audioContext = typeof AudioContext !== 'undefined'
    ? new AudioContext()
    // eslint-disable-next-line new-cap
    : new webkitAudioContext();
  const oscillator = audioContext.createOscillator();
  const dst = oscillator.connect(audioContext.createMediaStreamDestination());
  oscillator.start();
  const track = dst.stream.getAudioTracks()[0];
  const originalStop = track.stop;
  track.stop = () => {
    originalStop.call(track);
  };
  return track;
}
