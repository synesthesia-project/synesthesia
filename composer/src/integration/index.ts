/**
 * The Integration module is for serving composer as part of a Node.js
 * application, and connecting its functionality over websockets.
 */

import * as path from 'path';

import { IntegrationSettings } from './shared';

const DIST = path.dirname(__dirname);

console.log(DIST);

export const STATIC_FILES: {
  url: string;
  path: string;
  contentType: string;
}[] = [
  {
    url: '/bundle.js',
    path: path.join(DIST, 'bundle.js'),
    contentType: 'text/javascript',
  },
  {
    url: '/bundle.js.map',
    path: path.join(DIST, 'bundle.js.map'),
    contentType: 'application/octet-stream',
  },
  {
    url: '/styles/main.css',
    path: path.join(DIST, 'styles/main.css'),
    contentType: 'text/css',
  },
];

export function getIndexHtml(settings: IntegrationSettings) {
  return `
     <!DOCTYPE html>
    <html>
    <head>
        <title>Synesthesia Composer</title>
        <link rel="stylesheet" type="text/css" href="styles/main.css" />
    </head>
    <body>
        <div id="root"></div>
        <script>
            window.integrationSettings = ${JSON.stringify(settings)};
        </script>
        <script src="bundle.js"></script>
    </body>
    </html>
     `;
}
