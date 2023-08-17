import type { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';
import { createEventEmitter } from '@synesthesia-project/live-core/lib/events';
import { z } from 'zod';
import { createAction } from '@synesthesia-project/live-core/lib/actions';

const BEAT_EVENT_EMITTER = createEventEmitter<{ periodMs: number }>('beat');
const STOP_BEAT_ACTION = createAction('beat.stop', z.unknown());
const RECORD_BEAT_ACTION = createAction('beat.record', z.unknown());

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

    group
      .addChild(new ld.Button('Stop'))
      .addListener(() => STOP_BEAT_ACTION.action.trigger(null));
    group
      .addChild(new ld.Button('Beat'))
      .addListener(() => RECORD_BEAT_ACTION.action.trigger(null));

    BEAT_EVENT_EMITTER.register.addEventListener(({ periodMs }) => {
      console.log('BEAT_EVENT_EMITTER', periodMs);
    });
  },
};
