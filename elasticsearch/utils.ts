import { Client } from '@elastic/elasticsearch'
import type { Client as NewTypes } from '@elastic/elasticsearch/api/new'

// @ts-expect-error @elastic/elasticsearch
const client: NewTypes = new Client({ node: 'http://localhost:29200/video' })

import esb from 'elastic-builder/src';

export type QUERY_PARAMETERS = {
  mustEqual?: Map<string, string>;
  mustRange?: Map<string, string[]>;
  shouldEqualOneOf?: Map<string, string[]>;
  returnFields?: string[];
  aggs? : esb.Aggregation[];
};

// const mustEqual = { "group": 'recording', 'name': 'terminated'};
// const mustRange = { timestamp: ['2022-02-09T21:48:43.599Z', '2022-02-09T22:18:43.599Z'] };
// const shouldEqualOneOf = { 'payload.state': ['ABSENT_NO_MEDIA', 'MEDIA_GAP'] };
// const returnFields = ["group", "name", "payload.state", "payload.track_sid"];
export function makeQueryBody({ mustEqual = new Map(), mustRange = new Map(), shouldEqualOneOf = new Map(), returnFields = [], aggs } : QUERY_PARAMETERS ): esb.RequestBodySearch {
  const must: esb.Query[] = [];
  mustEqual.forEach((v, k) => {
    must.push(esb.matchQuery(k, v));
  });

  mustRange.forEach((v, k) => {
    must.push(esb.rangeQuery(k).gte(v[0]).lt(v[1]));
  });

  const boolQueries = [
    esb.boolQuery().must(must)
  ];

  shouldEqualOneOf.forEach((values,k) => {
    const oneOf: esb.MatchQuery[] = [];
    values.forEach(val => {
      oneOf.push(esb.matchQuery(k, val));
    });
    boolQueries.push(
      esb.boolQuery().minimumShouldMatch(1).should(oneOf)
    );
  });

  const requestBody = esb.requestBodySearch().query(
    esb.boolQuery()
        .filter(boolQueries)
  ).source(returnFields);

  if (aggs) {
    requestBody.aggs(aggs);
  };

  // console.log('======== From QB:');
  // esb.prettyPrint(requestBody)
  return requestBody;
}

export async function executeQuery<T>(body: esb.RequestBodySearch, index: string) {
  const result = await client.search<T>({ index, body: body.toJSON() });
  const took = result.body.took;
  const hits = result.body.hits;
  const statusCode = result.statusCode;
  if (statusCode !== 200) {
    console.warn('statusCode:', statusCode, ' took: ', took, 'hits.length:', hits?.hits.length);
  }

  return { took, hits, statusCode, result };
}


// given an object, converts its to an array of keys acceptable for returnFields.
// @param sourceObject ={ group: "",  name: "", payload: { state: "" }
// @returns: ["group", "name", "payload.state"]
export function getObjectKeys(sourceObject : Record<string, any>) : string [] {
  const objectKeys: string[] = [];
  Object.keys(sourceObject).forEach(k => {
    if (typeof sourceObject[k] === 'object') {
      const keys = getObjectKeys(sourceObject[k]);
      keys.forEach(k2 => objectKeys.push(k + "." + k2));
    } else {
      objectKeys.push(k);
    }
  });
  return objectKeys;
}

