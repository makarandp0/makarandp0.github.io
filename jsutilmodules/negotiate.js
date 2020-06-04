/* eslint-disable no-console */

// negotiate
// 1) creates peer connections
// 2) adds given local tracks
// 3) negotiates connection
// 4) returns remote tracks.
// @returns Promise<{ remoteTracks, localPC, remotePC }>
export default async function negotiate(localTracks) {
  const localPC = new RTCPeerConnection();
  const remotePC = new RTCPeerConnection();

  const remoteTracks = [];
  const negotiatePromise = new Promise(resolve => {
    console.log('adding tracks');
    localTracks.forEach(track => localPC.addTrack(track));
    remotePC.ontrack = event => {
      console.log('got track:', event.track);
      remoteTracks.push(event.track);
      if (remoteTracks.length === localTracks.length) {
        resolve({
          remoteTracks,
          localPC,
          remotePC
        });
      }
    };
  });

  remotePC.onicecandidate = event => event.candidate && localPC.addIceCandidate(event.candidate);
  localPC.onicecandidate = event => event.candidate && remotePC.addIceCandidate(event.candidate);

  console.log('creating offer');
  const offer = await localPC.createOffer();
  localPC.setLocalDescription(offer);
  remotePC.setRemoteDescription(offer);

  console.log('creating answer');
  const answer = await remotePC.createAnswer();
  remotePC.setLocalDescription(answer);
  localPC.setRemoteDescription(answer);

  return negotiatePromise;
}

