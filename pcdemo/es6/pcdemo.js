/* eslint-disable quotes */
/* eslint-disable no-console */
import createButton from '../../jsutilmodules/button.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import generateVideoTrack  from '../../jsutilmodules/syntheticvideo.js';
function managePC({ parentDiv, myName }) {
  const thisPC = new RTCPeerConnection({ "iceServers": [], "sdpSemantics": "unified-plan" });
  const myDiv = createElement(parentDiv, { type: 'div', classNames: ['pc'] });
  const controlDiv = createElement(myDiv, { type: 'div' });
  let sdpOutput;
  createButton('createOffer', controlDiv, async () => {
    try {
      const offer = await thisPC.createOffer({
        offerToReceiveVideo: 1,
        offerToReceiveAudio: 1,
        voiceActivityDetection: true,
        iceRestart: false
      });
      sdpOutput.value = JSON.stringify(offer.toJSON());
    } catch (e) {
      console.log('failed to create offer: ', e.message);
    }
  });

  createButton('createAnswer', controlDiv, async () => {
    try {
      const answer = await thisPC.createAnswer();
      sdpOutput.value = JSON.stringify(answer.toJSON());
    } catch (e) {
      console.log('failed to createAnswer: ', e.message);
    }
  });

  createButton('setLocalDescription', controlDiv, async () => {
    try {
      const sdp = JSON.parse(sdpOutput.value);
      await thisPC.setLocalDescription(sdp);
      console.log('set local description:', sdp.type);
    } catch (e) {
      console.log('failed to setLocalDescription: ', e.message);
    }
  });

  let track = null;
  createButton('add Track', controlDiv, async () => {
    try {
      if (!track) {
        // eslint-disable-next-line require-atomic-updates
        track  = await generateVideoTrack(document.createElement('canvas'), myName);
        thisPC.addTrack(track);
        playTrack(track);
      }
    } catch (e) {
      console.log('getUserMedia failed: ', e.message);
    }
  });
  sdpOutput = createElement(myDiv, { type: 'textarea', classNames: ['sdp'] });
  const mediaDiv = createElement(myDiv, { type: 'div', classNames: ['localVideo'] });

  function playTrack(track) {
    const video = document.createElement("video");
    video.classList.add('remoteVideo');
    const stream = new MediaStream();
    stream.addTrack(track);
    video.srcObject = stream;
    video.autoplay = true;
    mediaDiv.appendChild(video);
  }

  thisPC.ontrack = function(event) {
    playTrack(event.track);
  };

  return {
    pc: thisPC,
    sdpOutput,
    setOtherPC: ({ otherPC, sdpInput }) => {
      // we can apply ice candidates only after remote description is set.
      let queuedCandidates = [];
      otherPC.onsignalingstatechange = function() {
        if (otherPC.remoteDescription !== null) {
          queuedCandidates.forEach(candidate => {
            console.log('applied ice candidate');
            otherPC.addIceCandidate(candidate);
          });
          queuedCandidates = [];
        }
      };
      thisPC.onicecandidate = function(event) {
        if (event.candidate) {
          if (otherPC.remoteDescription !== null) {
            console.log('applied ice candidate');
            otherPC.addIceCandidate(event.candidate);
          } else {
            console.log('queued ice candidate');
            queuedCandidates.push(event.candidate);
          }
        }
      };
      createButton('setRemoteDescription', controlDiv, async () => {
        try {
          const sdp = JSON.parse(sdpInput.value);
          await thisPC.setRemoteDescription(sdp);
          console.log('set remote description:', sdp.type);
        } catch (e) {
          console.log('failed to setRemoteDescription: ', e.message);
        }
      });
    }
  };
}

export function main(containerDiv) {
  createButton('Demo', containerDiv, () => {
    var alice = new RTCPeerConnection({ "iceServers": [], "sdpSemantics": "unified-plan" });
    var bob = new RTCPeerConnection({ "iceServers": [], "sdpSemantics": "unified-plan" });
    window.testPCs = [alice, bob];
    console.log('Hello!');
    const aliceDiv = createElement(containerDiv, { type: 'div' });
    const bobDiv = createElement(containerDiv, { type: 'div' });
    const alicePCManager = managePC({ thisPC: alice, myName: 'Alice', parentDiv: aliceDiv, otherPC: bob });
    const bobPCManager = managePC({ thisPC: bob, myName: 'Bob', parentDiv: bobDiv, otherPC: alice });
    alicePCManager.setOtherPC({ otherPC: bobPCManager.pc, sdpInput: bobPCManager.sdpOutput });
    bobPCManager.setOtherPC({ otherPC: alicePCManager.pc, sdpInput: alicePCManager.sdpOutput });
  });
}


