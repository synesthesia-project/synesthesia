import { styled, rectButton, buttonPressed } from './styling';
import { LayerItems } from './layer-items';
import { LayerVisualization } from './layer-visualization';
import * as React from 'react';
import * as file from '@synesthesia-project/core/lib/file';
import { Selection, toggleLayer } from '../data/selection';
import * as util from '@synesthesia-project/core/lib/util';
import * as stageState from '../data/stage-state';

import { MdKeyboard, MdSettings } from 'react-icons/md';

export interface LayerProps {
  // Properties
  className?: string;
  selection: Selection;
  file: file.CueFile;
  layer: file.AnyLayer;
  layerKey: number;
  zoom: stageState.ZoomPanState;
  positionMillis: number;
  bindingLayer: number | null;
  midiLayerBindings: { input: string; note: number; layer: number }[];
  selectionDraggingDiff: number | null;
  // Callbacks
  updateSelection: util.Mutator<Selection>;
  updateCueFile: util.Mutator<file.CueFile>;
  requestBindingForLayer: (layerKey: number | null) => void;
  updateSelectionDraggingDiff: (diffMillis: number | null) => void;
  openLayerOptions: (layerKey: number) => void;
}

const Layer: React.FunctionComponent<LayerProps> = ({
  className,
  selection,
  file,
  layer,
  layerKey,
  zoom,
  positionMillis,
  bindingLayer,
  midiLayerBindings,
  selectionDraggingDiff,
  updateSelection,
  updateCueFile,
  requestBindingForLayer,
  updateSelectionDraggingDiff,
  openLayerOptions,
}) => {
  const isSelected = () => selection.layers.indexOf(layerKey) >= 0;

  const isBinding = () => bindingLayer === layerKey;

  const toggleSelect = () => updateSelection((s) => toggleLayer(s, layerKey));

  const toggleRequestBind = () => {
    if (bindingLayer === layerKey) {
      requestBindingForLayer(null);
    } else {
      requestBindingForLayer(layerKey);
    }
  };

  const playerPosition = positionMillis / file.lengthMillis;
  const zoomMargin = stageState.relativeZoomMargins(zoom, playerPosition);
  let binding = '';
  midiLayerBindings.map((b) => {
    if (b.layer === layerKey) binding = b.note.toString();
  });

  return (
    <div className={className}>
      <div className="side">
        <span
          className={'button' + (isSelected() ? ' selected' : '')}
          title="Bind to Keyboard"
          onClick={toggleSelect}
        >
          <MdKeyboard />
        </span>
        <span className="column">
          <span
            className={'button' + (isBinding() ? ' selected' : '')}
            onClick={toggleRequestBind}
          >
            <span>MIDI{binding ? ': ' + binding : ''}</span>
          </span>
          <span
            className="button grow"
            title="Settings"
            onClick={() => openLayerOptions(layerKey)}
          >
            <MdSettings />
          </span>
        </span>
      </div>
      <LayerVisualization layer={layer} positionMillis={positionMillis} />
      <div className="timeline">
        <div className="timeline-selector" />
        <div
          className="timeline-zoom"
          style={{
            left: -zoomMargin.left * 100 + '%',
            right: -zoomMargin.right * 100 + '%',
          }}
        >
          <LayerItems
            {...{
              layerKey,
              selection,
              file,
              layer,
              selectionDraggingDiff,
              updateSelection,
              updateCueFile,
              updateSelectionDraggingDiff,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const layerBarHeightPx = 60;

const StyledLayer = styled(Layer)`
  box-sizing: border-box;
  display: block;
  height: ${layerBarHeightPx}px;
  border-bottom: 1px solid ${(p) => p.theme.borderLight};
  position: relative;

  > .side {
    box-sizing: border-box;
    background: ${(p) => p.theme.layerSideBg};
    display: flex;
    flex-direction: row;
    align-items: center;
    position: absolute;
    width: ${(p) => p.theme.layerSideColumnWidthPx}px;
    height: 100%;
    top: 0;
    left: 0;
    border-right: 1px solid ${(p) => p.theme.borderLight};

    > .button,
    .column > .button {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 -1px 0 0;
      height: 100%;
      ${rectButton}
      border-radius: 0;
      padding: 6px;
      font-size: 24px;

      > span {
        font-size: 12px;
      }

      &.selected {
        ${buttonPressed}
      }

      &:first-child {
        border-top: none;
      }
    }

    > .column {
      height: 100%;
      flex-grow: 1;
      display: flex;
      flex-direction: column;

      > .button {
        height: initial;
        width: 100%;
        margin-bottom: -1px;
        font-size: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        &.grow {
          flex-grow: 1;
        }
      }
    }
  }

  > .timeline {
    display: block;
    margin-left: ${(p) => p.theme.layerSideColumnWidthPx}px;
    margin-right: ${(p) => p.theme.visualizationWidthPx}px;
    height: 100%;
    position: relative;
    overflow: hidden;

    > .timeline-zoom {
      position: absolute;
      top: 0;
      bottom: 0;
    }
  }
`;

export { StyledLayer as Layer };
