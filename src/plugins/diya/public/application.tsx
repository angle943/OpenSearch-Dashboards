/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { DiyaStartDeps } from './types';
import { DiyaApp } from './components/diya_app';

export const renderApp = (
  { element }: AppMountParameters,
  getStartServices: () => Promise<[CoreStart, DiyaStartDeps, unknown]>
) => {
  ReactDOM.render(<DiyaApp getStartServices={getStartServices} />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
