import * as React from 'react';
import {styled} from './styling';

import {OverlaysManager, setOverlaysManager} from './util/overlays';

interface OverlaysProps {
  className?: string;
}

class Overlays extends React.Component<OverlaysProps, {}> implements OverlaysManager {

  public constructor(props: OverlaysProps) {
    super(props);
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
      <div className={this.props.className}>
      </div>
    );
  }
}

const StyledOverlays = styled(Overlays)``;

export {StyledOverlays as Overlays};
