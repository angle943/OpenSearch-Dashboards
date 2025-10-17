/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './visualization_container.scss';
import { EuiPanel } from '@elastic/eui';
import React, { useCallback, useEffect, useMemo } from 'react';
import moment from 'moment';
import { useDispatch } from 'react-redux';

import './visualization_container.scss';
import { AxisColumnMappings } from './types';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder } from './visualization_builder';
import { TimeRange } from '../../../../data/common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  clearQueryStatusMap,
  clearResults,
  setDateRange,
} from '../../application/utils/state_management/slices';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';
import { VizIframe } from './viz_iframe';

export interface UpdateVisualizationProps {
  mappings: AxisColumnMappings;
}
// TODO: add back notifications
// const VISUALIZATION_TOAST_MSG = {
//   useRule: i18n.translate('explore.visualize.toast.useRule', {
//     defaultMessage: 'Cannot apply previous configured visualization, use rule matched',
//   }),
//   reset: i18n.translate('explore.visualize.toast.reset', {
//     defaultMessage: 'Cannot apply previous configured visualization, reset',
//   }),
//   metricReset: i18n.translate('explore.visualize.toast.metricReset', {
//     defaultMessage: 'Cannot apply metric type visualization, reset',
//   }),
//   switchReset: i18n.translate('explore.visualize.toast.switchReset', {
//     defaultMessage: 'Cannot apply configured visualization to the current chart type, reset',
//   }),
// };

export const VisualizationContainer = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { results } = useTabResults();
  const searchContext = useSearchContext();
  const dispatch = useDispatch();

  const rows = useMemo(() => results?.hits?.hits || [], [results]);
  const fieldSchema = useMemo(() => results?.fieldSchema || [], [results]);

  const visualizationBuilder = getVisualizationBuilder();

  useEffect(() => {
    visualizationBuilder.handleData(rows, fieldSchema);
  }, [rows, fieldSchema, visualizationBuilder]);

  useEffect(() => {
    visualizationBuilder.init();
    return () => {
      // reset visualization builder
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder]);

  const onSelectTimeRange = useCallback(
    (timeRange?: TimeRange) => {
      if (timeRange) {
        dispatch(
          setDateRange({
            from: moment(timeRange.from).toISOString(),
            to: moment(timeRange.to).toISOString(),
          })
        );
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());
        dispatch(executeQueries({ services }));
      }
    },
    [services, dispatch]
  );

  return (
    <div className="exploreVisContainer">
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        data-test-subj="exploreVisualizationLoader"
        className="exploreVisPanel"
        paddingSize="none"
      >
        <div className="exploreVisPanel__inner">
          {visualizationBuilder.renderVisualization({ searchContext, onSelectTimeRange })}
        </div>
        <VizIframe
          spec={{
            $schema: 'https://vega.github.io/schema/vega/v5.json',
            autosize: {
              type: 'fit',
              contains: 'padding',
            },
            background: 'transparent',
            padding: 5,
            style: 'cell',
            data: [
              {
                name: 'highlight_store',
                transform: [
                  {
                    type: 'collect',
                    sort: {
                      field: '_vgsid_',
                    },
                  },
                ],
              },
              {
                name: 'source_0',
                values: [
                  {
                    'field-0': 1676076,
                    'field-1': 'accounting',
                  },
                  {
                    'field-0': 42,
                    'field-1': 'accountingservice',
                  },
                  {
                    'field-0': 304789,
                    'field-1': 'ad',
                  },
                  {
                    'field-0': 136,
                    'field-1': 'adservice',
                  },
                  {
                    'field-0': 6853334,
                    'field-1': 'cart',
                  },
                  {
                    'field-0': 1197,
                    'field-1': 'cartservice',
                  },
                  {
                    'field-0': 1602181,
                    'field-1': 'checkout',
                  },
                  {
                    'field-0': 576,
                    'field-1': 'checkoutservice',
                  },
                  {
                    'field-0': 1890561,
                    'field-1': 'currency',
                  },
                  {
                    'field-0': 122,
                    'field-1': 'currencyservice',
                  },
                  {
                    'field-0': 170,
                    'field-1': 'emailservice',
                  },
                  {
                    'field-0': 392,
                    'field-1': 'featureflagservice',
                  },
                  {
                    'field-0': 3417638,
                    'field-1': 'flagd',
                  },
                  {
                    'field-0': 345,
                    'field-1': 'flagd-ui',
                  },
                  {
                    'field-0': 43,
                    'field-1': 'frauddetectionservice',
                  },
                  {
                    'field-0': 38673878,
                    'field-1': 'frontend',
                  },
                  {
                    'field-0': 36748403,
                    'field-1': 'frontend-proxy',
                  },
                  {
                    'field-0': 14429978,
                    'field-1': 'frontend-web',
                  },
                  {
                    'field-0': 3990890,
                    'field-1': 'image-provider',
                  },
                  {
                    'field-0': 3052140,
                    'field-1': 'load-generator',
                  },
                  {
                    'field-0': 802,
                    'field-1': 'loadgenerator',
                  },
                  {
                    'field-0': 283086,
                    'field-1': 'payment',
                  },
                  {
                    'field-0': 83,
                    'field-1': 'paymentservice',
                  },
                  {
                    'field-0': 8631514,
                    'field-1': 'product-catalog',
                  },
                  {
                    'field-0': 1002,
                    'field-1': 'productcatalogservice',
                  },
                  {
                    'field-0': 427452,
                    'field-1': 'quote',
                  },
                  {
                    'field-0': 127,
                    'field-1': 'quoteservice',
                  },
                  {
                    'field-0': 4829676,
                    'field-1': 'recommendation',
                  },
                  {
                    'field-0': 308,
                    'field-1': 'recommendationservice',
                  },
                  {
                    'field-0': 424862,
                    'field-1': 'shipping',
                  },
                  {
                    'field-0': 125,
                    'field-1': 'shippingservice',
                  },
                ],
              },
              {
                name: 'data_0',
                source: 'source_0',
                transform: [
                  {
                    type: 'identifier',
                    as: '_vgsid_',
                  },
                  {
                    type: 'aggregate',
                    groupby: ['field-1'],
                    ops: ['sum'],
                    fields: ['field-0'],
                    as: ['sum_field-0'],
                  },
                  {
                    type: 'identifier',
                    as: '_vgsid_',
                  },
                  {
                    type: 'filter',
                    expr: 'isValid(datum["sum_field-0"]) && isFinite(+datum["sum_field-0"])',
                  },
                ],
              },
            ],
            signals: [
              {
                name: 'width',
                init: 'isFinite(containerSize()[0]) ? containerSize()[0] : 200',
                on: [
                  {
                    update: 'isFinite(containerSize()[0]) ? containerSize()[0] : 200',
                    events: 'window:resize',
                  },
                ],
              },
              {
                name: 'height',
                init: 'isFinite(containerSize()[1]) ? containerSize()[1] : 200',
                on: [
                  {
                    update: 'isFinite(containerSize()[1]) ? containerSize()[1] : 200',
                    events: 'window:resize',
                  },
                ],
              },
              {
                name: 'unit',
                value: {},
                on: [
                  {
                    events: 'pointermove',
                    update: 'isTuple(group()) ? group() : unit',
                  },
                ],
              },
              {
                name: 'highlight',
                update: 'vlSelectionResolve("highlight_store", "union", true, true)',
              },
              {
                name: 'highlight_tuple',
                on: [
                  {
                    events: [
                      {
                        source: 'scope',
                        type: 'pointerover',
                      },
                    ],
                    update:
                      'datum && item().mark.marktype !== \'group\' && indexof(item().mark.role, \'legend\') < 0 ? {unit: "layer_0", _vgsid_: (item().isVoronoi ? datum.datum : datum)["_vgsid_"]} : null',
                    force: true,
                  },
                  {
                    events: [
                      {
                        source: 'view',
                        type: 'dblclick',
                      },
                    ],
                    update: 'null',
                  },
                ],
              },
              {
                name: 'highlight_toggle',
                value: false,
                on: [
                  {
                    events: [
                      {
                        source: 'scope',
                        type: 'pointerover',
                      },
                    ],
                    update: 'event.shiftKey',
                  },
                  {
                    events: [
                      {
                        source: 'view',
                        type: 'dblclick',
                      },
                    ],
                    update: 'false',
                  },
                ],
              },
              {
                name: 'highlight_modify',
                on: [
                  {
                    events: {
                      signal: 'highlight_tuple',
                    },
                    update:
                      'modify("highlight_store", highlight_toggle ? null : highlight_tuple, highlight_toggle ? null : true, highlight_toggle ? highlight_tuple : null)',
                  },
                ],
              },
            ],
            marks: [
              {
                name: 'layer_0_marks',
                type: 'rect',
                style: ['bar'],
                interactive: true,
                from: {
                  data: 'data_0',
                },
                encode: {
                  update: {
                    tooltip: {
                      signal:
                        '{"serviceName": isValid(datum["field-1"]) ? datum["field-1"] : ""+datum["field-1"], "count()(sum)": format(datum["sum_field-0"], "")}',
                    },
                    fill: {
                      value: '#54B399',
                    },
                    fillOpacity: [
                      {
                        test:
                          'length(data("highlight_store")) && vlSelectionIdTest("highlight_store", datum)',
                        value: 1,
                      },
                      {
                        value: 0.87,
                      },
                    ],
                    ariaRoleDescription: {
                      value: 'bar',
                    },
                    description: {
                      signal:
                        '"field-1: " + (isValid(datum["field-1"]) ? datum["field-1"] : ""+datum["field-1"]) + "; Sum of field-0: " + (format(datum["sum_field-0"], "")) + "; serviceName: " + (isValid(datum["field-1"]) ? datum["field-1"] : ""+datum["field-1"]) + "; count()(sum): " + (format(datum["sum_field-0"], ""))',
                    },
                    x: {
                      scale: 'x',
                      field: 'field-1',
                    },
                    width: {
                      signal: "max(0.25, bandwidth('x'))",
                    },
                    y: {
                      scale: 'y',
                      field: 'sum_field-0',
                    },
                    y2: {
                      scale: 'y',
                      value: 0,
                    },
                  },
                },
              },
            ],
            scales: [
              {
                name: 'x',
                type: 'band',
                domain: {
                  data: 'data_0',
                  field: 'field-1',
                  sort: true,
                },
                range: [
                  0,
                  {
                    signal: 'width',
                  },
                ],
                paddingInner: 0.1,
                paddingOuter: 0.05,
              },
              {
                name: 'y',
                type: 'linear',
                domain: {
                  data: 'data_0',
                  field: 'sum_field-0',
                },
                range: [
                  {
                    signal: 'height',
                  },
                  0,
                ],
                nice: true,
                zero: true,
              },
            ],
            axes: [
              {
                scale: 'y',
                orient: 'left',
                grid: true,
                gridScale: 'x',
                tickCount: {
                  signal: 'ceil(height/40)',
                },
                domain: false,
                labels: false,
                aria: false,
                maxExtent: 0,
                minExtent: 0,
                ticks: false,
                zindex: 0,
              },
              {
                scale: 'x',
                orient: 'bottom',
                grid: false,
                title: 'serviceName',
                labelAngle: 0,
                labelFlush: false,
                labelLimit: 100,
                labelOverlap: 'greedy',
                labels: true,
                labelSeparation: 8,
                labelBaseline: 'top',
                zindex: 0,
              },
              {
                scale: 'y',
                orient: 'left',
                grid: false,
                title: 'count()',
                labelAngle: 0,
                labelFlush: false,
                labelLimit: 100,
                labelOverlap: 'greedy',
                labels: true,
                labelSeparation: 8,
                labelAlign: 'right',
                tickCount: {
                  signal: 'ceil(height/40)',
                },
                zindex: 0,
              },
            ],
            config: {
              range: {
                category: [
                  '#54B399',
                  '#6092C0',
                  '#D36086',
                  '#9170B8',
                  '#CA8EAE',
                  '#D6BF57',
                  '#B9A888',
                  '#DA8B45',
                  '#AA6556',
                  '#E7664C',
                ],
              },
              axis: {
                gridColor: '#dcdee1',
                tickColor: '#dcdee1',
                labelColor: '#2A3947',
                domainColor: '#dcdee1',
                domain: true,
                grid: true,
              },
              style: {
                'guide-label': {
                  fontSize: 12,
                  fill: '#5A6875',
                },
                'guide-title': {
                  fontSize: 12,
                  fill: '#2A3947',
                },
                'group-title': {
                  fontSize: 14,
                  fill: '#2A3947',
                },
                'group-subtitle': {
                  fill: '#2A3947',
                },
                cell: {
                  stroke: null,
                },
                arc: {
                  fill: '#54B399',
                },
                area: {
                  fill: '#54B399',
                },
                bar: {
                  fill: '#54B399',
                },
                line: {
                  stroke: '#54B399',
                },
                point: {
                  fill: '#54B399',
                },
                rect: {
                  fill: '#54B399',
                },
                text: {
                  fill: '#2A3947',
                },
                circle: {
                  fill: '#54B399',
                },
              },
            },
          }}
        />
      </EuiPanel>
    </div>
  );
};
