import type { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import { createEventEmitter } from '@synesthesia-project/live-core/lib/events';
import { z } from 'zod';
import { createAction } from '@synesthesia-project/live-core/lib/actions';
import {
  RGBA_TRANSPARENT,
  RGBA_WHITE,
} from '@synesthesia-project/compositor/lib/color';

type BeatEvent = {
  periodMs: number;
  index: number;
  barSize: number;
  /** 0-index id of the beat within the bar */
  barIndex: number;
};

const BEAT_EVENT_EMITTER = createEventEmitter<BeatEvent>('beat');
const STOP_BEAT_ACTION = createAction('beat.stop', z.unknown());
const RECORD_BEAT_ACTION = createAction('beat.record', z.unknown());

export const BEAT_EVENT = BEAT_EVENT_EMITTER.register;

let barSize = 4;

let manualRecording: null | {
  firstBeat: number;
  count: number;
  commitTimeout: null | NodeJS.Timer;
} = null;

let lastBeat: null | {
  index: number;
} = null;

let beatInterval: null | NodeJS.Timer = null;

const broadcastBeat = (periodMs: number) => {
  if (lastBeat) {
    if (manualRecording) {
      // Calculate beat ID based on current timing information
      // (to avoid manual beats advancing id)
      const timeDiff = Date.now() - manualRecording.firstBeat;
      lastBeat.index = Math.round(timeDiff / periodMs);
    } else {
      lastBeat.index++;
    }
    const index = lastBeat.index;
    BEAT_EVENT_EMITTER.emit({
      barSize,
      index,
      barIndex: index % barSize,
      periodMs,
    });
  }
};

const recordManualBeat = () => {
  beatInterval && clearInterval(beatInterval);
  if (!manualRecording) {
    manualRecording = {
      firstBeat: Date.now(),
      count: 0,
      commitTimeout: null,
    };
    lastBeat = {
      index: 0,
    };
  } else {
    manualRecording.commitTimeout &&
      clearTimeout(manualRecording.commitTimeout);
    manualRecording.count++;
    const durationMs =
      (Date.now() - manualRecording.firstBeat) / manualRecording.count;
    broadcastBeat(durationMs);

    beatInterval = setInterval(() => broadcastBeat(durationMs), durationMs);
    manualRecording.commitTimeout = setTimeout(
      commitManualBeat,
      durationMs * 2
    );
  }
};
RECORD_BEAT_ACTION.addListener(recordManualBeat);

const commitManualBeat = () => {
  manualRecording = null;
};

const stop = () => {
  beatInterval && clearInterval(beatInterval);
  manualRecording = null;
  lastBeat = null;
};

STOP_BEAT_ACTION.addListener(stop);

export const BPM_PLUGIN: Plugin = {
  init: (context) => {
    context.registerEvent(BEAT_EVENT_EMITTER.register);
    context.registerAction(STOP_BEAT_ACTION.action);
    context.registerAction(RECORD_BEAT_ACTION.action);

    const group = new ld.Group({ wrap: true, title: 'Beat' });
    context.registerDeskComponent(group);

    const rectsGroup = group.addChild(new ld.Group({ noBorder: true }));
    const rects: ld.Rect[] = [];

    const updateRectsFromBarSize = () => {
      if (rects.length !== barSize) {
        rectsGroup.removeAllChildren();
        // Add missing children
        for (let i = rects.length; i < barSize; i++) {
          rects.push(new ld.Rect());
        }
        // Remove extra children
        rects.splice(barSize, rects.length - barSize);
        // Add to light-desk
        rectsGroup.addChildren(...rects);
      }
    };

    updateRectsFromBarSize();

    group
      .addChild(new ld.Button({ text: 'Stop' }))
      .addListener('click', () => STOP_BEAT_ACTION.action.trigger(null));
    group
      .addChild(new ld.Button({ text: 'Beat' }))
      .addListener('click', () => RECORD_BEAT_ACTION.action.trigger(null));

    group
      .addChild(
        new ld.SliderButton({
          value: barSize,
          min: 1,
          max: 64,
          step: 1,
          mode: 'writeBack',
        })
      )
      .addListener('change', (value) => {
        barSize = value;
        updateRectsFromBarSize();
      });

    BEAT_EVENT_EMITTER.register.addEventListener(({ barIndex }) => {
      rects.map((r, i) =>
        r.setColor(i === barIndex ? RGBA_WHITE : RGBA_TRANSPARENT)
      );
    });
  },
};
