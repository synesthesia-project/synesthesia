import {BaseComponent} from "./base";
import * as React from "react";
import * as file from "../data/file";
import * as selection from "../data/selection";
import * as func from "../data/functional";
import * as text from "../display/text";
import * as fileManipulation from "../data/file-manipulation";
import * as types from "../util/types";
import {KEYCODES} from "../util/input";

interface EventPropertiesProps {
  // Properties
  selection: selection.Selection;
  file: file.CueFile;
  // Callbacks
  updateCueFile: types.Mutator<file.CueFile>;
}

export class EventProperties extends BaseComponent<EventPropertiesProps, {}> {

  /* True when propigating the result of a user-triggered event upwards */
  private changing = false;

  private startTimeRef: HTMLInputElement;

  public constructor() {
    super();

    // Bind callbacks & event listeners
    this.onStartTimeKeyDown = this.onStartTimeKeyDown.bind(this);
    this.onStartTimeBlur = this.onStartTimeBlur.bind(this);
  }

  public componentWillReceiveProps(newProps: EventPropertiesProps) {
    if (this.startTimeRef && !this.changing){
      this.startTimeRef.value = String(this.getEarliestStartTime(newProps));
    }
  }

  private getEvent(e: {layer: number, index: number}) {
    return this.props.file.layers[e.layer].events[e.index];
  }

  private getEarliestStartTime(props: EventPropertiesProps) {
    const startTimes = props.selection.events.map(e => this.getEvent(e).timestampMillis);
    return Math.round(Math.min.apply(null, startTimes));
  }

  private onStartTimeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.keyCode === KEYCODES.ENTER) {
      e.preventDefault();
      e.stopPropagation();
      const val = Number(e.currentTarget.value);
      this.changing = true;
      this.props.updateCueFile(f => fileManipulation.updateStartTimeForSelection(f, this.props.selection, val));
      setTimeout(() => this.changing = false, 0);
    }
  }

  private onStartTimeBlur(e: React.FocusEvent<HTMLInputElement>) {
    const val = Number(e.currentTarget.value);
    this.changing = true;
    this.props.updateCueFile(f => fileManipulation.updateStartTimeForSelection(f, this.props.selection, val));
    setTimeout(() => this.changing = false, 0);
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
                <input
                  ref={i => this.startTimeRef = i}
                  htmlFor="startTime" type="number"
                  defaultValue={String(this.getEarliestStartTime(this.props))}
                  onKeyDown={this.onStartTimeKeyDown}
                  onBlur={this.onStartTimeBlur} />
              </div>
            </div>
            : null
          }
        </div>
      </externals.ShadowDOM>
    );
  }
}
