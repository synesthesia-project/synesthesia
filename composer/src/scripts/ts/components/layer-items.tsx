import * as jQuery from 'jquery';
import { styled } from './styling';
import * as React from 'react';
import * as file from '@synesthesia-project/core/lib/file';
import {
  getEventDuration,
  shiftSelectedEvents,
} from '../data/file-manipulation';
import * as selection from '../data/selection';
import * as util from '@synesthesia-project/core/lib/util';
import * as dragging from './util/dragging';
import { ActiveModifierKeys } from '../util/input';

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

type LayerItemsSelector =
  | { state: 'nothing' }
  | { state: 'hover'; position: number }
  | { state: 'dragging'; start: number; end: number };

const LayerItems: React.FunctionComponent<LayerItemsProps> = (props) => {
  const timelineSelector = React.useRef<JQuery | null>(null);
  const [selector, setSelector] = React.useState<LayerItemsSelector>({
    state: 'nothing',
  });

  const getTimelineSelectorPosition = (
    timelineSelector: JQuery,
    pageX: number
  ) => {
    return (pageX - timelineSelector.offset().left) / timelineSelector.width();
  };

  const getTimelineSelectorMousePosition = (
    timelineSelector: JQuery,
    e: React.MouseEvent<HTMLDivElement>
  ) => getTimelineSelectorPosition(timelineSelector, e.pageX);

  const updateHoverState = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineSelector.current) return;
    const position = getTimelineSelectorMousePosition(
      timelineSelector.current,
      e
    );
    setSelector({ state: 'hover', position });
  };

  const onTimelineSelectorMouseOver = (e: React.MouseEvent<HTMLDivElement>) =>
    updateHoverState(e);

  const onTimelineSelectorMouseOut = () => {
    setSelector({ state: 'nothing' });
  };

  const onTimelineSelectorMouseMove = (e: React.MouseEvent<HTMLDivElement>) =>
    updateHoverState(e);

  const onTimelineSelectorMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineSelector.current) return;
    e.preventDefault();
    const start = getTimelineSelectorMousePosition(timelineSelector.current, e);
    setSelector({ state: 'dragging', start, end: start });

    dragging.captureDragging(
      (x) => {
        if (!timelineSelector.current) return;
        const end = getTimelineSelectorPosition(timelineSelector.current, x);
        setSelector({
          state: 'dragging',
          start: Math.min(start, end),
          end: Math.max(start, end),
        });
      },
      (x, _y, modifiers) => {
        if (!timelineSelector.current) return;
        const latestPosition = getTimelineSelectorPosition(
          timelineSelector.current,
          x
        );
        // Calculate the items that are within the selection
        const startTimestamp =
          Math.min(start, latestPosition) * props.file.lengthMillis;
        const endTimestamp =
          Math.max(start, latestPosition) * props.file.lengthMillis;
        const ids = props.layer.events
          // Wrap the index in with the item so that we can retain it during filtering
          .map((item, i) => ({ item, i }))
          // Filter to only the events that are within the selection
          .filter((i) => {
            const item = i.item;
            const duration = getEventDuration(props.layer, item);
            return (
              item.timestampMillis + duration > startTimestamp &&
              item.timestampMillis < endTimestamp
            );
          })
          // Map once again to extract the IDs of the events
          .map((item) => item.i);
        props.updateSelection((s) =>
          selection.handleItemSelectionChange(s, modifiers, props.layerKey, ids)
        );
        setSelector({ state: 'nothing' });
      },
      () => {
        setSelector({ state: 'nothing' });
      }
    );
  };

  const onSelectedEventMouseDown = (
    e: React.MouseEvent<unknown>,
    clickOnlyCallback: (modifiers: ActiveModifierKeys) => void
  ) => {
    if (!timelineSelector.current) return;
    const initX = e.pageX;
    const initPosition = getTimelineSelectorPosition(
      timelineSelector.current,
      initX
    );
    let locked = true;
    dragging.captureDragging(
      (x) => {
        // Unlock once dragged enough
        if (
          locked &&
          (x < initX - dragging.MIN_DRAG_THRESHOLD ||
            x > initX + dragging.MIN_DRAG_THRESHOLD)
        )
          locked = false;
        if (!locked && timelineSelector.current) {
          const position = getTimelineSelectorPosition(
            timelineSelector.current,
            x
          );
          const diffMillis =
            (position - initPosition) * props.file.lengthMillis;
          props.updateSelectionDraggingDiff(diffMillis);
        }
      },
      (x, _y, modifiers) => {
        if (locked) {
          clickOnlyCallback(modifiers);
        } else {
          if (timelineSelector.current) {
            const position = getTimelineSelectorPosition(
              timelineSelector.current,
              x
            );
            const diffMillis =
              (position - initPosition) * props.file.lengthMillis;
            props.updateCueFile((f) =>
              shiftSelectedEvents(f, props.selection, diffMillis)
            );
          }
        }
        props.updateSelectionDraggingDiff(null);
      },
      () => props.updateSelectionDraggingDiff(null),
      'move'
    );
  };

  // Items that are selected for this layer
  const selectedEvents = new Set(
    props.selection.events
      .filter((e) => e.layer === props.layerKey)
      .map((e) => e.index)
  );
  const extraItems: JSX.Element[] = [];
  const items = props.layer.events.map((item, i) => {
    let length = 0;
    if (item.states.length !== 0) {
      // Get length of item by last state
      length = item.states[item.states.length - 1].millisDelta;
    } else if (file.PERCUSSION_LAYER.is(props.layer)) {
      // Get default length of items
      length = props.layer.settings.defaultLengthMillis;
    }
    const selected = selectedEvents.has(i);
    const position = item.timestampMillis / props.file.lengthMillis;
    const style: React.CSSProperties = {
      left: position * 100 + '%',
      width: (length / props.file.lengthMillis) * 100 + '%',
    };
    let dragging = false;
    if (selected && props.selectionDraggingDiff !== null) {
      dragging = true;
      // Add overlay for moving selection
      const overlayPosition =
        (item.timestampMillis + props.selectionDraggingDiff) /
        props.file.lengthMillis;
      const overlayStyle = {
        left: overlayPosition * 100 + '%',
        width: style.width,
      };
      extraItems.push(
        <div
          key={extraItems.length}
          className="item overlay"
          style={overlayStyle}
        />
      );
    }
    const handleItemSelectionChange = (m: ActiveModifierKeys) =>
      props.updateSelection((s) =>
        selection.handleItemSelectionChange(s, m, props.layerKey, [i])
      );
    const onClick = (e: React.MouseEvent<unknown>) => {
      if (!selected) handleItemSelectionChange(e);
    };
    const onMouseDown = (e: React.MouseEvent<unknown>) => {
      if (selected)
        onSelectedEventMouseDown(
          e,
          // Only select / deselect item in selection if ctrl key is pressed
          (modifiers) => {
            if (modifiers.ctrlKey) handleItemSelectionChange(modifiers);
          }
        );
    };
    let inDraggingSelection = false;
    if (selector.state === 'dragging') {
      const endPosition = position + length / props.file.lengthMillis;
      if (endPosition > selector.start && position < selector.end)
        inDraggingSelection = true;
    }
    return (
      <div
        key={i}
        className={
          'item' +
          (selected ? ' selected' : '') +
          (dragging ? ' dragging' : '') +
          (inDraggingSelection ? ' active' : '')
        }
        style={style}
        onClick={onClick}
        onMouseDown={onMouseDown}
      />
    );
  });

  const selectorIndicator = (() => {
    const selectorState = selector;
    switch (selectorState.state) {
      case 'hover':
        return (
          <div
            className="indicator"
            style={{ left: selectorState.position * 100 + '%' }}
          >
            <div className="side left" />
          </div>
        );
      case 'dragging': {
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
      }
      case 'nothing':
      default:
        return null;
    }
  })();

  return (
    <div className={props.className}>
      <div
        className={
          'timeline-selector ' +
          (selector.state === 'dragging' ? ' dragging' : '')
        }
        ref={(div) => {
          timelineSelector.current = div ? jQuery(div) : null;
        }}
        onMouseEnter={onTimelineSelectorMouseOver}
        onMouseLeave={onTimelineSelectorMouseOut}
        onMouseMove={onTimelineSelectorMouseMove}
        onMouseDown={onTimelineSelectorMouseDown}
      >
        {selectorIndicator}
      </div>
      {items}
      {extraItems}
    </div>
  );
};

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

    &:hover,
    &.dragging {
      background: rgba(255, 255, 255, 0.05);
    }

    > .indicator {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 20%;
      background: rgba(${(p) => p.theme.hintRGB}, 0.2);

      > .side {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: ${(p) => p.theme.hint};

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
      background-color: rgba(204, 204, 204, 0.5);
    }

    &.selected {
      background-color: rgba(255, 255, 255, 0.7);
      cursor: move;
    }

    &.active {
      background-color: rgba(${(p) => p.theme.hintRGB}, 0.4);
      border-color: ${(p) => p.theme.hint};

      &.selected {
        background-color: rgba(${(p) => p.theme.hintRGB}, 0.8);
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    &.dragging {
      border-width: 0;
      background-color: rgba(102, 102, 102, 0.4);
    }

    &.overlay {
      background-color: rgba(${(p) => p.theme.hintRGB}, 0.4);
      border-color: ${(p) => p.theme.hint};
    }
  }
`;

export { StyledLayerItems as LayerItems };
