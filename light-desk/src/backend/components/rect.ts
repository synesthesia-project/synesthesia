import * as proto from '../../shared/proto';
import {
  RGBAColor,
  RGBA_TRANSPARENT,
} from '@synesthesia-project/compositor/lib/color';
import { IDMap } from '../util/id-map';

import { Base } from './base';

type InternalProps = {
  color: RGBAColor;
};

export type Props = Partial<InternalProps>;

const DEFAULT_PROPS: InternalProps = {
  color: RGBA_TRANSPARENT,
};

/**
 * A simple rectangle component. Could be used for example to indicate
 * certain states, or represent the color of certain lights or fixtures,
 * or perhaps colours used in a chase.
 */
export class Rect extends Base<InternalProps> {
  public constructor(props?: Props) {
    super(DEFAULT_PROPS, props);
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'rect',
      key: idMap.getId(this),
      color: {
        type: 'rgba',
        r: this.props.color.r,
        g: this.props.color.g,
        b: this.props.color.b,
        a: this.props.color.alpha,
      },
    };
  }

  public setColor(color: RGBAColor): Rect {
    this.updateProps({ color });
    return this;
  }
}
