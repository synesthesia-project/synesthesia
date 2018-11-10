import * as React from 'react';

import * as proto from '../../shared/proto';
import {styled} from './styling';

interface Props {
  className?: string;
  info: proto.LabelComponent;
}

class Label extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);
  }

  public render() {
    return (
      <div className={this.props.className}>
        {this.props.info.text}
      </div>
    );
  }
}

const StyledLabel = styled(Label)`

`;

export {StyledLabel as Label};
