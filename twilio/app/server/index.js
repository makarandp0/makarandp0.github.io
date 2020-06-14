/* eslint-disable callback-return */
/* eslint-disable no-console */
'use strict';

const credentials = require('./twilio_credentials.json');

var http = require('http');
const cors = require('cors');
// Automatically allow cross-origin requests

const twilio = require('twilio');
var AccessToken = twilio.jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;
var express = require('express');
var randomName = require('./randomname');

// Max. period that a Participant is allowed to be in a Room (currently 14400 seconds or 4 hours)
const MAX_ALLOWED_SESSION_DURATION = 14400;


function getCredentials(environment) {
  const { accountSid, signingKeySid, signingKeySecret } = credentials[environment];
  return { accountSid, signingKeySid, signingKeySecret, environment };
}

function createAccessToken({ environment = 'prod', identity, roomName }) {
  const {
    accountSid,
    signingKeySid,
    signingKeySecret
  } = credentials[environment];

  const accessTokenGenerator = new AccessToken(
    accountSid,
    signingKeySid,
    signingKeySecret,
    { identity, ttl: MAX_ALLOWED_SESSION_DURATION });

  // Grant the access token Twilio Video capabilities.
  const grant = roomName ? new AccessToken.VideoGrant({ room: roomName }) : new VideoGrant();
  accessTokenGenerator.addGrant(grant);
  return accessTokenGenerator.toJwt();
}

async function createRoom({ environment = 'prod', topology, roomName }) {
  const { accountSid, signingKeySid, signingKeySecret } = getCredentials(environment);
  const { video } = twilio(signingKeySid, signingKeySecret, {
    accountSid,
    region: environment === 'prod' ? null : environment
  });

  const result = await video.rooms.create({ type: topology, uniqueName: roomName }).catch(error => {
    if (error.code !== 53113) {
      console.log('Error creating room: ', error);
      throw error;
    }
    return video.rooms(roomName).fetch();
  });
  console.log('createRoom returned:', result);
  // { sid: 'RMccff249dccc111639d9f735e13c104a6',
  // status: 'in-progress',
  // dateCreated: 2020-06-14T18:40:28.000Z,
  // dateUpdated: 2020-06-14T18:40:28.000Z,
  // accountSid: 'AC96ccc904753b3364f24211e8d9746a93',
  // enableTurn: true,
  // uniqueName: 'RMccff249dccc111639d9f735e13c104a6',
  // statusCallback: null,
  // statusCallbackMethod: 'POST',
  // endTime: null,
  // duration: null,
  // type: 'group-small',
  // maxParticipants: 4,
  // recordParticipantsOnConnect: true,
  // videoCodecs: [ 'H264', 'VP8' ],
  // mediaRegion: 'gll',
  // url:
  //  'https://video.twilio.com/v1/Rooms/RMccff249dccc111639d9f735e13c104a6',
  // links:
  //  { recordings:
  //     'https://video.twilio.com/v1/Rooms/RMccff249dccc111639d9f735e13c104a6/Recordings',
  //    participants:
  //     'https://video.twilio.com/v1/Rooms/RMccff249dccc111639d9f735e13c104a6/Participants' } }
  return result;
}

async function completeRoom({ environment = 'prod', roomName }) {
  const { accountSid, signingKeySid, signingKeySecret } = getCredentials(environment);
  const { video } = twilio(signingKeySid, signingKeySecret, {
    accountSid,
    region: environment === 'prod' ? null : environment
  });

  const result = await video.rooms(roomName).update({ status: 'completed' });
  console.log('completeRoom returned: ', result);
  // status: 'completed',
  // dateCreated: 2020-06-14T18:48:15.000Z,
  // dateUpdated: 2020-06-14T18:48:15.000Z,
  // accountSid: 'AC96ccc904753b3364f24211e8d9746a93',
  // enableTurn: true,
  // uniqueName: 'one',
  // statusCallback: null,
  // statusCallbackMethod: 'POST',
  // endTime: 2020-06-14T18:48:26.000Z,
  // duration: 11,
  // type: 'group-small',
  // maxParticipants: 4,
  // recordParticipantsOnConnect: true,
  // videoCodecs: [ 'VP8', 'H264' ],
  // mediaRegion: 'gll',
  // url:
  //  'https://video.twilio.com/v1/Rooms/RM4baee2a709177cedc72aed016390ff9d',
  // links:
  //  { recordings:
  //     'https://video.twilio.com/v1/Rooms/RM4baee2a709177cedc72aed016390ff9d/Recordings',
  //    participants:
  //     'https://video.twilio.com/v1/Rooms/RM4baee2a709177cedc72aed016390ff9d/Participants' } }
  return result;
}

// Create Express webapp.
const app = express();
app.use(cors({ origin: true }));

app.get('/token', function(request, response) {
  const { identity = randomName(), environment } = request.query;
  const token = createAccessToken({ environment, identity });
  response.send({ identity, token });
});

// creates a room and a token for it.
app.get('/getOrCreateRoom', async function(request, response, next) {
  try {
    const { roomName, topology, environment } = request.query;
    const result = await createRoom({ environment, roomName, topology });
    response.set('Content-Type', 'application/json');
    result.token = createAccessToken({ environment, roomName, topology });
    response.send(result);
  } catch (err) {
    next(err);
  }
});

app.get('/completeRoom', async function(request, response, next) {
  const { environment, roomName } = request.query;
  try {
    const result = await completeRoom({ environment, roomName });
    response.set('Content-Type', 'application/json');
    response.send(result);
  } catch (err) {
    next(err);
  }
});

// Create http server and run it.
var server = http.createServer(app);
var port = 3000;
server.listen(port, function() {
  console.log('Express server running on *:' + port);
});
