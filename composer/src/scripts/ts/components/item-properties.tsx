import { styled, rectButtonSmall, buttonDisabled, textInput } from './styling';
import * as React from 'react';
import * as file from '@synesthesia-project/core/lib/file';
import { Selection, clearSelectedEvents } from '../data/selection';
import * as text from '../display/text';
import * as fileManipulation from '../data/file-manipulation';
import * as util from '@synesthesia-project/core/lib/util';
import { DelayedPropigationInput } from './util/input';

import { MdDelete } from 'react-icons/md';

interface EventPropertiesProps {
  // Properties
  className?: string;
  selection: Selection;
  file: file.CueFile;
  // Callbacks
  updateCueFileAndSelection: util.Mutator<[file.CueFile, Selection]>;
}

const EventProperties: React.FunctionComponent<EventPropertiesProps> = ({
  className,
  selection,
  file,
  updateCueFileAndSelection,
}) => {
  const getEvent = (e: Selection['events'][number]) => {
    return file.layers[e.layer].events[e.index];
  };

  const getEarliestStartTime = () => {
    const startTimes = selection.events.map((e) => getEvent(e).timestampMillis);
    return Math.round(Math.min(...startTimes));
  };

  const getCommonDuration = () => {
    let commonDuration: number | null = null;
    for (const e of selection.events) {
      const eventDuration = (() => {
        const event = getEvent(e);
        if (event.states.length === 0) {
          // Get default duration for this layer
          const layer = file.layers[e.layer];
          if (layer.kind === 'percussion') {
            return layer.settings.defaultLengthMillis;
          } else {
            throw new Error('unable to determine length of event');
          }
        } else {
          return Math.max(...event.states.map((s) => s.millisDelta));
        }
      })();
      if (commonDuration === null) {
        commonDuration = eventDuration;
      } else if (commonDuration !== eventDuration) {
        // Durations differ, return null.
        return null;
      }
    }
    return commonDuration;
  };

  const onStartTimeChange = (value: string) => {
    updateCueFileAndSelection(([f, s]) => [
      fileManipulation.updateStartTimeForSelectedEvents(
        f,
        selection,
        Number(value)
      ),
      s,
    ]);
  };

  const onDurationChange = (value: string) => {
    updateCueFileAndSelection(([f, s]) => [
      fileManipulation.updateDurationForSelectedEvents(
        f,
        selection,
        Number(value)
      ),
      s,
    ]);
  };

  const onDelete = () => {
    updateCueFileAndSelection(([f, s]) => [
      fileManipulation.deleteSelectedEvents(f, s),
      clearSelectedEvents(s),
    ]);
  };

  const onSpread = () => {
    updateCueFileAndSelection(([f, s]) => [
      fileManipulation.distributeSelectedEvents(f, s),
      s,
    ]);
  };

  const selectedEvents = selection.events.length;
  return (
    <div className={className}>
      {selectedEvents > 0 ? (
        <div className="selection">
          {text.pluralize(selectedEvents, 'Item', 'Items')} Selected
        </div>
      ) : (
        <div className="selection empty">Nothing Selected</div>
      )}
      {selectedEvents > 0 ? (
        <div className="properties">
          <div className="property">
            <label htmlFor="startTime" title="Start time in milliseconds">
              Start Time
            </label>
            <DelayedPropigationInput
              id="startTime"
              type="number"
              value={`${getEarliestStartTime()}`}
              onChange={onStartTimeChange}
            />
          </div>
          <div className="property">
            <label htmlFor="duration">Event Duration</label>
            <DelayedPropigationInput
              id="duration"
              type="number"
              value={`${getCommonDuration()}`}
              onChange={onDurationChange}
            />
          </div>
          <div className="property">
            <button onClick={onDelete} title="Delete">
              <MdDelete />
            </button>
          </div>
          <div
            className="property"
            title="Distribute the selected items evenly"
          >
            <button
              className={selectedEvents === 1 ? 'disabled' : ''}
              onClick={onSpread}
            >
              DISTRIBUTE
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const itemPropertiesSpacingPx = 8;

const StyledEventProperties = styled(EventProperties)`
  border-top: 1px solid ${(p) => p.theme.borderLight};
  box-shadow: inset 0px 0px 8px 0px rgba(0, 0, 0, 0.3);

  > .selection {
    padding: ${itemPropertiesSpacingPx}px 0;
    margin: 0 ${itemPropertiesSpacingPx / 2}px;
    border-bottom: 1px solid ${(p) => p.theme.borderLighter};
    color: #666;
    text-align: center;

    &.empty {
      border: none;
    }
  }

  > .properties {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${itemPropertiesSpacingPx / 2}px 0;

    > .property {
      margin: ${itemPropertiesSpacingPx / 2}px ${itemPropertiesSpacingPx}px;

      label {
        margin: 0 ${(p) => p.theme.spacingPx}px 0 0;
        color: #888;
      }

      input {
        ${textInput}

        &[type=number] {
          width: 60px;
        }
      }

      button {
        outline: none;
        ${rectButtonSmall}

        &.disabled {
          ${buttonDisabled}
        }
      }
    }
  }
`;

export { StyledEventProperties as EventProperties };
