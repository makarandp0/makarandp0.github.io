export default function generateAudioTrack(frequency = 1) {
  console.log('1. Construct AudioContext');
  const audioContext = typeof AudioContext !== 'undefined'
    ? new AudioContext()
    : new webkitAudioContext()

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
  const track = mediaStreamDestinationNode.stream.getAudioTracks()[0];
  console.log('Track Id: ', track.id);
  return track;
}