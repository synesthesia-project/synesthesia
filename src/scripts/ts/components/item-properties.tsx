import {BaseComponent} from "./base";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as func from "../data/functional";
import * as text from "../display/text";
import * as fileManipulation from "../data/file-manipulation";
import * as types from "../util/types";
import {DelayedPropigationInput} from "./util/input";

interface EventPropertiesProps {
  // Properties
  selection: selection.Selection;
  file: file.CueFile;
  // Callbacks
  updateCueFileAndSelection: types.Mutator<[file.CueFile, selection.Selection]>;
}

export class EventProperties extends BaseComponent<EventPropertiesProps, {}> {

  public constructor() {
    super();

    // Bind callbacks & event listeners
    this.onStartTimeChange = this.onStartTimeChange.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  private getEvent(e: {layer: number, index: number}) {
    return this.props.file.layers[e.layer].events[e.index];
  }

  private getEarliestStartTime(props: EventPropertiesProps) {
    const startTimes = props.selection.events.map(e => this.getEvent(e).timestampMillis);
    return Math.round(Math.min.apply(null, startTimes));
  }

  private onStartTimeChange(value: string) {
    this.props.updateCueFileAndSelection(([f, s]) => [
      fileManipulation.updateStartTimeForSelectedEvents(f, this.props.selection, Number(value)),
      s
    ]);
  }

  private onDelete() {
    this.props.updateCueFileAndSelection(([f, s]) => [
      fileManipulation.deleteSelectedEvents(f, s),
      selection.clearSelectedEvents(s)
    ]);
  }

  render() {
    const selectedEvents = this.props.selection.events.length;
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="styles/components/item-properties.css"/>
          {selectedEvents > 0 ?
            <div className="selection">{text.pluralize(selectedEvents, 'Item', 'Items')} Selected</div> :
            <div className="selection empty">Nothing Selected</div>
          }
          {selectedEvents > 0 ?
            <div className="properties">
              <div className="property">
                <label id="startTime" title="Start time in milliseconts">Start Time</label>
                <DelayedPropigationInput
                  for="startTime"
                  type="number"
                  value={String(this.getEarliestStartTime(this.props))}
                  onChange={this.onStartTimeChange}/>
              </div>
              <div className="property">
                <button onClick={this.onDelete}>Delete</button>
              </div>
            </div>
            : null
          }
        </div>
      </externals.ShadowDOM>
    );
  }
}
