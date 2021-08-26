/* eslint-disable no-console */
const CANVAS_HEIGHT = 250;
const CANVAS_WIDTH = 400;
const FFT_SIZE = 512;
const AudioContext = window.AudioContext || window.webkitAudioContext; // Safari and old versions of Chrome

function getAudiContext() {
  if (!AudioContext) {
    console.error('AudioContext is not supported on this platform ');
  }
  const audioContext = new AudioContext();
  if (!audioContext) {
    console.error('failed to create audioContext');
  }

  return audioContext;
}

export function renderAudioTrack(mediaStreamTrack, options) {
  /* eslint-disable no-console */
  'use strict';

  options = Object.assign({
    // Allow a custom document for testing headlessly.
    _document: typeof document !== 'undefined' && document,
    height: '250px',
    width: '400px'
  }, options);

  const canvas = options._document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.position = 'relative';

  // The height & width properties set the amount of pixels the canvas has to draw on.
  canvas.height = CANVAS_HEIGHT;
  canvas.width = CANVAS_WIDTH;

  // The height & width styles scale the canvas.
  canvas.style.height = options.height;
  canvas.style.width = options.width;

  // To manipulate the canvas, we use its context. The canvas refers to the DOM element itself,
  // while the canvas refers to the underlying implementation which can be drawn to.
  const canvasContext = canvas.getContext('2d');
  canvasContext.lineWidth = 4;
  canvasContext.strokeStyle = 'rgb(0, 0, 0)';

  // We will get the frequency data by using an AnalyserNode, a feature of the AudioContext APIs.
  const audioContext = getAudiContext();
  const analyser = audioContext.createAnalyser();

  // The FFT (fast fourier transform) takes a size parameter, which determines how many frequency
  // bins the audio is dissected into. Each frame, we will analyze the audio, and AnalyserNode
  // will update our buffer array. We can then inspect the array to see and render the specific
  // data values.
  analyser.fftSize = FFT_SIZE;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  let audioSource = null;

  let stopped = false;
  function renderFrame() {
    // Stop if we've lost our audio source.
    if (!audioSource) {
      return;
    }

    if (stopped) {
      return;
    }

    // Ask the browser to run this function again on the next animation frame. The frames
    // drawn per second here depend on browser, but generally this is 30 or 60 fps.
    requestAnimationFrame(() => {
      renderFrame();
    });

    // Get the current frequency data from the audio stream.
    analyser.getByteTimeDomainData(dataArray);

    // Reset the canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    canvasContext.beginPath();

    // Each byte of frequency will be drawn to the canvas, so each byte of frequency represents
    // a certain slice of the full width of the canvas.
    var sliceWidth = CANVAS_WIDTH / bufferLength;

    // For each byte of frequency, draw a slice to the canvas. Together, the canvas will be
    // covered by the resulting slices from left to right.
    var x = 0;
    for (var i = 0; i < bufferLength; i++) {
      var v = dataArray[i] / 128.0;
      v *= v;
      var y = v * CANVAS_HEIGHT / 2;

      if (i === 0) {
        canvasContext.moveTo(x, y);
      } else {
        canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
    }

    // End the line at the middle right, and draw the line.
    canvasContext.lineTo(canvas.width, canvas.height / 2);
    canvasContext.stroke();
  }

  audioContext.resume().then(function() {
    // Create a new audio source for the passed stream, and connect it to the analyser.
    audioSource = audioContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
    audioSource.connect(analyser);
    // Start the render loop
    renderFrame();
  });

  return {
    canvas,
    stop: () => {
      stopped = true;
    }
  };
}
