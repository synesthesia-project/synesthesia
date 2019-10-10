import * as React from 'react';
import {styled} from './styling';

import {OverlaysManager, setOverlaysManager} from './util/overlays';

interface OverlaysProps {
  className?: string;
  popup: {element: JSX.Element, dismiss: () => void} | null;
}

class Overlays extends React.Component<OverlaysProps, {}> implements OverlaysManager {

  public constructor(props: OverlaysProps) {
    super(props);
    setOverlaysManager(this);
  }

  public requestInput(_title: string, message: string, _label: string, defaultValue: string) {
    return new Promise<string> ((resolve, reject) => {
      const result = prompt(message, defaultValue);
      if (result)
        resolve(result);
      else
        reject(new Error('cancelled by user'));
    });
  }

  public render() {
    const showingOverlay = !!this.props.popup;
    const className = this.props.className + (showingOverlay ? ' showing-overlay' : '');
    return (
      <div className={className}>
        <div className="shadow" onClick={this.props.popup ? this.props.popup.dismiss : undefined} />
        <div className="inner">
          {this.props.popup ? this.props.popup.element : null}
        </div>
      </div>
    );
  }
}

const overlayPaddingPx = 60;

const StyledOverlays = styled(Overlays)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  pointer-events: none;

  > .shadow {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  > .inner {
    position: relative;
    margin: ${overlayPaddingPx}px;
  }

  &.showing-overlay {
    pointer-events: initial;

    > .shadow {
      background: rgba(0, 0, 0, 0.7);
    }
  }
`;

export {StyledOverlays as Overlays};
