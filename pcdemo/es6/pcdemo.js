/* eslint-disable quotes */
/* eslint-disable no-console */
import createButton from '../../jsutilmodules/button.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import createLabeledStat from '../../jsutilmodules/labeledstat.js';
import generateVideoTrack  from '../../jsutilmodules/syntheticvideo.js';

function managePC({ parentDiv, myName }) {
  const thisPC = new RTCPeerConnection({ "iceServers": [], "sdpSemantics": "unified-plan" });
  const myDiv = createElement(parentDiv, { type: 'div', classNames: ['pc'] });
  const controlDiv = createElement(myDiv, { type: 'div', classNames: ['controls'] });
  const sdpDiv = createElement(myDiv, { type: 'div', classNames: ['sdpDiv'] });
  const signalingState = createLabeledStat(sdpDiv, 'SignalingState:', { className: 'signalingState', useValueToStyle: false });
  const connectionState = createLabeledStat(sdpDiv, 'ConnectionState:', { className: 'connectionState', useValueToStyle: false });
  const sdpType = createElement(sdpDiv, { type: 'input' });
  const sdpOutput = createElement(sdpDiv, { type: 'textarea', classNames: ['sdp'] });

  signalingState.setText(thisPC.signalingState);
  thisPC.addEventListener('signalingstatechange', () => {
    signalingState.setText(thisPC.signalingState);
  });

  connectionState.setText(thisPC.connectionState);
  thisPC.addEventListener('connectionstatechange', () => {
    connectionState.setText(thisPC.connectionState);
  });

  function printTransceivers(message) {
    console.log(`${myName}:${message}`, thisPC.getTransceivers());
  }

  createButton('createOffer', controlDiv, async () => {
    printTransceivers('before createOffer');
    try {
      const offer = await thisPC.createOffer({
        // offerToReceiveVideo: 1,
        // offerToReceiveAudio: 1,
        // voiceActivityDetection: true,
        // iceRestart: false
      });
      sdpType.value = offer.type;
      sdpOutput.value = offer.sdp;
    } catch (e) {
      console.log('failed to create offer: ', e.message);
    }
    printTransceivers('after createOffer');
  });

  createButton('createAnswer', controlDiv, async () => {
    printTransceivers('before createAnswer');
    try {
      const answer = await thisPC.createAnswer();
      sdpType.value = answer.type;
      sdpOutput.value = answer.sdp;
    } catch (e) {
      console.log('failed to createAnswer: ', e.message);
    }
    printTransceivers('after createAnswer');
  });

  createButton('setLocalDescription', controlDiv, async () => {
    printTransceivers('after SLD');
    try {
      const sdp = {
        type: sdpType.value,
        sdp: sdpOutput.value
      };
      await thisPC.setLocalDescription(sdp);
      console.log('set local description:', sdp.type);
    } catch (e) {
      console.log('failed to setLocalDescription: ', e.message);
    }
    printTransceivers('after SLD');
  });

  let track = null;
  let trackSender = null;
  const trackButton = createButton('add Track', controlDiv, async () => {
    printTransceivers('before AddTrack');
    try {
      if (!track) {
        // eslint-disable-next-line require-atomic-updates
        track  = await generateVideoTrack(document.createElement('canvas'), myName);
        playTrack(track);
      }
      if (!trackSender) {
        trackSender = thisPC.addTrack(track);
      } else {
        thisPC.removeTrack(trackSender);
        trackSender = null;
      }
    } catch (e) {
      console.log('add/remove failed: ', e);
    }
    printTransceivers('after AddTrack');
    trackButton.text(trackSender ? 'Remove Track' : 'Add Track');
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
    playTrack(event.track);
  };

  return {
    pc: thisPC,
    sdpOutput,
    sdpType,
    setOther: other => {
      // we can apply ice candidates only after remote description is set.
      let queuedCandidates = [];
      other.pc.onsignalingstatechange = function() {
        if (other.pc.remoteDescription !== null) {
          queuedCandidates.forEach(candidate => {
            console.log('applied ice candidate');
            other.pc.addIceCandidate(candidate);
          });
          queuedCandidates = [];
        }
      };
      thisPC.onicecandidate = function(event) {
        if (event.candidate) {
          if (other.pc.remoteDescription !== null) {
            console.log('applied ice candidate');
            other.pc.addIceCandidate(event.candidate);
          } else {
            console.log('queued ice candidate');
            queuedCandidates.push(event.candidate);
          }
        }
      };
      createButton('setRemoteDescription', controlDiv, async () => {
        printTransceivers('before SRD');
        try {
          const sdp = {
            type: other.sdpType.value,
            sdp: other.sdpOutput.value
          };
          await thisPC.setRemoteDescription(sdp);
          console.log('set remote description:', sdp.type);
        } catch (e) {
          console.log('failed to setRemoteDescription: ', e.message);
        }
        printTransceivers('after SRD');
      });
    }
  };
}

export function main(containerDiv) {
  createButton('Demo', containerDiv, () => {
    console.log('Hello!');
    var alice = new RTCPeerConnection({ "iceServers": [], "sdpSemantics": "unified-plan" });
    var bob = new RTCPeerConnection({ "iceServers": [], "sdpSemantics": "unified-plan" });
    window.testPCs = [alice, bob];
    const alicePCManager = managePC({ thisPC: alice, myName: 'Alice', parentDiv: containerDiv, otherPC: bob });
    const bobPCManager = managePC({ thisPC: bob, myName: 'Bob', parentDiv: containerDiv, otherPC: alice });
    alicePCManager.setOther(bobPCManager);
    bobPCManager.setOther(alicePCManager);
  });
}


