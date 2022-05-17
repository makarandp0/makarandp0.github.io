import { Client } from '@elastic/elasticsearch'
import type { Client as NewTypes } from '@elastic/elasticsearch/api/new'

// use `curl http://localhost:29200/video` to check server version
// @ts-expect-error @elastic/elasticsearch
const client: NewTypes = new Client({ node: 'http://localhost:29200/video' })

import esb from 'elastic-builder/src';

export type QUERY_PARAMETERS = {
  filters?: Map<string, string|number|string[]|number[]>;
  ranges?: Map<string, string[]>;
  returnFields?: string[];
  aggs? : esb.Aggregation[];
};

// const filters = { "group": 'recording', 'name': 'terminated', 'payload.state': ['ABSENT_NO_MEDIA', 'MEDIA_GAP']};
//   for array values filter would satisfy any of the value.
// const ranges = { timestamp: ['2022-02-09T21:48:43.599Z', '2022-02-09T22:18:43.599Z'] };
// const returnFields = ["group", "name", "payload.state", "payload.track_sid"];
export function   makeQueryBody({ filters = new Map(), ranges = new Map(), returnFields = [], aggs } : QUERY_PARAMETERS ): esb.RequestBodySearch {
  const mainQuery = esb.boolQuery();
  const shouldQueries: esb.BoolQuery[] = [];
  filters.forEach((v, k) => {
    if (Array.isArray(v)) {
      const termQueries = v.map(val => esb.termQuery(k, val));
      shouldQueries.push(esb.boolQuery().minimumShouldMatch(1).should(termQueries));
    } else {
      mainQuery.filter(esb.termQuery(k, v));
    }
  });

  ranges.forEach((v, k) => {
    mainQuery.filter(esb.rangeQuery(k).gte(v[0]).lt(v[1]))
  });

  const requestBody = esb.requestBodySearch().query(
    mainQuery.filter(shouldQueries)
  ).source(returnFields);

  if (aggs) {
    requestBody.aggs(aggs);
  };

  // esb.prettyPrint(requestBody);
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

type QUERY_PARAMETERS_SIMPLE = Omit<QUERY_PARAMETERS, "returnFields">;
export async function generateAndExecuteQuery<T>({ index, sample, queryParameters, collapseField, aggs, sort, from=0, size=1000, trackTotalHits=false} : {
  index: string,
  sample: T,
  queryParameters: QUERY_PARAMETERS_SIMPLE,
  aggs?: esb.Aggregation[],
  collapseField?: string,
  sort?: esb.Sort,
  from?: number,
  size?: number,
  trackTotalHits?: boolean // should we return total hits?
}) {
  const queryBody = makeQueryBody(queryParameters);
  queryBody.source(getObjectKeys(sample));
  if (aggs) {
    queryBody.aggs(aggs);
    // when getting aggregated results, dont get actual results.
    queryBody.size(0);
  } else {
    queryBody.from(from);
    queryBody.size(size);
  }

  queryBody.trackTotalHits(trackTotalHits);
  if (collapseField) {
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/collapse-search-results.html
    // collapsedQuery allows to collapse a field
    // so that only one result is returned for each value for that field.
    queryBody.collapse('payload.participant_sid')
  }
  if (sort) {
    queryBody.sort(sort);
  }

  // esb.prettyPrint(queryBody);
  const { statusCode, hits, took, result } = await executeQuery<T>(queryBody, index);

  // @ts-ignore
  const totalHits = hits.total?.value;
  return { statusCode, results: hits.hits, aggregations: result?.body?.aggregations, totalHits};
}

// given an object, converts its to an array of keys acceptable for source parameter for elastic search.
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

