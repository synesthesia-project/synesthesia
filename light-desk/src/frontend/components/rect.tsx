import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

function colorToCss(color: proto.ColorJSON) {
  switch (color.type) {
    case 'rgb':
      return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
}

interface Props {
  className?: string;
  info: proto.RectComponent;
}

class Rect extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);
  }

  public render() {
    return (
      <div className={this.props.className} style={{ backgroundColor: colorToCss(this.props.info.color)}} />
    );
  }
}

const StyledRect = styled(Rect)`
  width: 30px;
  height: 30px;
  border-radius: 3px;
`;

export { StyledRect as Rect };
