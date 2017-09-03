import {BaseComponent} from './base';
import * as React from 'react';
import * as file from '../shared/file/file';
import * as selection from '../data/selection';
import * as types from '../shared/util/types';
import * as dragging from './util/dragging';

export interface LayerItemsProps {
  // Properties
  selection: selection.Selection;
  file: file.CueFile;
  layer: file.AnyLayer;
  layerKey: number;
  // Callbacks
  updateSelection: types.Mutator<selection.Selection>;
}

export interface LayerItemsState {
  selector:
    {state: 'nothing'} |
    {state: 'hover', position: number} |
    {state: 'dragging', start: number, end: number};
}

export class LayerItems extends BaseComponent<LayerItemsProps, LayerItemsState> {

  private timelineSelector: JQuery | null = null;

  constructor() {
    super();
    this.state = {
      selector: {state: 'nothing'}
    };

    this.onTimelineSelectorMouseOver = this.onTimelineSelectorMouseOver.bind(this);
    this.onTimelineSelectorMouseOut = this.onTimelineSelectorMouseOut.bind(this);
    this.onTimelineSelectorMouseMove = this.onTimelineSelectorMouseMove.bind(this);
    this.onTimelineSelectorMouseDown = this.onTimelineSelectorMouseDown.bind(this);
  }

  private getTimelineSelectorPosition(timelineSelector: JQuery, pageX: number) {
    return (pageX - timelineSelector.offset().left) / timelineSelector.width();
  }

  private getTimelineSelectorMousePosition(timelineSelector: JQuery, e: React.MouseEvent<HTMLDivElement>) {
    return this.getTimelineSelectorPosition(timelineSelector, e.pageX);
  }

  private onTimelineSelectorMouseOver(e: React.MouseEvent<HTMLDivElement>) {
    this.updateHoverState(e);
  }

  private onTimelineSelectorMouseOut(e: React.MouseEvent<HTMLDivElement>) {
    this.setState({selector: {state: 'nothing'}});
  }

  private onTimelineSelectorMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    this.updateHoverState(e);
  }

  private onTimelineSelectorMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.timelineSelector) return;
    e.preventDefault();
    const start = this.getTimelineSelectorMousePosition(this.timelineSelector, e);
    this.setState({selector: {state: 'dragging', start, end: start}});
    dragging.captureDragging(
      (x, y) => {
        if (!this.timelineSelector) return;
        const end = this.getTimelineSelectorPosition(this.timelineSelector, x);
        this.setState({selector: {
          state: 'dragging',
          start: Math.min(start, end),
          end: Math.max(start, end)
        }});
      },
      (x, y, modifiers) => {
        // TODO: update selection
        this.props.updateSelection(s => selection.handleItemSelectionChange(s, modifiers, this.props.layerKey, []));
        this.setState({selector: {state: 'nothing'}});
      },
      (x, y) => {
        this.setState({selector: {state: 'nothing'}});
      }
    );
  }

  private updateHoverState(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.timelineSelector) return;
    const position = this.getTimelineSelectorMousePosition(this.timelineSelector, e);
    this.setState({selector: {state: 'hover', position}});
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
      const position = item.timestampMillis / this.props.file.lengthMillis;
      const style: React.CSSProperties = {
        left: position * 100 + '%',
        width: (length / this.props.file.lengthMillis) * 100 + '%',
      };
      const onClick = (e: React.MouseEvent<{}>) => {
        this.props.updateSelection(s => selection.handleItemSelectionChange(s, e, this.props.layerKey, [i]));
      };
      let inDraggingSelection = false;
      if (this.state.selector.state === 'dragging') {
        const endPosition = position + (length / this.props.file.lengthMillis);
        if (endPosition > this.state.selector.start && position < this.state.selector.end)
          inDraggingSelection = true;
      }
      return (
        <div
          key={i}
          className={
            'item' +
            (selectedEvents.has(i) ? ' selected' : '') +
            (inDraggingSelection ? ' active' : '')}
          style={style}
          onClick={onClick} />
        );
    });

    const selectorIndicator = (() => {
      const selectorState = this.state.selector;
      switch (selectorState.state) {
        case 'hover':
          return (
            <div className="indicator" style={{left: selectorState.position * 100 + '%'}}>
              <div className="side left" />
            </div>
          );
        case 'dragging':
          const style = {
            left: selectorState.start * 100 + '%',
            right: (1 - selectorState.end) * 100 + '%',
          };
          return (
            <div className="indicator" style={style}>
              <div className="side left" />
              <div className="side right" />
            </div>
          );
        case 'nothing':
        default:
          return null;
      }
    })();

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/layer-items.css"/>
          <div className={'timeline-selector ' + (this.state.selector.state === 'dragging' ? ' dragging' : '')}
            ref={div => this.timelineSelector = div ? $(div) : null}
            onMouseEnter={this.onTimelineSelectorMouseOver}
            onMouseLeave={this.onTimelineSelectorMouseOut}
            onMouseMove={this.onTimelineSelectorMouseMove}
            onMouseDown={this.onTimelineSelectorMouseDown}
            >
            {selectorIndicator}
          </div>
          {items}
        </div>
      </externals.ShadowDOM>
    );
  }

}
