/* eslint-disable no-console */
// negotiate
// 1) creates peer connections
// 2) adds local track
// 3) negotiates connection
// 4) returns remote stream.
export async function negotiate(localTrack) {
  const localPC = new RTCPeerConnection();
  const remotePC = new RTCPeerConnection();
  remotePC.onicecandidate = event => event.candidate && localPC.addIceCandidate(event.candidate);
  localPC.onicecandidate = event => event.candidate && remotePC.addIceCandidate(event.candidate);

  const result = new Promise(resolve => {
    remotePC.ontrack = event => {
      console.log('got track:', event.track);
      resolve({
        remoteTrack: event.track,
        remoteStream: new MediaStream([event.track]),
        localPC,
        remotePC
      });
    };
  });

  localPC.addTrack(localTrack);
  const offer = await localPC.createOffer();
  localPC.setLocalDescription(offer);
  remotePC.setRemoteDescription(offer);
  const answer = await remotePC.createAnswer();
  remotePC.setLocalDescription(answer);
  localPC.setRemoteDescription(answer);

  return result;
}
