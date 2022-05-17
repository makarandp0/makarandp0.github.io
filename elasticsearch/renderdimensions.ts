import esb from 'elastic-builder/src';
import { generateAndExecuteQuery } from './utils';

// render dimensions
export async function getRenderDimensions({ timeRange, room_sids, debugMode }:{ timeRange: string[], room_sids?: string[], debugMode?: boolean}) {
  const VMSIceConnectionStates = {
    timestamp: "2022-02-11 21:38:28.342+00:00-sample",
    payload: {
      render_hint_height: 0,
      render_hint_width: 0,
      participant_sid: "",
      room_sid: "",
    }
  };

  const { statusCode, results, totalHits } = await generateAndExecuteQuery<typeof VMSIceConnectionStates>({
    index: 'video-vms-reports-*',
    sample: VMSIceConnectionStates,
    from: 0,
    size: 2,
    trackTotalHits: true,
    sort: esb.sort('timestamp', 'desc'),
    queryParameters: {
      filters: new Map<string, string|number|string[]>([
        ['name', 'bw_profile_track'],
        ['payload.render_hint_height', 0]
      ]),
      ranges: new Map([
        ['timestamp', timeRange]
      ])
    }
  });

  console.log("totalHits: ", totalHits );
  results.forEach(result => {
    if (result._source) {
      console.log(result._source);
    }
  })
  // return { statusCode, results };
}

const timeRange = ['2022-02-14T00:00:00.000Z', '2022-02-14T23:59:59.000Z'];
getRenderDimensions({ timeRange })

