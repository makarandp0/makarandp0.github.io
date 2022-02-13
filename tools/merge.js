/* eslint-disable no-console */
/* eslint-disable quotes */
/* eslint-disable camelcase */
console.log("Process.cwd:", process.cwd());
const cwd = process.cwd();

const basic = require(cwd + '/basic.json');
// > require("./basic.json")[0]
// { room_sid: 'RM56c73d3bab67766b33c3098633d5d760',
//   participant_sid: 'PA03e27c5b8ef424f1803b0863d0f3820d',
//   platform_name: 'Windows',
//   browser: 'Chrome',
//   browser_version: '81.0.4044',
//   hw_device_model: 'Other',
//   sdk_version: '2.4.0',
//   Count: '1' }

const tracks = require(cwd + "/tracks.json");
// > require("./tracks.json")[0]
// { room_sid: 'RM7c45458a62e29d2a24cf81943189a2fb',
//   participant_sid: 'PA16019e069cf9f65f37e40e714e369737',
//   platform: 'Mac OS',
//   track_sid: 'MTa5d6edb506260f2c298f62bca0f12096',
//   track_type: 'localVideoTrack',
//   packets_sent: '176,926,663',
//   packets_received: '0',
//   packets_lost: '0',
//   'average rtt': '' }

const errors = require(cwd + "/errors.json");
// {"room_sid":"RM90be2e0c78e84d040325fe9e93fe2cce",
// "participant_sid":"PA87946330001d14ae03c829353ee37bb2",
// "error_code":"53205","payload.error_message: Descending":
// "Participant disconnected because of duplicate identity","Count":"1"},
// {"room_sid":"RM90be2e0c78e84d040325fe9e93fe2cce",
// "participant_sid":"PA87946330001d14ae03c829353ee37bb2",
// "error_code":"53205",
// "error_message":"Participant disconnected because of duplicate identity","Count":"1"},

const trackToRecording = {};

const recordings = require(cwd + '/recording_created');
// {
//   timestamp: '2021-04-16 12:55:31.046',
//   group: 'recording',
//   name: 'created',
//   'payload.room_sid': 'RM5f606fa9342474110a0a5e3f7b5770c7',
//   'payload.recording_sid': 'RT3667d5c91dbd187ee10acfc03490a3cf',
//   'payload.track_sid': 'MTb00ae1c173ff7a9e55ad007c08e709e5'
// },
recordings.forEach(recordings => {
  trackToRecording[recordings['payload.track_sid']] = recordings['payload.recording_sid'];
});

const participantMap = {};
basic.forEach(entry => {
  participantMap[entry.participant_sid] = entry;
  const error = errors.find(errorEntry => errorEntry.participant_sid === entry.participant_sid);
  participantMap[entry.participant_sid].error_message = error ? error.error_message : "no_error";
});

function convertToNumber(res) {
  if (typeof res === 'string') {
    return parseInt(res.replace(/,/g, ''));
  }
  return res;
}

const results = tracks.map(track => {
  const { room_sid, browser, browser_version, hw_device_model, sdk_version, error_message } = participantMap[track.participant_sid];
  const { participant_sid, track_sid, track_type, packets_sent, packets_received, packets_lost } = track;
  let packets = 0;
  let packetLoss = 0;
  if (track_type === 'localVideoTrack' || track_type === 'localAudioTrack') {
    packets = convertToNumber(packets_sent);
  } else {
    packets = convertToNumber(packets_received);
  }
  packetLoss = packets === 0 ? 0 : convertToNumber(packets_lost) * 100 / packets;
  const packetLoss_percent = packetLoss.toFixed(2);
  let recording_sid = trackToRecording[track_sid];

  return { room_sid, participant_sid, browser, browser_version, hw_device_model, track_sid, track_type, packets, packetLoss_percent, sdk_version, error_message, recording_sid };
});

var jsonData = JSON.stringify(results);
var fs = require('fs');
fs.writeFile('results.json', jsonData, function(err) {
  if (err) {
    console.log(err);
  }
});

