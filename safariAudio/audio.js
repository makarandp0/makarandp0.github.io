/* eslint-disable no-undefined */
/* eslint-disable no-console */

import createButton from '../jsutilmodules/button.js';
import { createLog } from '../jsutilmodules/log.js';
import generateAudioTrack from '../jsutilmodules/syntheticaudio.js';
import { renderAudioTrack } from '../jsutilmodules/renderAudioTrack.js';

const logDiv = document.getElementById('log');
createLog(logDiv);

export const demoDiv = document.getElementById('demo');

window.delay = 4000; // modify this value. Notice that async audio works for smaller delays.
export function demo() {
  createButton('Local Audio', demoDiv, async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const track  = mediaStream.getAudioTracks()[0];
    renderAudioTrack(demoDiv, track);
  });

  createButton('Synthetic Audio', demoDiv, async () => {
    const track = await generateAudioTrack();
    renderAudioTrack(demoDiv, track);
  });

  createButton('Local Audio delayed', demoDiv, () => {
    console.log(`will delay ${window.delay} ms before acquiring audio `);
    setTimeout(async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const track  = mediaStream.getAudioTracks()[0];
      renderAudioTrack(demoDiv, track);
    }, window.delay);
  });

  createButton('Synthetic Audio delayed', demoDiv,  () => {
    console.log(`will delay ${window.delay} ms before generating audio `);
    setTimeout(async () => {
      const track  = await generateAudioTrack();
      renderAudioTrack(demoDiv, track);
    }, window.delay);
  });
}

