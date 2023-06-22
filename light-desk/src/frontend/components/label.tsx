import * as React from 'react';
import styled from 'styled-components';

import * as proto from '../../shared/proto';

interface Props {
  className?: string;
  info: proto.LabelComponent;
}

class Label extends React.Component<Props, never> {
  public constructor(props: Props) {
    super(props);
  }

  public render() {
    return <div className={this.props.className}>{this.props.info.text}</div>;
  }
}

const StyledLabel = styled(Label)`
  font-weight: ${(p) => (p.info.style.bold ? 'bold' : 'normal')};
  white-space: nowrap;
`;

export { StyledLabel as Label };
