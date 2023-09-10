import * as proto from '../../shared/proto';
import { LabelComponentStyle } from '../../shared/styles';
import { IDMap } from '../util/id-map';

import { Base } from './base';

type InternalProps = LabelComponentStyle & {
  text: string | null;
};

export type Props = InternalProps;

/**
 * A simple text component. Could be used to label components in a desk, or for
 * more dynamic purposes such as displaying the status of something.
 *
 * ![](media://images/label_screenshot.png)
 */
export class Label extends Base<InternalProps> {
  public constructor(props?: Props) {
    super({ text: null }, props);
  }

  /** @hidden */
  public getProtoInfo(idMap: IDMap): proto.Component {
    return {
      component: 'label',
      key: idMap.getId(this),
      style: {
        bold: this.props.bold,
      },
      text: this.props.text ?? '',
    };
  }

  public setText(text: string): Label {
    this.updateProps({
      text,
    });
    return this;
  }
}
