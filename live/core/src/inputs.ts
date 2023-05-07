import { RGBA_BLACK } from '@synesthesia-project/compositor/lib/color';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import { TransitionModule } from '@synesthesia-project/compositor/lib/modules/transition';
import * as ld from '@synesthesia-project/light-desk';
import { Input, InputContext, InputKind } from './plugins';
import { OptionalKindAndConfig } from './config';

type InputSocket = Input<OptionalKindAndConfig>;

const TRANSITION_DURATION = 1;

export const createInputManager = () => {
  const inputKinds = new Map<string, InputKind<unknown>>();

  const inputKindListeners = new Set<() => void>();

  const createSocket = (
    context: Pick<InputContext<OptionalKindAndConfig>, 'saveConfig'>
  ): InputSocket => {
    let config: OptionalKindAndConfig = null;

    const module = new TransitionModule(new FillModule(RGBA_BLACK));

    const group = new ld.Group({ direction: 'vertical' });

    const createInputGroup = new ld.Group({ noBorder: true, wrap: true });

    const updateCreateInputButtons = () => {
      createInputGroup.removeAllChildren();
      createInputGroup.addChild(new ld.Label('Create Input'));
      for (const kind of inputKinds.values()) {
        const inputButton = new ld.Button(kind.kind);
        inputButton.addListener(() => setInputKind(kind));
        createInputGroup.addChild(inputButton);
      }
    };

    group.addChild(createInputGroup);

    const setInputKind = (kind: InputKind<unknown>) => {
      group.removeChild(createInputGroup);
      context.saveConfig({
        kind: kind.kind,
        config: kind.initialConfig,
      });
    };

    inputKindListeners.add(updateCreateInputButtons);
    updateCreateInputButtons();

    let currentInput: {
      kind: string;
      input: Input<unknown>;
    } | null = null;

    return {
      setConfig: (newConfig) => {
        config = newConfig;
        if (
          currentInput &&
          (!newConfig || currentInput.kind !== newConfig.kind)
        ) {
          // Disable existing input
          module.transition(new FillModule(RGBA_BLACK), TRANSITION_DURATION);
          // TODO: destroy only after transition out finished
          currentInput.input.destroy();
          group.removeAllChildren();
          currentInput = null;
        }
        if (!newConfig) {
          group.addChild(createInputGroup);
        } else {
          const kind = inputKinds.get(newConfig.kind);
          if (!kind) {
            throw new Error(`Unknown input kind: ${newConfig.kind}`);
          }
          // TODO: validate config type
          if (currentInput) {
            // Update existing input
            currentInput.input.setConfig(newConfig.config);
          } else {
            // Create header
            const header = new ld.Group({ noBorder: true });
            group.addChild(header);
            header.addChild(new ld.Label(kind.kind));
            const deleteButton = new ld.Button('Replace Input');
            header.addChild(deleteButton);
            deleteButton.addListener(() => context.saveConfig(null));
            // Create new input
            currentInput = {
              kind: kind.kind,
              input: kind.create({
                saveConfig: async (newConfig) => {
                  if (config?.kind === kind.kind) {
                    return context.saveConfig({
                      kind: kind.kind,
                      config: newConfig,
                    });
                  }
                },
                createInputSocket: createSocket
              }),
            };
            currentInput.input.setConfig(newConfig.config);
            group.addChild(currentInput.input.getLightDeskComponent());
            module.transition(
              currentInput.input.getModlue(),
              TRANSITION_DURATION
            );
          }
        }
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
