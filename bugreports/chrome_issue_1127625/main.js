/* eslint-disable quotes */
/* eslint-disable no-console */

const steps = "This sample helps demonstrate the chrome 86+ issue\r\n  \
  https://bugs.chromium.org/p/chromium/issues/detail?id=1127625\r\n \
  which results in SLD failing with \r\n \
  Failed to execute 'setLocalDescription' on 'RTCPeerConnection': Failed to set local offer sdp: Unknown transceiver\r\n \
  Step  1: Alice Add Track\r\n \
  Step  2: Alice Create Offer\r\n \
  Step  3: Update Alice's offer video m-line - change port to 0\r\n \
  Step  4: Alice SetLocalDescription\r\n \
  Step  5: Bob SetRemoteDescription\r\n \
  Step  6: Bob CreateAnswer\r\n \
  Step  7: Bob SetLocalDescription\r\n \
  Step  8: Alice SetRemoteDescription\r\n \
  Step  9: Bob CreateOffer\r\n \
  Step 10: Bob SetLocalDescription\r\n \
  * Notice that step 10 fails on Chrome 86+\r\n \
  * Notice that same steps do not fail on Chrome 85\r\n \
";

console.log(steps);

import createButton from '../../jsutilmodules/button.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import { createLabeledCheckbox } from '../../jsutilmodules/createLabeledCheckbox.js';
import createLabeledStat from '../../jsutilmodules/labeledstat.js';
import { syntheticVideo }  from '../../jsutilmodules/syntheticvideo2.js';

function managePC({ parentDiv, myName }) {
  const thisPC = new RTCPeerConnection({ "iceServers": [], "sdpSemantics": "unified-plan" });
  window.testPCs[myName] = thisPC;
  const myDiv = createElement(parentDiv, { type: 'div', classNames: ['pc'] });
  const header = createElement(myDiv, { type: 'h2' });
  header.innerHTML = myName;
  const controlDiv = createElement(myDiv, { type: 'div', classNames: ['controls'] });
  const sdpDiv = createElement(myDiv, { type: 'div', classNames: ['sdpDiv'] });
  const signalingState = createLabeledStat(sdpDiv, 'SignalingState:', { className: 'signalingState', useValueToStyle: false });

  signalingState.setText(thisPC.signalingState);
  thisPC.addEventListener('signalingstatechange', () => {
    console.log(`${myName}: onsignalingstatechange`, thisPC.signalingState);
    signalingState.setText(thisPC.signalingState);
  });

  const connectionState = createLabeledStat(sdpDiv, 'ConnectionState:', { className: 'connectionState', useValueToStyle: false });
  connectionState.setText(thisPC.connectionState);
  thisPC.addEventListener('connectionstatechange', () => {
    console.log(`${myName}: connectionstatechange`, thisPC.connectionState);
    connectionState.setText(thisPC.connectionState);
  });

  const iceConnectionState = createLabeledStat(sdpDiv, 'iceState:', { className: 'iceState', useValueToStyle: false });
  iceConnectionState.setText(thisPC.iceConnectionState);
  thisPC.addEventListener('iceconnectionstatechange', () => {
    console.log(`${myName}: iceconnectionstatechange`, thisPC.iceConnectionState);
    iceConnectionState.setText(thisPC.iceConnectionState);
  });

  const sdpType = createElement(sdpDiv, { type: 'input' });
  const sdpOutput = createElement(sdpDiv, { type: 'textarea', classNames: ['sdp'] });

  function printTransceivers(message) {
    console.log(`${myName}:${message}`);
    thisPC.getTransceivers().forEach(({ mid, direction, currentDirection, stopped }) => {
      console.log({ mid, direction, currentDirection, stopped });
    });
  }

  createButton('print Transceivers', controlDiv, () => {
    printTransceivers('Current Transceivers');
  });

  const restartIce = createLabeledCheckbox({
    container: controlDiv,
    labelText: 'restartIce'
  });
  createButton('createOffer', controlDiv, async () => {
    console.log(`${myName}:createOffer: `);
    try {
      const offer = await thisPC.createOffer({
        iceRestart: restartIce.checked
      });
      sdpType.value = offer.type;
      sdpOutput.value = offer.sdp;
    } catch (e) {
      console.warn(`${myName}:createOffer failed: `, e);
    }
  });

  createButton('createAnswer', controlDiv, async () => {
    console.log(`${myName}:createAnswer`);
    try {
      const answer = await thisPC.createAnswer();
      sdpType.value = answer.type;
      sdpOutput.value = answer.sdp;
    } catch (e) {
      console.warn(`${myName}:createAnswer failed: `, e);
    }
  });

  createButton('setLocalDescription', controlDiv, async () => {
    try {
      const sdp = {
        type: sdpType.value,
        sdp: sdpOutput.value
      };
      console.log(`${myName}:setLocalDescription`);
      await thisPC.setLocalDescription(sdp);
    } catch (e) {
      console.warn(`${myName}:setLocalDescription failed`, e);
    }
  });

  createButton('rollback', controlDiv, async () => {
    try {
      const sdp = {
        type: 'rollback',
      };
      console.log(`${myName}:rollback`);
      await thisPC.setLocalDescription(sdp);
    } catch (e) {
      console.warn(`${myName}:rollback failed`, e);
    }
  });

  let track = null;
  let trackSender = null;
  const trackButton = createButton('add Track', controlDiv, async () => {

    try {
      if (!track) {
        // eslint-disable-next-line require-atomic-updates
        track  = await syntheticVideo({ width: 200, height: 200, word: myName });
        playTrack(track);
      }
      if (!trackSender) {
        console.log(`${myName}:add Track`);
        trackSender = thisPC.addTrack(track);
      } else {
        console.log(`${myName}:remove Track`);
        thisPC.removeTrack(trackSender);
        trackSender = null;
      }
    } catch (e) {
      console.warn(`${myName}:add/remove track failed`, e);
    }
    trackButton.text(trackSender ? 'remove Track' : 'add Track');
  });

  const mediaDiv = createElement(myDiv, { type: 'div', classNames: ['localVideo'] });

  function playTrack(track) {
    const video = document.createElement("video");
    video.classList.add('remoteVideo');
    const stream = new MediaStream();
    stream.addTrack(track);
    video.srcObject = stream;
    video.autoplay = true;
    mediaDiv.appendChild(video);
    return video;
  }

  thisPC.ontrack = function(event) {
    console.log(`${myName}:ontrack`, event);
    const track = event.track;
    playTrack(track);
  };

  return {
    pc: thisPC,
    sdpOutput,
    sdpType,
    myName,
    setOther: other => {
      // we can apply ice candidates only after remote description is set.
      let queuedCandidates = [];
      other.pc.onsignalingstatechange = function() {
        if (other.pc.remoteDescription !== null) {
          queuedCandidates.forEach(candidate => {
            try {
              other.pc.addIceCandidate(candidate);
            } catch (e) {
              console.warn(`${other.myName}: failed to addIceCandidate`, event.candidate);
            }
          });
          queuedCandidates = [];
        }
      };
      thisPC.onicecandidate = function(event) {
        if (event.candidate) {
          if (other.pc.remoteDescription !== null) {
            try {
              console.log(`${other.myName}: addIceCandidate`, event.candidate);
            } catch (e) {
              console.warn(`${other.myName}: failed to addIceCandidate`, event.candidate);
            }
          } else {
            console.log(`${other.myName}: queued ice candidate`);
            queuedCandidates.push(event.candidate);
          }
        }
      };
      createButton('setRemoteDescription', controlDiv, async () => {
        console.log(`${myName}: setRemoteDescription`);
        try {
          const sdp = {
            type: other.sdpType.value,
            sdp: other.sdpOutput.value
          };
          await thisPC.setRemoteDescription(sdp);
        } catch (e) {
          console.warn(`${myName}:failed to setRemoteDescription: `, e.message);
        }
      });
    }
  };
}

export function main(containerDiv) {
  const demoButton = createButton('Demo', containerDiv, () => {
    window.testPCs = {};
    const alicePCManager = managePC({ myName: 'Alice', parentDiv: containerDiv });
    const bobPCManager = managePC({ myName: 'Bob', parentDiv: containerDiv });
    alicePCManager.setOther(bobPCManager);
    bobPCManager.setOther(alicePCManager);
    demoButton.btn.remove();
  });
}


