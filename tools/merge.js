/* eslint-disable no-console */
/* eslint-disable quotes */
/* eslint-disable camelcase */
const basic = require('./basic.json');
// > require("./basic.json")[0]
// { room_sid: 'RM56c73d3bab67766b33c3098633d5d760',
//   participant_sid: 'PA03e27c5b8ef424f1803b0863d0f3820d',
//   platform_name: 'Windows',
//   browser: 'Chrome',
//   browser_version: '81.0.4044',
//   hw_device_model: 'Other',
//   sdk_version: '2.4.0',
//   Count: '1' }

const tracks = require("./tracks.json");
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

const participantMap = {};
basic.forEach(entry => {
  participantMap[entry.participant_sid] = entry;
});

function convertToNumber(res) {
  if (typeof res === 'string') {
    return parseInt(res.replace(/,/g, ''));
  }
  return res;
}

const results = tracks.map(track => {
  const { room_sid, browser, browser_version, hw_device_model, sdk_version } = participantMap[track.participant_sid];
  const { participant_sid, track_sid, track_type, packets_sent, packets_received, packets_lost } = track;
  let packets = 0;
  let packetLoss = 0;
  if (track_type === 'localVideoTrack' || track_type === 'localAudioTrack') {
    packets = convertToNumber(packets_sent);
  } else {
    packets = convertToNumber(packets_received);
  }
  packetLoss = packets === 0 ? 0 : convertToNumber(packets_lost) * 100 / packets;

  return { room_sid, participant_sid, browser, browser_version, hw_device_model, track_sid, track_type, packets, packetLoss, sdk_version };
});

var jsonData = JSON.stringify(results);
var fs = require('fs');
fs.writeFile('results.json', jsonData, function(err) {
  if (err) {
    console.log(err);
  }
});

