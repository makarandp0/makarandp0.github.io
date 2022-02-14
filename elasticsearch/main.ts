import esb from 'elastic-builder/src';
import { generateAndExecuteQuery } from './utils';
import { AggregationsMultiBucketBase, AggregationsTermsAggregateBase } from '@elastic/elasticsearch/api/types';

const timeRange = ['2022-02-08T20:00:43.599Z', '2022-02-11T22:00:43.599Z'];

const HONORLOCK_ACCOUNT_SID = 'ACf469d11902f69e0ce2b9dba56d3415e7';
const room_sids = [
  'RM8473d9b14724bf9fedfc407ffc1507e1',
  'RM59076307d384f4b3e26e47cd8929e81a',
  'RM8fe9dea3787bbebdeff01674e38b3605',
  'RMb2b74fee64826c621d85fc3d3222ffd1',
  'RMc3d4a383700a37771709a05dd9442bad',
  'RM350760a307812f3a89f2830e41907b06',
  'RM9ae8214c4f69cd1d3c0e8598a3effd97',
  'RMde1f4a5708ba76e9f9e63322cb22a6e0',
  'RM0506d4af0474beeb8d2baab8b8791fd3',
  'RM0914c9a8de7ec50332998a8c83e963d9',
  'RMfd89351ba1498bc45fb60c5e7360fb3d',
  'RM1a07d6625b7312d5e3b468b0815d7bda',
  'RM872f6410d53e42ec32ea67fe2b0bcd81',
  'RMac256ca51c0a892f4df0c0533ad048e9',
];


export async function getIceStatesFromVMS(timeRange: string[]) {
  const VMSIceConnectionStates = {
    timestamp: "2022-02-11 21:38:28.342+00:00-sample",
    payload: {
      ice_state: "",
      room_sid: "",
      participant_sid: "",
    }
  };

  const { statusCode, results } = await generateAndExecuteQuery<typeof VMSIceConnectionStates>({
    index: 'video-vms-reports-*',
    sample: VMSIceConnectionStates,
    queryParameters: {
    filters: new Map<string, string|string[]>([
      ['name', 'ice_state_changed'],
      ['payload.room_sid', room_sids]
    ]),
    range: new Map([
      ['timestamp', timeRange]
    ])
    }
  });
  return { statusCode, results };
}

const VMSTrackRecordingStates = {
  group: "",
  name: "",
  payload: {
    state: "",
    track_sid: "",
    media_type: "",
    room_sid: "",
    participant_sid: "",
  }
};

export async function getTrackSIDSfromVMS(timeRange: string[]) {
  const { statusCode, results } = await generateAndExecuteQuery<typeof VMSTrackRecordingStates>({
    index: 'video-vms-reports-*',
    sample: VMSTrackRecordingStates,
    queryParameters:{
      filters: new Map<string,string|string[]>([
        ["group", 'recording'],
        ['name', 'terminated'],
        ['payload.room_sid', room_sids]
      ]),
      range: new Map([
        ['timestamp', timeRange]
      ])
    }
  });
  return { statusCode, results };
}

const RoomParticipantSample = {
  name: "sample_name",
  timestamp: "2022-02-11 21:38:28.342+00:00-sample",
  payload: {
    room_sid: "",
    room_name: "foo-sample",
    room_type: "group-sample",
    room_protocol_message: "rsp message-sample",
    participant_sid: "",
    publisher: {
      name: "twilio-video.js-sample",
      sdk_version: "2.18.3-sample",
      browser: "",
      browser_major: 0,
      browser_version: 0,
      platform_name: 'iOS-sample',
      platform_version: "	15.2.1-sample",
    }
  }
}
export async function getRoomParticipantInfo() {
  const { statusCode, results } = await generateAndExecuteQuery<typeof RoomParticipantSample>({
    index: 'sdki-rooms-*',
    sample: RoomParticipantSample,
    queryParameters: {
      filters: new Map([
        ['payload.room_sid', room_sids],
        ['name', ['connected', 'disconnected', 'disconnect']]
      ]),
      range: new Map([
        ['timestamp', timeRange]
      ]),
    }
  });
  return { statusCode, results };
}

// connected later.
export async function getRoomErrors() {
  const RoomErrorsSample = {
    payload: {
      room_sid: "",
      timestamp: "2022-02-11 21:38:28.342+00:00-sample",
      room_name: "foo-sample",
      room_type: "group-sample",
      room_protocol_message: "rsp message-sample",
      error_code: 0,
      error_message: "",
      participant_sid: "",
    }
  }
  const { statusCode, results } = await generateAndExecuteQuery<typeof RoomErrorsSample>({
    index: 'sdki-rooms-*',
    sample: RoomErrorsSample,
    queryParameters: {
      filters: new Map<string, string|string[]>([
      ["name", 'error'],
      ['payload.room_sid', room_sids]
      ]),
      range: new Map([
        ['timestamp', timeRange]
      ])
    }
  });
  return { statusCode, results };
}


async function getDTLSErrors() {
  //  dtls_connection
  const DTLSErrorsSample = {
    name: "",
    payload: {
      state: "",
      room_sid: "",
      participant_sid: "",
      message: "",
    }
  }
  const { statusCode, results } = await generateAndExecuteQuery<typeof DTLSErrorsSample>({
    index: 'video-vms-reports-*',
    sample: DTLSErrorsSample,
    queryParameters: {
      filters: new Map<string, string|string[]>([
        ["name", 'dtls_connection'],
        ['payload.state', 'CONNECTION_ERROR'],
        ['payload.room_sid', room_sids]
      ]),
      range: new Map([
        ['timestamp', timeRange]
      ])
  }});
  return { statusCode, results };
}

async function main() {

  interface IParticipantError {
    timestamp: string;
    error_code: number;
    error_message: string;
  };

  interface IParticipantInfo {
    participant_sid: string;
    tracks: Map<string, ITrackInfo>;
    connected_timestamp?: string;
    disconnected_timestamp?: string;
    disconnect_timestamp?: string;
    publisher?: typeof RoomParticipantSample.payload.publisher;
    errors: IParticipantError[];
    iceStateMap: Map<Date, string>,
    dtlsErrors: string[],
  };

  interface IRoomInfo {
    room_sid: string,
    participants: Map<string, IParticipantInfo>
  };

  interface ITrackInfo {
    track_sid: string;
    vms_data: typeof VMSTrackRecordingStates;
    client_data?: {
      sent: number;
      lost: number;
      received: number;
      docs: number;
    }
  };

  const data = {
    rooms: new Map<string, IRoomInfo>(),
  };

  function getRoom(room_sid: string): IRoomInfo {
     let pEntry = data.rooms.get(room_sid);
     if (!pEntry) {
      pEntry = {
        room_sid,
        participants: new Map()
      };
      data.rooms.set(room_sid, pEntry);
     }
     return pEntry;
  }

  function getParticipant(room_sid: string, participant_sid: string) {
    const roomEntry = getRoom(room_sid);
    let pEntry = roomEntry.participants.get(participant_sid);
    if (!pEntry) {
      pEntry = {
        participant_sid: participant_sid,
        errors: [],
        tracks: new Map(),
        iceStateMap: new Map(),
        dtlsErrors: []
      };
      roomEntry.participants.set(participant_sid, pEntry);
    }
    return pEntry;
  }

  function getTrack(room_sid: string, participant_sid: string, track_sid: string, vms_data: typeof VMSTrackRecordingStates) {
    const participantEntry = getParticipant(room_sid, participant_sid);
    let pEntry = participantEntry.tracks.get(track_sid);
    if (!pEntry) {
      pEntry = {
        track_sid,
        vms_data
      };
      participantEntry.tracks.set(track_sid, pEntry);
    }
    return pEntry;
  }

  const participantsInfo = await getRoomParticipantInfo();
  participantsInfo.results.forEach(p => {
    if (p._source) {
      const info = p._source;
      let entry: IParticipantInfo = getParticipant(info.payload.room_sid, info.payload.participant_sid);
      if (info.name === 'connected') {
        entry.connected_timestamp = info.timestamp;
        entry.publisher = info.payload.publisher;
      } else if (info.name === 'disconnected') {
        entry.disconnected_timestamp = info.timestamp || '';
      } else if (info.name === 'disconnect') {
        entry.disconnect_timestamp = info.timestamp || '';
      }
    }
  });

  const roomErrors  = await getRoomErrors();
  roomErrors.results.forEach(p => {
    if (p._source) {
      const info = p._source;
      let entry: IParticipantInfo = getParticipant(info.payload.room_sid, info.payload.participant_sid);
      entry.errors.push({
        timestamp:info.payload.timestamp,
        error_code: info.payload.error_code,
        error_message: info.payload.error_message
      });
    }
  });

  const dtlsErrors = await getDTLSErrors();
  dtlsErrors.results.forEach(p => {
    if (p._source) {
      const info = p._source;
      let entry: IParticipantInfo = getParticipant(info.payload.room_sid, info.payload.participant_sid);
      entry.dtlsErrors.push(info.payload.message)
    }
  })


  const vmsRecordingStates = await getTrackSIDSfromVMS(timeRange);
  vmsRecordingStates.results.forEach(t => {
    if (t._source) {
      const info = t._source;
      let entry: ITrackInfo = getTrack(info.payload.room_sid, info.payload.participant_sid, info.payload.track_sid, info);
    }
  })
  const trackSids: string[] = [];
  data.rooms.forEach(r => r.participants.forEach(p => p.tracks.forEach(t => trackSids.push(t.track_sid))))

  const vmsIceStates = await getIceStatesFromVMS(timeRange);
  vmsIceStates.results.forEach(r => {
    if (r._source) {
      const info = r._source;
      let entry: IParticipantInfo = getParticipant(info.payload.room_sid, info.payload.participant_sid);

      entry.iceStateMap.set(new Date(Date.parse(info.timestamp)), info.payload.ice_state);
    }
  });

  // aggregate track_sids and then find max values for packets_sent
  const agg = esb.termsAggregation('tracks', 'payload.track_sid').aggs([
      esb.maxAggregation('max_packets_sent', 'payload.packets_sent'),
      esb.sumAggregation('total_packets_lost', 'payload.packets_lost'),
      esb.sumAggregation('total_packets_received', 'payload.packets_received')
  ]).size(trackSids.length);

  const { aggregations: aggregationResults } = await generateAndExecuteQuery({
    index: 'video-insights-*',
    sample: {},
    queryParameters: {
      filters: new Map<string, string|string[]>([
        ["group", 'quality'],
        ['name', 'stats-report'],
        ['payload.track_sid', trackSids],
        ['payload.track_type', ['localAudioTrack', 'localVideoTrack']]
      ]),
      range: new Map([
        ['server_timestamp', timeRange]
      ])
    },
    aggs: [agg]
  });

  if (aggregationResults) {
    interface BucketValue {
      value: number;
    };
    interface AggregationProperties extends AggregationsMultiBucketBase {
      key: string;
      max_packets_sent: BucketValue;
      total_packets_lost: BucketValue;
      total_packets_received: BucketValue;
    }
    const ResultTracks = aggregationResults.tracks as AggregationsTermsAggregateBase<AggregationProperties>;
    const buckets = ResultTracks.buckets as AggregationProperties[];

    data.rooms.forEach(room => room.participants.forEach(participant => participant.tracks.forEach(t => {
      const trackBucket = buckets.find(bucket => bucket.key === t.track_sid);
      if (trackBucket) {
        t.client_data = {
          sent: trackBucket.max_packets_sent.value,
          lost: trackBucket.total_packets_lost.value,
          received: trackBucket.total_packets_received.value,
          docs: trackBucket.doc_count
        }
      }
    })));
  }

  const rows: any = [];
  data.rooms.forEach(room => room.participants.forEach(participant => {
    let iceErrors = 0;
    let lastIceState = "none";
    let lastIceDate = new Date(0);
    participant.iceStateMap.forEach((v, k) => {
      if (v === "FAILED") {
        iceErrors++;
      }
      if (k > lastIceDate) {
        lastIceDate = k;
        lastIceState = v;
      }
    });
    let participantDuration = 0
    if (participant.disconnected_timestamp && participant.connected_timestamp)  {
      participantDuration = (Date.parse(participant.disconnected_timestamp) - Date.parse(participant.connected_timestamp))/ 1000;
    }
    participant.tracks.forEach(v => {
      rows.push({
        Room: room.room_sid,
        Participant: participant.participant_sid,
        Browser: participant.publisher?.browser,
        SDK: participant.publisher?.sdk_version,
        SDKI_Errors: participant.errors.length,
        DTLS_ERRORS: participant.dtlsErrors.length,
        LastIceState: lastIceState,
        Ice_Errors: iceErrors,
        Duration: participantDuration,
        Track: v.track_sid,
        Track_State: v.vms_data.payload.state,
        Track_Type: v.vms_data.payload.media_type,
        Packets_Sent: v.client_data?.sent || '',
        Packets_Lost: v.client_data?.lost || '',
      });
    });
  }));
  console.log(JSON.stringify(rows));
}

main()

