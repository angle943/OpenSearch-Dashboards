/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export interface VizIframeProps {
  spec: string;
}

export const VizIframe = ({ spec }: VizIframeProps) => {
  const [start] = useState(Date.now());
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/vega@6"></script>
</head>
<body>
<div id="view"></div>
<div id="end"></div>
<script type="text/javascript">
  var view;
  var end;

  const spec = ${JSON.stringify(spec)};

  render(spec);

  function render(spec) {
    view = new vega.View(vega.parse(spec), {
      renderer:  'canvas',
      container: '#view',
      hover:     true
    });
    return view.runAsync().then(() => {end = Date.now(); document.getElementById('end').textContent = end;});
  }
</script>
</body>
</html>`;

  return (
    <>
      <iframe
        title="visChart2"
        src={`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`}
        height={374}
      />
    </>
  );
};
