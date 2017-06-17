import {BaseComponent} from './base';
import * as React from 'react';
import * as file from '../data/file';
import * as selection from '../data/selection';
import * as types from '../shared/util/types';

export interface LayerItemsProps {
  // Properties
  selection: selection.Selection;
  file: file.CueFile;
  layer: file.AnyLayer;
  layerKey: number;
  // Callbacks
  updateSelection: types.Mutator<selection.Selection>;
}

export class LayerItems extends BaseComponent<LayerItemsProps, {}> {

  constructor() {
    super();
  }

  public render() {
    // Items that are selected for this layer
    const selectedEvents = new Set(
      this.props.selection.events
      .filter(e => e.layer === this.props.layerKey)
      .map(e => e.index)
    );
    const items = this.props.layer.events.map((item, i) => {
      let length = 0;
      if (item.states.length !== 0) {
        // Get length of item by last state
        length = item.states[item.states.length - 1].millisDelta;
      } else if (file.isPercussionLayer(this.props.layer)) {
        // Get default length of items
        length = this.props.layer.settings.defaultLengthMillis;
      }
      const style: React.CSSProperties = {
        left: (item.timestampMillis / this.props.file.lengthMillis) * 100 + '%',
        width: (length / this.props.file.lengthMillis) * 100 + '%',
      };
      const onClick = (e: React.MouseEvent<{}>) => {
        this.props.updateSelection(s => selection.handleItemSelectionChange(s, e, this.props.layerKey, [i]));
      };
      return (
        <div
          key={i}
          className={'item' + (selectedEvents.has(i) ? ' selected' : '')}
          style={style}
          onClick={onClick} />
        );
    });
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/layer-items.css"/>
          {items}
        </div>
      </externals.ShadowDOM>
    );
  }

}
