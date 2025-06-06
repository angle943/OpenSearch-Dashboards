/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IndexPattern,
  ISearchSource,
  indexPatterns as indexPatternUtils,
  AggConfigs,
} from '../../../../../../../../data/public';
import { DiscoverServices } from '../../../build_services';
import { SortOrder } from '../../../../../../types/saved_explore_types';
import { getSortForSearchSource } from './get_sort_for_search_source';
import {
  SORT_DEFAULT_ORDER_SETTING,
  SAMPLE_SIZE_SETTING,
} from '../../../../../../../common/legacy/discover';

interface Props {
  indexPattern: IndexPattern;
  services: DiscoverServices;
  sort: SortOrder[] | undefined;
  searchSource?: ISearchSource;
  histogramConfigs?: AggConfigs;
  /**
   * Optionally configure the number of rows you get back. This will override the SAMPLE_SIZE_SETTING in uiSettings
   */
  size?: number;
}

export const updateSearchSource = async ({
  indexPattern,
  services,
  searchSource,
  sort,
  histogramConfigs,
  size: sizeParam,
}: Props) => {
  const { uiSettings, data } = services;

  const dataset = indexPattern;

  const sortForSearchSource = getSortForSearchSource(
    sort,
    dataset,
    uiSettings.get(SORT_DEFAULT_ORDER_SETTING)
  );
  const size = sizeParam || uiSettings.get(SAMPLE_SIZE_SETTING);
  const filters = data.query.filterManager.getFilters();

  const searchSourceInstance = searchSource || (await data.search.searchSource.create());

  // searchSource which applies time range
  const timeRangeSearchSource = await data.search.searchSource.create();
  const { isDefault } = indexPatternUtils;
  if (isDefault(dataset)) {
    const timefilter = data.query.timefilter.timefilter;

    timeRangeSearchSource.setField('filter', () => {
      return timefilter.createFilter(dataset);
    });
  }

  searchSourceInstance.setParent(timeRangeSearchSource);

  searchSourceInstance.setFields({
    index: dataset,
    sort: sortForSearchSource,
    size,
    query: data.query.queryString.getQuery() || null,
    highlightAll: true,
    version: true,
    filter: filters,
  });

  if (histogramConfigs) {
    const dslAggs = histogramConfigs.toDsl();
    searchSourceInstance.setField('aggs', dslAggs);
  }

  return searchSourceInstance;
};
