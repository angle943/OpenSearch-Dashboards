/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreSetup, CoreStart, Plugin, AppMountParameters } from '../../../core/public';
import { DiyaSetupDeps, DiyaStartDeps } from './types';
import { ChatButton } from './components/chat_button';

export class DiyaPlugin implements Plugin<void, void, DiyaSetupDeps, DiyaStartDeps> {
  public setup(core: CoreSetup<DiyaStartDeps>): void {
    // Register the application
    core.application.register({
      id: 'diya',
      title: 'Diya Chat',
      async mount(params: AppMountParameters) {
        // Load app asynchronously
        const { renderApp } = await import('./application');
        return renderApp(params, core.getStartServices);
      },
    });
  }

  public start(core: CoreStart): void {
    // Register chat button in the bottom of the collapsible navigation
    core.chrome.navControls.registerLeftBottom({
      order: 1500,
      mount: (element: HTMLElement) => {
        ReactDOM.render(React.createElement(ChatButton), element);
        return () => ReactDOM.unmountComponentAtNode(element);
      },
    });
  }

  public stop() {}
}
