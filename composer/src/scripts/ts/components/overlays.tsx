import * as React from 'react';

import {OverlaysManager, setOverlaysManager} from './util/overlays';

export class Overlays extends React.Component<{}, {}> implements OverlaysManager {

  public constructor() {
    super();
    setOverlaysManager(this);
  }

  public requestInput(title: string, message: string, label: string, defaultValue: string) {
    return new Promise<string> ((resolve, reject) => {
      const result = prompt(message, defaultValue);
      if (result)
        resolve(result);
      else
        reject(new Error('cancelled by user'));
    });
  }

  public render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/overlays.css"/>
        </div>
      </externals.ShadowDOM>
    );
  }
}
