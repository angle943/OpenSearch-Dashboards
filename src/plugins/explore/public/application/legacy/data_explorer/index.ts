/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export { DataExplorerPluginSetup, DataExplorerPluginStart, DataExplorerServices } from './types';
export { ViewProps, ViewDefinition, DefaultViewState } from './services/view_service';
export {
  RootState,
  Store,
  useTypedSelector,
  useTypedDispatch,
  setIndexPattern,
} from './utils/state_management';
