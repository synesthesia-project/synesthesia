import type { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import { createEventEmitter } from '@synesthesia-project/live-core/lib/events';
import { z } from 'zod';
import { createAction } from '@synesthesia-project/live-core/lib/actions';
import { RGBAColor } from '@synesthesia-project/compositor/lib/color';

const BEAT_EVENT_EMITTER = createEventEmitter<{ periodMs: number }>('beat');
const STOP_BEAT_ACTION = createAction('beat.stop', z.unknown());
const RECORD_BEAT_ACTION = createAction('beat.record', z.unknown());

export const BEAT_EVENT = BEAT_EVENT_EMITTER.register;

let manualRecording: null | {
  firstBeat: number;
  count: number;
  commitTimeout: null | NodeJS.Timer;
} = null;

let beatInterval: null | NodeJS.Timer = null;

const broadcastBeat = (periodMs: number) => {
  BEAT_EVENT_EMITTER.emit({ periodMs });
};

const recordManualBeat = () => {
  beatInterval && clearInterval(beatInterval);
  if (!manualRecording) {
    manualRecording = {
      firstBeat: Date.now(),
      count: 0,
      commitTimeout: null,
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
};

STOP_BEAT_ACTION.addListener(stop);

export const BPM_PLUGIN: Plugin = {
  init: (context) => {
    context.registerEvent(BEAT_EVENT_EMITTER.register);
    context.registerAction(STOP_BEAT_ACTION.action);
    context.registerAction(RECORD_BEAT_ACTION.action);

    const group = new ld.Group({ wrap: true });
    context.registerDeskComponent(group);

    group.setTitle('Beat');

    const rect = group.addChild(new ld.Rect());

    group
      .addChild(new ld.Button({ text: 'Stop' }))
      .addListener('click', () => STOP_BEAT_ACTION.action.trigger(null));
    group
      .addChild(new ld.Button({ text: 'Beat' }))
      .addListener('click', () => RECORD_BEAT_ACTION.action.trigger(null));

    let rectFrameInterval: null | NodeJS.Timer = null;

    BEAT_EVENT_EMITTER.register.addEventListener(({ periodMs }) => {
      rectFrameInterval && clearInterval(rectFrameInterval);
      const beatStartMs = Date.now();

      const frame = () => {
        const v = Math.max(0, 1 - (Date.now() - beatStartMs) / periodMs);
        rect.setColor(new RGBAColor(255 * v, 255 * v, 255 * v, 1));
        if (v === 0) {
          rectFrameInterval && clearInterval(rectFrameInterval);
        }
      };

      rectFrameInterval = setInterval(frame, 20);
      frame();
    });
  },
};
