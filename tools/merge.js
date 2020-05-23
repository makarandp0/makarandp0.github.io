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


/* eslint-disable camelcase */
/* eslint-disable strict */
// > ratings[0]
// { id: 772544202029461500,
//   room_unique_name: 'ipc_1ASA0H4VG3O00',
//   rating: 3,
//   platform: 'ANDROID',
//   app_version: '3.2.3',
//   comments: 'Video pixelated part of the time but sound was excellent',
//   created: '2020-03-29 18:16:16',
//   device: '',
//   device_model: '',
//   entity_id: 'entity_0V6TJHN0O2800',
//   modified: '2020-03-29 18:16:16',
//   room_sid: 'RMd167f7e129e1fe106ec3b36b81cde872' }
// >

const name2ratings = require('./name-ratings.json');
// name2ratings[0]
// { id: 772544202029461500,
//   room_unique_name: 'ipc_1ASA0H4VG3O00',
//   rating: 3,
//   platform: 'ANDROID',
//   app_version: '3.2.3',
//   comments: 'Video pixelated part of the time but sound was excellent',
//   created: '2020-03-29 18:16:16',
//   device: '',
//   device_model: '',
//   entity_id: 'entity_0V6TJHN0O2800',
//   modified: '2020-03-29 18:16:16' }
// > name2sid.length
// 329

const name2sid = require('./name-sid.json');
// > name2sid[0]
// { 'payload.room_name: Descending': 'ipc_1ATLD7FSJTG00',
//   'payload.room_sid: Descending': 'RM2790bcbb6f23205720f7f0defc077397',
//   Count: 538 }
// > name2ratings.forEach(e => e

name2ratings.forEach(e => {
  var sidEntry = name2sid.find(ns => ns['payload.room_name: Descending'] === e.room_unique_name);
  // eslint-disable-next-line camelcase
  e.room_sid = sidEntry ? sidEntry['payload.room_sid: Descending'] : 'room_not_found';
});
// var jsonData = JSON.stringify(name2ratings);
// var fs = require('fs');
// fs.writeFile('ratingsInfo.json', jsonData, function(err) {
//     if (err) {
//         console.log(err);
//     }
// });

function convertToNumber(res) {
  if (typeof res === 'string') {
    return parseInt(res.replace(/,/g, ''));
  }
  return res;
}

const sid2track = require('./sid-trackInfo.json');
// > sid2track.length
// 2371
// > sid2track[0]
// { 'payload.room_sid: Descending': 'RM84c4822eabe4c5e4fdce44329eeef41e',
//   'payload.participant_sid: Descending': 'PAfdc14fe4b8778acca5f42bea1e1774b7',
//   'payload.track_sid: Descending': 'MT4a6132c5f10dc2367e251f903cbd8b1b',
//   'payload.track_type: Descending': 'videoTrack',
//   'publisher_metadata.platform_name: Descending': 'iOS',
//   'Sum of payload.packets_lost': '4,789,961',
//   'Sum of payload.packets_sent': 0,
//   'Sum of payload.packets_received': '151,052,035' }
// >
const room_errors = require('./room_errors.json');
// merge errors.
// room_errors.json
// {
//   "payload.room_name: Descending": "ipc_1AUTTD5GFLO00",
//   "payload.room_sid: Descending": "RMe29e5b260c79c85c3153710a104bac5a",
//   "payload.participant_sid: Descending": "PAee2d822c06f63373e905cfc6b631e990",
//   "payload.error_message: Descending": "Server is unable to apply a remote media description",
//   "payload.error_code: Descending": "53,403",
//   "Count": 1
// },

sid2track.forEach(st => {
  var error = room_errors.find(error => {
    return error['payload.room_sid: Descending'] === st['payload.room_sid: Descending'] &&
    error['\'payload.participant_sid: Descending\''] === st['\'payload.participant_sid: Descending\''];
  });
  st.error_code = 0;
  st.error_message = 'no_error';
  if (error) {
    st.error_message = error['payload.error_message: Descending'];
    st.error_code = error['payload.error_code: Descending'];
  }
});

const ratings = name2ratings;
ratings.forEach( r => {
  var matches = sid2track.filter(v => {
    return v['payload.room_sid: Descending'] === r.room_sid;
  }).map(v => {
    const track_type = v['payload.track_type: Descending'];
    let sum_packets_lost = v['Sum of payload.packets_lost'];
    let sum_packets_sent_or_received = 0;
    if (track_type === 'localVideoTrack' || track_type === 'localAudioTrack') {
      sum_packets_sent_or_received = v['Sum of payload.packets_sent'];
    } else {
      sum_packets_sent_or_received = v['Sum of payload.packets_received'];
    }

    sum_packets_sent_or_received = convertToNumber(sum_packets_sent_or_received);
    sum_packets_lost = convertToNumber(sum_packets_lost);
    const percent_packet_lost = sum_packets_sent_or_received === 0 ? 0 : sum_packets_lost * 100 / sum_packets_sent_or_received;

    return {
      participant_sid: v['payload.participant_sid: Descending'],
      track_sid: v['payload.track_sid: Descending'],
      track_type: v['payload.track_type: Descending'],
      platform_name: v['publisher_metadata.platform_name: Descending'],
      error_message: v.error_message,
      error_code: v.error_code,
      sum_packets_sent_or_received,
      sum_packets_lost,
      percent_packet_lost
    };
  });
  r.track_info = matches;
});


var jsonData = JSON.stringify(ratings);
var fs = require('fs');
fs.writeFile('track_ratings.json', jsonData, function(err) {
    if (err) {
        console.log(err);
    }
});

