import * as React from 'react';

import * as proto from '../../shared/proto';

import {styled} from './styling';

interface Props {
  className?: string;
  info: proto.SliderComponent;
}

class Slider extends React.Component<Props, {}> {

  public constructor(props: Props) {
    super(props);
  }

  public render() {
    return (
      <div className={this.props.className}>
        slider
      </div>
    );
  }
}

const StyledSlider = styled(Slider)`

`;

export {StyledSlider as Slider};
