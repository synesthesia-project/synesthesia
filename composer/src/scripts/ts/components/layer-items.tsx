import * as jQuery from 'jquery';
import {styled} from './styling';
import * as React from 'react';
import * as file from '@synesthesia-project/core/lib/file';
import {getEventDuration, shiftSelectedEvents} from '../data/file-manipulation';
import * as selection from '../data/selection';
import * as util from '@synesthesia-project/core/lib/util';
import * as dragging from './util/dragging';
import {ActiveModifierKeys} from '../util/input';

export interface LayerItemsProps {
  // Properties
  className?: string;
  selection: selection.Selection;
  file: file.CueFile;
  layer: file.AnyLayer;
  layerKey: number;
  selectionDraggingDiff: number | null;
  // Callbacks
  updateSelection: util.Mutator<selection.Selection>;
  updateCueFile: util.Mutator<file.CueFile>;
  updateSelectionDraggingDiff: (diffMillis: number | null) => void;
}

export interface LayerItemsState {
  selector:
    {state: 'nothing'} |
    {state: 'hover', position: number} |
    {state: 'dragging', start: number, end: number};
}

class LayerItems extends React.Component<LayerItemsProps, LayerItemsState> {

  private timelineSelector: JQuery | null = null;

  constructor(props: LayerItemsProps) {
    super(props);
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

  private onTimelineSelectorMouseOut() {
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
      (x) => {
        if (!this.timelineSelector) return;
        const end = this.getTimelineSelectorPosition(this.timelineSelector, x);
        this.setState({selector: {
          state: 'dragging',
          start: Math.min(start, end),
          end: Math.max(start, end)
        }});
      },
      (x, _y, modifiers) => {
        if (!this.timelineSelector) return;
        const latestPosition = this.getTimelineSelectorPosition(this.timelineSelector, x);
        // Calculate the items that are within the selection
        const startTimestamp = Math.min(start, latestPosition) * this.props.file.lengthMillis;
        const endTimestamp = Math.max(start, latestPosition) * this.props.file.lengthMillis;
        const ids = this.props.layer.events
          // Wrap the index in with the item so that we can retain it during filtering
          .map((item, i) => ({item, i}))
          // Filter to only the events that are within the selection
          .filter(i => {
            const item = i.item;
            const duration = getEventDuration(this.props.layer, item);
            return (item.timestampMillis + duration) > startTimestamp && item.timestampMillis < endTimestamp;
          })
          // Map once again to extract the IDs of the events
          .map((item) => item.i);
        this.props.updateSelection(s => selection.handleItemSelectionChange(s, modifiers, this.props.layerKey, ids));
        this.setState({selector: {state: 'nothing'}});
      },
      () => {
        this.setState({selector: {state: 'nothing'}});
      }
    );
  }

  private updateHoverState(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.timelineSelector) return;
    const position = this.getTimelineSelectorMousePosition(this.timelineSelector, e);
    this.setState({selector: {state: 'hover', position}});
  }

  private onSelectedEventMouseDown(
      e: React.MouseEvent<{}>,
      clickOnlyCallback: (modifiers: ActiveModifierKeys) => void) {
    if (!this.timelineSelector) return;
    const initX = e.pageX;
    const initPosition = this.getTimelineSelectorPosition(this.timelineSelector, initX);
    let locked = true;
    dragging.captureDragging(
      (x) => {
        // Unlock once dragged enough
        if (locked &&
          (x < initX - dragging.MIN_DRAG_THRESHOLD || x > initX + dragging.MIN_DRAG_THRESHOLD))
          locked = false;
        if (!locked && this.timelineSelector) {
          const position = this.getTimelineSelectorPosition(this.timelineSelector, x);
          const diffMillis = (position - initPosition) * this.props.file.lengthMillis;
          this.props.updateSelectionDraggingDiff(diffMillis);
        }
      },
      (x, _y, modifiers) => {
        if (locked) {
          clickOnlyCallback(modifiers);
        } else {
          if (this.timelineSelector) {
            const position = this.getTimelineSelectorPosition(this.timelineSelector, x);
            const diffMillis = (position - initPosition) * this.props.file.lengthMillis;
            this.props.updateCueFile(f => shiftSelectedEvents(f, this.props.selection, diffMillis));
          }
        }
        this.props.updateSelectionDraggingDiff(null);
      },
      () => this.props.updateSelectionDraggingDiff(null),
      'move'
    );
  }

  public render() {
    // Items that are selected for this layer
    const selectedEvents = new Set(
      this.props.selection.events
      .filter(e => e.layer === this.props.layerKey)
      .map(e => e.index)
    );
    const extraItems: JSX.Element[] = [];
    const items = this.props.layer.events.map((item, i) => {
      let length = 0;
      if (item.states.length !== 0) {
        // Get length of item by last state
        length = item.states[item.states.length - 1].millisDelta;
      } else if (file.isPercussionLayer(this.props.layer)) {
        // Get default length of items
        length = this.props.layer.settings.defaultLengthMillis;
      }
      const selected = selectedEvents.has(i);
      const position = item.timestampMillis / this.props.file.lengthMillis;
      const style: React.CSSProperties = {
        left: position * 100 + '%',
        width: (length / this.props.file.lengthMillis) * 100 + '%',
      };
      let dragging = false;
      if (selected && this.props.selectionDraggingDiff !== null) {
        dragging = true;
        // Add overlay for moving selection
        const overlayPosition = (item.timestampMillis + this.props.selectionDraggingDiff) /
          this.props.file.lengthMillis;
        const overlayStyle = {
          left: overlayPosition * 100 + '%',
          width: style.width
        };
        extraItems.push(
          <div
            key={extraItems.length}
            className="item overlay"
            style={overlayStyle} />
        );
      }
      const handleItemSelectionChange = (m: ActiveModifierKeys) =>
        this.props.updateSelection(s =>
          selection.handleItemSelectionChange(s, m, this.props.layerKey, [i]));
      const onClick = (e: React.MouseEvent<{}>) => {
        if (!selected)
          handleItemSelectionChange(e);
      };
      const onMouseDown = (e: React.MouseEvent<{}>) => {
        if (selected)
          this.onSelectedEventMouseDown(
            e,
            // Only select / deselect item in selection if ctrl key is pressed
            modifiers => {
              if (modifiers.ctrlKey) handleItemSelectionChange(modifiers);
            }
        );
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
            (selected ? ' selected' : '') +
            (dragging ? ' dragging' : '') +
            (inDraggingSelection ? ' active' : '')}
          style={style}
          onClick={onClick}
          onMouseDown={onMouseDown}/>
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
      <div className={this.props.className}>
        <div className={'timeline-selector ' + (this.state.selector.state === 'dragging' ? ' dragging' : '')}
          ref={div => this.timelineSelector = div ? jQuery(div) : null}
          onMouseEnter={this.onTimelineSelectorMouseOver}
          onMouseLeave={this.onTimelineSelectorMouseOut}
          onMouseMove={this.onTimelineSelectorMouseMove}
          onMouseDown={this.onTimelineSelectorMouseDown}
          >
          {selectorIndicator}
        </div>
        {items}
        {extraItems}
      </div>
    );
  }

}

const StyledLayerItems = styled(LayerItems)`
  display: block;
  height: 100%;
  width: 100%;

  > .timeline-selector {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    cursor: pointer;
    background: rgba(255, 255, 255, 0);
    transition: background 0.2s;

    &:hover, &.dragging {
      background: rgba(255, 255, 255, 0.05);
    }

    > .indicator {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 20%;
      background: rgba(${p => p.theme.hintRGB}, 0.2);

      > .side {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: ${p => p.theme.hint};

        &.left {
          left: -1px;
        }

        &.right {
          right: -1px;
        }
      }
    }
  }

  > .item {
    position: absolute;
    top: 0;
    margin-left: -1px;
    width: 1px;
    height: calc(100% - 2px);
    background-color: rgba(102, 102, 102, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.4);
    cursor: pointer;

    &:hover {
      background-color:  rgba(204, 204, 204, 0.5);
    }

    &.selected {
      background-color: rgba(255, 255, 255, 0.7);
      cursor: move;
    }

    &.active {
      background-color: rgba(${p => p.theme.hintRGB}, 0.4);
      border-color: ${p => p.theme.hint};

      &.selected {
        background-color: rgba(${p => p.theme.hintRGB}, 0.8);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    &.dragging {
      border-width: 0;
      background-color: rgba(102, 102, 102, 0.4);
    }

    &.overlay {
      background-color: rgba(${p => p.theme.hintRGB}, 0.4);
      border-color: ${p => p.theme.hint};
    }
  }
`;

export {StyledLayerItems as LayerItems};
