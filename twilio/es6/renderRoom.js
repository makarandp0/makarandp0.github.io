/* eslint-disable no-console */
import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import createLabeledStat from '../../jsutilmodules/labeledstat.js';
import { createLink } from '../../jsutilmodules/createLink.js';
import { getCreds } from './getCreds.js';
import { log } from '../../jsutilmodules/log.js';
import { renderTrack } from './renderTrack.js';
import { updateTrackStats } from './renderLocalTrack.js';

function renderTrackPublication(trackPublication, container, shouldAutoAttach) {
  const trackContainerId = 'trackPublication_' + trackPublication.trackSid;
  container = createDiv(container, 'publication', trackContainerId);
  const trackSid = createElement(container, { type: 'h6', classNames: ['participantSid'] });
  trackSid.innerHTML = `${trackPublication.kind}:${trackPublication.trackSid}`;

  let renderedTrack = null;
  let statBytes = null;
  function renderLocalTrack() {
    renderedTrack = renderTrack({
      track: trackPublication.track,
      container,
      shouldAutoAttach
    });
    const trackBytesDiv = createDiv(container, 'remoteTrackControls');
    statBytes = createLabeledStat(trackBytesDiv, 'bytes recd', { className: 'bytes', useValueToStyle: true });
    statBytes.setText('0');
  }

  if (trackPublication.isSubscribed) {
    renderLocalTrack();
  }

  trackPublication.on('subscribed', function(track) {
    log(`Subscribed to ${trackPublication.kind}:${track.name}`);
    renderLocalTrack();
  });

  trackPublication.on('unsubscribed', () => {
    renderedTrack.stopRendering();
    renderedTrack = null;
  });

  return {
    setBytesReceived: bytesReceived => {
      if (statBytes) {
        statBytes.setText(bytesReceived);
      }
    },
    trackPublication,
    container,
    stopRendering: () => {
      if (renderedTrack) {
        renderedTrack.stopRendering();
        renderedTrack = null;
      }
      container.remove();
    }
  };
}

export function renderParticipant(participant, container, shouldAutoAttach) {
  container = createDiv(container, 'participantDiv', `participantContainer-${participant.identity}`);
  const name = createElement(container, { type: 'h3', classNames: ['participantName'] });

  name.innerHTML = participant.identity;
  const participantMedia = createDiv(container, 'participantMediaDiv');
  const renderedPublications = new Map();
  participant.tracks.forEach(publication => {
    const rendered = renderTrackPublication(publication, participantMedia, shouldAutoAttach());
    renderedPublications.set(publication.trackSid, rendered);
  });

  participant.on('trackPublished', publication => {
    const rendered = renderTrackPublication(publication, participantMedia, shouldAutoAttach());
    renderedPublications.set(publication.trackSid, rendered);
  });
  participant.on('trackUnpublished', publication => {
    const rendered = renderedPublications.get(publication.trackSid);
    if (rendered) {
      rendered.stopRendering();
      renderedPublications.delete(publication.trackSid);
    }
  });
  return {
    container,
    updateStats: ({ trackSid, bytesReceived }) => {
      [...renderedPublications.keys()].forEach(thisTrackSid => {
        if (trackSid === thisTrackSid) {
          renderedPublications.get(thisTrackSid).setBytesReceived(bytesReceived);
        }
      });
    },
    stopRendering: () => {
      [...renderedPublications.keys()].forEach(trackSid => {
        renderedPublications.get(trackSid).stopRendering();
        renderedPublications.delete(trackSid);
      });
      container.remove();
    }
  };
}

async function createRoomButtons({ room, container, env }) {
  let credentialsAt;
  let creds;
  try {
    creds = await getCreds(env);
    credentialsAt = `${creds.signingKeySid}:${creds.signingKeySecret}@`;
  } catch (e) {
    log('failed to load credentials: ', e);
    credentialsAt = '';
  }

  const baseUrl = env === 'prod' ? `https://${credentialsAt}video.twilio.com` : `https://${credentialsAt}video.${env}.twilio.com`;

  createLink({ container, linkText: 'RecordingRules', linkUrl: `${baseUrl}/v1/Rooms/${room.sid}/RecordingRules`, newTab: true });

  createButton('copy start recording', container, () => {
    const command = `curl -X POST '${baseUrl}/v1/Rooms/${room.sid}/RecordingRules' \
    -u '${creds.signingKeySid}:${creds.signingKeySecret}' \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d 'Rules=[{"type": "include", "all": "true"}]'`;
    navigator.clipboard.writeText(command);
  });

  createButton('copy stop recording', container, () => {
    const command = `curl -X POST '${baseUrl}/v1/Rooms/${room.sid}/RecordingRules' \
    -u '${creds.signingKeySid}:${creds.signingKeySecret}' \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d 'Rules=[{"type": "exclude", "all": "true"}]'`;
    navigator.clipboard.writeText(command);
  });

  createLink({ container, linkText: `/v1/Rooms/${room.sid}`, linkUrl: `${baseUrl}/v1/Rooms/${room.sid}`, newTab: true });

  // this works.
  // createButton('fetch room', roomHeaderDiv, async () => {
  //   try {
  //     var headers = new Headers();
  //     headers.append('Authorization', 'Basic ' + btoa(creds.signingKeySid + ':' + creds.signingKeySecret));
  //     const result = await fetch(`${baseUrlNoCredentials}/v1/Rooms/${room.sid}`, { headers });
  //     log(result);
  //   } catch (e) {
  //     log('Error fetching: ', e);
  //   }
  // });

}


export function renderRoom({ room, container, shouldAutoAttach, env = 'prod' }) {

  // const baseUrlNoCredentials = env === 'prod' ? 'https://video.twilio.com' : `https://video.${env}.twilio.com`;
  container = createDiv(container, 'room-container');
  const roomHeaderDiv = createDiv(container, 'roomHeaderDiv');

  const roomSid = createElement(roomHeaderDiv, { type: 'h2', classNames: ['roomHeaderText'] });
  roomSid.innerHTML = ` ${room.sid} `;
  createRoomButtons({ env, room, container  });
  const localParticipant = createLabeledStat(container, 'localParticipant', { className: 'localParticipant', useValueToStyle: true });
  localParticipant.setText(room.localParticipant.identity);
  const roomState = createLabeledStat(container, 'state', { className: 'roomstate', useValueToStyle: true });
  const recording = createLabeledStat(container, 'isRecording', { className: 'recording', useValueToStyle: true });


  const updateRecordingState = () => recording.setText(room.isRecording);
  const updateRoomState = () => roomState.setText(room.state);
  room.addListener('disconnected', updateRoomState);
  room.addListener('reconnected', updateRoomState);
  room.addListener('reconnecting', updateRoomState);
  room.addListener('recordingStarted', () => {
    log('recordingStarted');
    updateRecordingState();
  });
  room.addListener('recordingStopped', () => {
    log('recordingStopped');
    updateRecordingState();
  });
  updateRoomState();
  updateRecordingState();

  const isDisconnected = room.disconnected;
  const btnDisconnect = createButton('disconnect', roomHeaderDiv, () => {
    room.disconnect();
    container.remove();
  });

  // When we are about to transition away from this page, disconnect
  // from the room, if joined.
  window.addEventListener('beforeunload', () => room.disconnect());

  btnDisconnect.show(!isDisconnected);

  const renderedParticipants = new Map();
  const remoteParticipantsContainer = createDiv(container, 'remote-participants', 'remote-participants');
  room.participants.forEach(participant => {
    renderedParticipants.set(participant.sid, renderParticipant(participant, remoteParticipantsContainer, shouldAutoAttach));
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', participant => {
    renderedParticipants.set(participant.sid, renderParticipant(participant, remoteParticipantsContainer, shouldAutoAttach));
  });

  // When a Participant leaves the Room, detach its Tracks.
  room.on('participantDisconnected', participant => {
    const rendered = renderedParticipants.get(participant.sid);
    if (rendered) {
      rendered.stopRendering();
      renderedParticipants.delete(participant.sid);
    }
  });

  var statUpdater = setInterval(async () => {
    const statReports = await room.getStats();
    statReports.forEach(statReport => {
      ['remoteVideoTrackStats', 'remoteAudioTrackStats', 'localAudioTrackStats', 'localVideoTrackStats'].forEach(
        trackType => {
          statReport[trackType].forEach(trackStats => {
            const { trackId, trackSid, bytesSent, bytesReceived } = trackStats;
            [...renderedParticipants.keys()].forEach(key => {
              renderedParticipants.get(key).updateStats({ trackId, trackSid, bytesSent, bytesReceived, trackType });
            });
            updateTrackStats({ room, trackId, trackSid, bytesSent, bytesReceived, trackType });
          });
        }
      );
    });
  }, 100);

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', () => {
    clearInterval(statUpdater);
    [...renderedParticipants.keys()].forEach(key => {
      renderedParticipants.get(key).stopRendering();
      renderedParticipants.delete(key);
    });
  });
}
