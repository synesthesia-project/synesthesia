import { RGBA_TRANSPARENT } from '@synesthesia-project/compositor/lib/color';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import { TransitionModule } from '@synesthesia-project/compositor/lib/modules/transition';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContextGroupConfig,
  InputKind,
  InputSocket,
} from '@synesthesia-project/live-core/lib/plugins';
import type { OptionalKindAndConfig } from '@synesthesia-project/live-core/lib/config';
import { ConfigUpdater } from '@synesthesia-project/live-core/lib/util';

const TRANSITION_DURATION = 1;

export const createInputManager = () => {
  const inputKinds = new Map<string, InputKind<unknown>>();

  const inputKindListeners = new Set<() => void>();

  const createSocket = (context: {
    updateConfig: ConfigUpdater<OptionalKindAndConfig>;
    groupConfig?: InputContextGroupConfig;
  }): InputSocket => {
    let groupConfig: InputContextGroupConfig | null =
      context.groupConfig || null;
    let displayReplaceButton = false;

    const module = new TransitionModule(new FillModule(RGBA_TRANSPARENT));

    const group = new ld.Group({ direction: 'vertical' });

    const createInputGroup = new ld.Group({ noBorder: true, wrap: true });

    const updateCreateInputButtons = () => {
      createInputGroup.removeAllChildren();
      createInputGroup.addChild(new ld.Label({ text: 'Select Module:' }));
      for (const kind of inputKinds.values()) {
        const inputButton = new ld.Button({ text: kind.kind, icon: 'add' });
        inputButton.addListener('click', () => setInputKind(kind));
        createInputGroup.addChild(inputButton);
      }
    };

    const setInputKind = (kind: InputKind<unknown>) => {
      group.removeChild(createInputGroup);
      context.updateConfig(() => ({
        kind: kind.kind,
        config: kind.initialConfig,
      }));
    };

    inputKindListeners.add(updateCreateInputButtons);
    updateCreateInputButtons();

    let currentInput: {
      kind: string;
      input: Input<unknown>;
    } | null = null;

    const replaceButton = new ld.Button({ text: 'replace', icon: 'refresh' });
    replaceButton.addListener('click', () => context.updateConfig(() => null));

    const updateGroupDisplay = () => {
      group.removeAllHeaderButtons();
      if (displayReplaceButton) group.addHeaderButton(replaceButton);
      groupConfig?.additionalButtons?.map((b) => group.addHeaderButton(b));
      group.setTitle(groupConfig?.title?.text || '');
      group.setOptions({
        editableTitle: !!groupConfig?.title?.update,
        defaultCollapsibleState: 'auto',
      });
    };

    group.addListener('title-changed', (text) => {
      groupConfig?.title?.update?.(text);
    });

    updateGroupDisplay();

    return {
      applyConfig: (config, oldConfig) => {
        if (currentInput && (!config || currentInput.kind !== config.kind)) {
          // Disable existing input
          module.transition(
            new FillModule(RGBA_TRANSPARENT),
            TRANSITION_DURATION
          );
          // TODO: destroy only after transition out finished
          currentInput.input.destroy();
          group.removeAllChildren();
          displayReplaceButton = false;
          updateGroupDisplay();
          currentInput = null;
        }
        if (!config) {
          group.setLabels([]);
          group.addChild(createInputGroup);
        } else {
          const kind = inputKinds.get(config.kind);
          if (!kind) {
            throw new Error(`Unknown input kind: ${config.kind}`);
          }
          // TODO: validate config type
          if (currentInput) {
            // Update existing input
            currentInput.input.applyConfig(config.config, oldConfig?.config);
          } else {
            // Update header
            group.setLabels([{ text: kind.kind }]);
            displayReplaceButton = true;
            updateGroupDisplay();
            // Create new input
            currentInput = {
              kind: kind.kind,
              input: kind.create({
                updateConfig: async (update) =>
                  context.updateConfig((current) => ({
                    kind: kind.kind,
                    config: update(current?.config),
                  })),
                createInputSocket: createSocket,
              }),
            };
            currentInput.input.applyConfig(config.config, null);
            group.addChild(currentInput.input.getLightDeskComponent());
            module.transition(
              currentInput.input.getModlue(),
              TRANSITION_DURATION
            );
          }
        }
      },
      setGroupConfig: (newGroupConfig) => {
        groupConfig = newGroupConfig;
        updateGroupDisplay();
      },
      getLightDeskComponent: () => group,
      getModlue: () => module,
      destroy: () => {
        inputKindListeners.delete(updateCreateInputButtons);
        currentInput?.input.destroy();
      },
    };
  };

  const addInputKind = (kind: InputKind<unknown>) => {
    inputKinds.set(kind.kind, kind);
    inputKindListeners.forEach((l) => l());
  };

  return {
    addInputKind,
    createSocket,
  };
};
