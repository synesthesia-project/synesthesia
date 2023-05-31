import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

function colorToCss(color: proto.ColorJSON) {
  switch (color.type) {
    case 'rgba':
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }
}

interface Props {
  className?: string;
  info: proto.RectComponent;
}

const Wrapper = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 3px;
  overflow: hidden;
`;

const Inner = styled.div`
  width: 100%;
  height: 100%;
`;

class Rect extends React.Component<Props, never> {
  public constructor(props: Props) {
    super(props);
  }

  public render() {
    return (
      <Wrapper className={this.props.className}>
        <Inner style={{ backgroundColor: colorToCss(this.props.info.color) }} />
      </Wrapper>
    );
  }
}

export { Rect };
