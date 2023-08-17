import type { Plugin } from '@synesthesia-project/live-core/lib/plugins';
import * as ld from '@synesthesia-project/light-desk';

export const BPM_PLUGIN: Plugin = {
  init: (context) => {
    let manualRecording: null | {
      firstBeat: number;
      count: number;
      commitTimeout: null | NodeJS.Timer;
    } = null;

    let beatInterval: null | NodeJS.Timer = null;

    const broadcastBeat = (durationMs: number) => {
      console.log('beat', durationMs);
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

    const commitManualBeat = () => {
      manualRecording = null;
    };

    const stop = () => {
      beatInterval && clearInterval(beatInterval);
      manualRecording = null;
    };

    const group = new ld.Group({ wrap: true });
    context.registerDeskComponent(group);

    group.setTitle('Beat');

    group.addChild(new ld.Button('Stop')).addListener(stop);
    group.addChild(new ld.Button('Beat')).addListener(recordManualBeat);
  },
};
