import esb from 'elastic-builder/src';
import { json } from 'stream/consumers';
import { executeQuery, generateAndExecuteQuery, getObjectKeys, makeQueryBody, QUERY_PARAMETERS } from './utils';

const HONORLOCK_ACCOUNT_SID = 'ACf469d11902f69e0ce2b9dba56d3415e7';
// https://www.elastic.co/guide/en/elasticsearch/reference/current/collapse-search-results.html
// collapsedQuery

async function main({ timeRange, room_sids, debugMode }:{ timeRange: string[], room_sids?: string[], debugMode?: boolean}) {
  const VMSIceConnectionStates = {
    timestamp: "2022-02-11 21:38:28.342+00:00-sample",
    payload: {
      participant_sid: "",
      ice_state: "", // ice_state_changed
      // state: "", // ice_state_change
    }
  };

  // const agg = esb.termsAggregation('state', 'payload.ice_state');
  const { statusCode, results, totalHits, aggregations } = await generateAndExecuteQuery<typeof VMSIceConnectionStates>({
    index: 'video-vms-reports-*',
    sample: VMSIceConnectionStates,
    collapseField: 'payload.participant_sid',
    from: 100,
    size: 9000,
    trackTotalHits: true,
    sort: esb.sort('timestamp', 'desc'),
    queryParameters: {
      filters: new Map<string, string|number|string[]>([
        ['name', 'ice_state_changed'],
        ['account_sid', 'ACf469d11902f69e0ce2b9dba56d3415e7']
      ]),
      ranges: new Map([
        ['timestamp', timeRange]
      ])
    }
  });

  // console.log("totalHits: ", totalHits );
  // console.log("results: ", results);
  const iceStateCounts = new Map<string, number>();
  let totalStateCount = 0;
  results.forEach(result => {
    if (result._source) {
      // console.log(`${result._id} ${result._source.payload.participant_sid} ${result._source.payload.state}`);
      const count = iceStateCounts.get(result._source.payload.ice_state) || 0;
      iceStateCounts.set(result._source.payload.ice_state, count+1);
      totalStateCount++;
    }
  })

  // @ts-ignore
  console.log(timeRange, totalStateCount, Array.from(iceStateCounts.keys()).map(k => {
    const keyCount = iceStateCounts.get(k) || 0;
    const keyPercent = keyCount * 100 / totalStateCount;
    return ` ${k} => ${keyPercent.toFixed(2)}`;
  }).sort().join(', '));

  // console.log('iceStates = ', iceStateCounts);
  if (aggregations) {
    console.log('aggregations: ', JSON.stringify(aggregations, null, 4));
  }
  return { statusCode, results };
}

function addDays(date: Date, days: number) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main2 () {
  const Month = 1;
  const Year = 2022;

  // const timeRange = ['2022-02-02T00:00:00.000Z', '2022-02-16T23:59:59.000Z'];

  let startDate = new Date('2022-02-01T10:30:00.000Z');
  let endDate = addDays(startDate, 1);
  console.log(startDate, endDate);

  let today = new Date();
  while(endDate < today) {
    const timeRange = [startDate.toISOString(), endDate.toISOString()];
    // console.log(startDate.toString());
    await main({ timeRange });
    startDate = addDays(startDate, 1);
    endDate = addDays(startDate, 1);
  }
}
main2();

