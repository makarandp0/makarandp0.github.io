/* eslint-disable quotes */
/* eslint-disable no-console */

const steps = "This sample helps demonstrate the pixel3  issue\r\n  \
  https://bugs.chromium.org/p/chromium/issues/detail?id=1148532\r\n \
  which results in browser freezing when a track is stopped on Pixel3 phones \r\n \
  Step  1: click on demo \r\n \
  Step  2: click on stop\r\n \
  * Notice that chrome freezes on pixel 3\r\n \
";

console.log(steps);

import createButton from '../../jsutilmodules/button.js';

function playTrack(mediaDiv, track) {
  const video = document.createElement("video");
  video.classList.add('remoteVideo');
  const stream = new MediaStream();
  stream.addTrack(track);
  video.srcObject = stream;
  video.autoplay = true;
  mediaDiv.appendChild(video);
  return video;
}

export function main(containerDiv) {
  createButton('Demo', containerDiv, async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const mediaTrack = mediaStream.getTracks()[0];
    playTrack(containerDiv, mediaTrack);
    createButton('Stop', containerDiv, () => {
      console.log('calling stop');
      mediaTrack.stop();
      console.log('done calling stop');
    });
  });
}


