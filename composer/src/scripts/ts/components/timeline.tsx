import * as jQuery from 'jquery';
import {styled, rectIconButton, P, buttonPressed} from './styling';
import * as React from 'react';

import * as playState from '../data/play-state';
import * as stageState from '../data/stage-state';
import * as file from '@synesthesia-project/core/lib/file';
import * as fileManipulation from '../data/file-manipulation';
import * as util from '@synesthesia-project/core/lib/util';

import {MdAdd, MdLock, MdLockOpen} from 'react-icons/md';

export interface TimelineState {
}

export interface TimelineProps {
  // Properties
  className?: string;
  file: file.CueFile;
  playState: playState.PlayState;
  zoom: stageState.ZoomPanState;
  positionMillis: number;
  mousePosition: number | null;
  // Callbacks
  timelineRef: (ref: HTMLDivElement | null) => void;
  updateCueFile: util.Mutator<file.CueFile>;
  updateMouseHover: (pos: number | null) => void;
  toggleZoomPanLock: () => void;
}

class Timeline extends React.Component<TimelineProps, TimelineState> {

  constructor(props: TimelineProps) {
    super(props);

    // Bind callbacks & event listeners
    this.addLayerClicked = this.addLayerClicked.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseEnterOrMove = this.mouseEnterOrMove.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
  }

  public render() {
    const playerPosition = this.props.positionMillis / this.props.file.lengthMillis;

    const zoomMargin = stageState.relativeZoomMargins(this.props.zoom, playerPosition);

    return (
      <div className={this.props.className}>
        <div className="side left">
          <span className="button" onClick={this.addLayerClicked}><MdAdd /></span>
          <span
            className={`button ${this.props.zoom.type === 'locked' ? 'pressed' : ''}`}
            onClick={this.props.toggleZoomPanLock}
            title="Lock scrolling to cursor">
            {this.props.zoom.type === 'locked' ? <MdLock /> : <MdLockOpen/>}
          </span>
        </div>
        <div className="side right" />
        <div className="timeline" ref={t => this.props.timelineRef(t)}>
          <div className="timeline-zoom" style={{
              left: (- zoomMargin.left * 100) + '%',
              right: (- zoomMargin.right * 100) + '%'
            }}
            onMouseDown={this.mouseDown}
            onMouseEnter={this.mouseEnterOrMove}
            onMouseMove={this.mouseEnterOrMove}
            onMouseLeave={this.mouseLeave}
            >
            <div className="marker player-position" style={{left: playerPosition * 100 + '%'}}/>
            {this.props.mousePosition !== null &&
              <div className="marker mouse" style={{ left: this.props.mousePosition * 100 + '%'}}/>
            }
          </div>
        </div>
      </div>
    );
  }

  private addLayerClicked() {
    this.props.updateCueFile(cueFile => fileManipulation.addLayer(cueFile));
  }

  /**
   * Get the position of the mouse within the file (0-1);
   */
  private getMousePosition(e: React.MouseEvent<{}>) {
    const $timelineZoom = jQuery(e.currentTarget);
    const pos = (e.pageX - $timelineZoom.offset().left) / $timelineZoom.width();
    return util.restrict(pos, 0, 1);
  }

  /*
   * Jump to this position
   */
  private mouseDown(e: React.MouseEvent<{}>) {
    const pos = this.getMousePosition(e);
    if (this.props.playState)
      this.props.playState.controls.goToTime(this.props.playState.durationMillis * pos);
  }

  private mouseEnterOrMove(e: React.MouseEvent<{}>) {
    this.props.updateMouseHover(this.getMousePosition(e));
  }

  private mouseLeave(_e: React.MouseEvent<{}>) {
    this.props.updateMouseHover(null);
  }

}

const timelineHeightPx = 40;
const buttonHeightPx = (p: P) => timelineHeightPx - 2 * p.theme.spacingPx;

const StyledTimeline = styled(Timeline)`
  display: block;
  position: relative;
  background: ${p => p.theme.layerSideBg};
  height: ${timelineHeightPx}px;
  border-top: 1px solid ${p => p.theme.borderLight};
  box-shadow: 0px -1px 8px 0px rgba(0,0,0,0.3);

  > .side {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    padding: 0 ${p => p.theme.spacingPx}px;
    background: ${p => p.theme.layerSideBg};
    position: absolute;
    height: 100%;
    top: 0;

    &.left {
      left: 0;
      width: ${p => p.theme.layerSideColumnWidthPx}px;
      border-right: 1px solid ${p => p.theme.borderLight};

      > .button {
        display: block;
        height: ${buttonHeightPx}px;
        width: ${buttonHeightPx}px;
        ${rectIconButton}
        margin-right: ${p => p.theme.spacingPx}px;

        &.pressed {
          ${buttonPressed}
        }
      }
    }

    &.right {
      right: 0;
      width: ${p => p.theme.visualizationWidthPx}px;
      border-left: 1px solid ${p => p.theme.borderLight};
    }
  }

  > .timeline {
    display: block;
    margin-left: ${p => p.theme.layerSideColumnWidthPx}px;
    margin-right: ${p => p.theme.visualizationWidthPx}px;
    height: 100%;
    position: relative;
    overflow: hidden;

    > .timeline-zoom {
      position: absolute;
      top: 0;
      bottom: 0;
      cursor: pointer;

      > .marker {
        position: absolute;
        height: 100%;
        width: 3px;
        margin-left: -1px;

        &.player-position {
          background-color: #fff;
        }

        &.mouse {
          background-color: rgba(255, 255, 255, 0.6);
        }
      }
    }
  }
`;

export {StyledTimeline as Timeline};
