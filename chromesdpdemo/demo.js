/* eslint-disable sort-imports */
/* eslint-disable no-undefined */
/* eslint-disable no-console */

import createButton from '../jsutilmodules/button.js';
import generateAudioTrack from '../jsutilmodules/syntheticaudio.js';
import generateVideoTrack from '../jsutilmodules/syntheticvideo.js';

const demoDiv = document.getElementById('demo');
const sdpView = document.getElementById('sdp');


let pc = null;
export function demo() {

  createButton('Step 1: Create PeerConnection', demoDiv,  () => {
    pc = new RTCPeerConnection({ 'iceServers': [], 'sdpSemantics': 'unified-plan' });
  });

  createButton('Add Audio', demoDiv,  () => {
    const syntheticTrack = generateAudioTrack();
    pc.addTrack(syntheticTrack);
  });


  createButton('Add Video', demoDiv,  () => {
    const canvas = document.createElement('canvas');
    const syntheticTrack = generateVideoTrack(canvas, 'Yo');
    pc.addTrack(syntheticTrack);
  });

  createButton('Step 4. Create Offer', demoDiv, async () => {
    const offer = await pc.createOffer();
    const sdp = offer.sdp;
    console.log(sdp);
    sdpView.value = sdp;
  });

  createButton('clear sdp', demoDiv, () => {
    sdpView.value = '';
  });

}

