import * as React from 'react';
import { styled } from './styling';

interface OverlaysProps {
  className?: string;
  popup: { element: JSX.Element; dismiss: () => void } | null;
}

const Overlays: React.FunctionComponent<OverlaysProps> = ({
  className,
  popup,
}) => {
  const showingOverlay = !!popup;
  return (
    <div className={className + (showingOverlay ? ' showing-overlay' : '')}>
      <div className="shadow" onClick={popup ? popup.dismiss : undefined} />
      <div className="inner">{popup?.element}</div>
    </div>
  );
};

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

export { StyledOverlays as Overlays };
