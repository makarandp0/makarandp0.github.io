import { renderTrack, updateTrackStats } from './renderTrack.js';
import createButton from '../../jsutilmodules/button.js';
import { createDiv } from '../../jsutilmodules/createDiv.js';
import { createElement } from '../../jsutilmodules/createElement.js';
import { log } from '../../jsutilmodules/log.js';

function renderTrackPublication(trackPublication, container, shouldAutoAttach) {
  const trackContainerId = 'trackPublication_' + trackPublication.trackSid;
  const publicationContainer = createDiv(container, 'publication', trackContainerId);
  const trackSid = createElement(publicationContainer, { type: 'h6', classNames: ['participantSid'] });
  trackSid.innerHTML = `${trackPublication.kind}:${trackPublication.trackSid}`;

  let renderedTrack = null;
  if (trackPublication.isSubscribed) {
    renderedTrack = renderTrack({
      track: trackPublication.track,
      container: publicationContainer,
      shouldAutoAttach
    });
  }

  trackPublication.on('subscribed', function(track) {
    log(`Subscribed to ${trackPublication.kind}:${track.name}`);
    renderedTrack = renderTrack({
      track: track,
      container: publicationContainer,
      shouldAutoAttach
    });
  });
  trackPublication.on('unsubscribed', () => {
    renderedTrack.stopRendering();
    renderedTrack = null;
  });


  return {
    trackPublication,
    publicationContainer,
    stopRendering: () => {
      if (renderedTrack) {
        renderedTrack.stopRendering();
        renderedTrack = null;
      }
      container.removeChild(publicationContainer);
    }
  };
}

export function renderParticipant(participant, container, shouldAutoAttach) {
  let participantContainer = createDiv(container, 'participantDiv', `participantContainer-${participant.identity}`);
  const name = createElement(participantContainer, { type: 'h2', classNames: ['participantName'] });
  name.innerHTML = participant.identity;
  const participantMedia = createDiv(participantContainer, 'participantMediaDiv');
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
    container: participantContainer,
    stopRendering: () => {
      [...renderedPublications.keys()].forEach(trackSid => {
        renderedPublications.get(trackSid).stopRendering();
        renderedPublications.delete(trackSid);
      });
      container.removeChild(participantContainer);
    }
  };
}

export function renderRoom({ room, container, shouldAutoAttach }) {
  container = createDiv(container, 'room-container');
  const roomHeaderDiv = createDiv(container, 'roomHeaderDiv');

  const roomSid = createElement(roomHeaderDiv, { type: 'h3', classNames: ['roomHeaderText'] });
  roomSid.innerHTML = room.sid + ' : ' + room.localParticipant.identity;


  const isDisconnected = room.disconnected;
  const btnLeave = createButton('Leave', roomHeaderDiv, () => room.disconnect());
  const btnClose = createButton('Close', roomHeaderDiv, () => container.remove());

  // When we are about to transition away from this page, disconnect
  // from the room, if joined.
  window.addEventListener('beforeunload', () => room.disconnect());

  btnLeave.show(!isDisconnected);
  btnClose.show(isDisconnected);

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
          statReport[trackType].forEach(trackStats => updateTrackStats({ ...trackStats, trackType }));
        }
      );
    });
  }, 100);

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', () => {
    btnClose.show(true);
    btnLeave.show(false);
    clearInterval(statUpdater);
    [...renderedParticipants.keys()].forEach(key => {
      renderedParticipants.get(key).stopRendering();
      renderedParticipants.delete(key);
    });
  });
}
