/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';

import { DiyaPlugin } from './plugin';

export function plugin() {
  return new DiyaPlugin();
}

// Re-export types
export * from './types';
