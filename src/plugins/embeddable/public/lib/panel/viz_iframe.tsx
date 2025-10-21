/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export interface VizIframeProps {
  vegaParser: any; // VegaParser instance with populated data
  width?: number;
  height?: number;
}

export const VizIframe = ({ vegaParser, width = 500, height = 500 }: VizIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from our specific iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      // For data URLs, origin will be 'null', so we need to check that
      if (event.origin !== 'null' && event.origin !== window.location.origin) {
        return;
      }

      // Handle different message types
      if (typeof event.data === 'object' && event.data.type) {
        switch (event.data.type) {
          case 'RENDER_SUCCESS':
            console.log('Vega chart rendered successfully');
            break;
          case 'RENDER_ERROR':
            console.error('Vega chart render error:', event.data.error);
            break;
          case 'CHART_READY':
            console.log('Chart is ready');
            break;
          default:
            console.log('Unknown message type:', event.data);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Prepare the processed spec with populated data
  const processedSpec = vegaParser.spec;

  // Get the actual container dimensions or use defaults
  const actualWidth = width || 500;
  const actualHeight = height || 500;

  // Create HTML content with populated Vega spec
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/vega@6"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-lite@6"></script>
  <script src="https://cdn.jsdelivr.net/npm/vega-embed@7"></script>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #view {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="view"></div>
  <script type="text/javascript">
    var view;

    // Use the processed spec with populated data
    const processedSpec = ${JSON.stringify(processedSpec)};

    // Apply container dimensions if not set in spec
    if (!processedSpec.width) {
      processedSpec.width = ${actualWidth - 20}; // Account for padding
    }
    if (!processedSpec.height) {
      processedSpec.height = ${actualHeight - 20}; // Account for padding
    }

    // Determine if this is Vega-Lite or Vega
    const isVegaLite = ${vegaParser.isVegaLite || false};

    try {
      if (isVegaLite) {
        // Use Vega-Lite
        vegaEmbed('#view', processedSpec, {
          renderer: 'canvas',
          actions: false
        }).then(result => {
          view = result.view;
          window.parent.postMessage({
            type: 'RENDER_SUCCESS',
            timestamp: Date.now()
          }, '*');
        }).catch(error => {
          window.parent.postMessage({
            type: 'RENDER_ERROR',
            error: error.message,
            timestamp: Date.now()
          }, '*');
        });
      } else {
        // Use Vega
        view = new vega.View(vega.parse(processedSpec), {
          renderer: 'canvas',
          container: '#view',
          hover: true,
          logLevel: vega.Warn
        });

        view.runAsync().then(() => {
          window.parent.postMessage({
            type: 'RENDER_SUCCESS',
            timestamp: Date.now()
          }, '*');
        }).catch(error => {
          window.parent.postMessage({
            type: 'RENDER_ERROR',
            error: error.message,
            timestamp: Date.now()
          }, '*');
        });
      }

      // Send ready message
      window.parent.postMessage({
        type: 'CHART_READY',
        timestamp: Date.now()
      }, '*');

    } catch (e) {
      window.parent.postMessage({
        type: 'RENDER_ERROR',
        error: e.message,
        timestamp: Date.now()
      }, '*');
    }
  </script>
</body>
</html>`;

  return (
    <iframe
      ref={iframeRef}
      title="Vega Visualization"
      src={`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`}
      width={actualWidth}
      height={actualHeight}
      style={{ border: 'none' }}
    />
  );
};
