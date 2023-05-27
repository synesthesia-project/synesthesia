import { RGBA_TRANSPARENT } from '@synesthesia-project/compositor/lib/color';
import FillModule from '@synesthesia-project/compositor/lib/modules/fill';
import { TransitionModule } from '@synesthesia-project/compositor/lib/modules/transition';
import * as ld from '@synesthesia-project/light-desk';
import type {
  Input,
  InputContext,
  InputKind,
} from '@synesthesia-project/live-core/lib/plugins';
import type { OptionalKindAndConfig } from '@synesthesia-project/live-core/lib/config';

type InputSocket = Input<OptionalKindAndConfig>;

const TRANSITION_DURATION = 1;

export const createInputManager = () => {
  const inputKinds = new Map<string, InputKind<unknown>>();

  const inputKindListeners = new Set<() => void>();

  const createSocket = (
    context: Pick<InputContext<OptionalKindAndConfig>, 'saveConfig'>
  ): InputSocket => {
    let config: OptionalKindAndConfig = null;

    const module = new TransitionModule(new FillModule(RGBA_TRANSPARENT));

    const group = new ld.Group({ direction: 'vertical' });

    const createInputGroup = new ld.Group({ noBorder: true, wrap: true });

    const updateCreateInputButtons = () => {
      createInputGroup.removeAllChildren();
      for (const kind of inputKinds.values()) {
        const inputButton = new ld.Button(kind.kind);
        inputButton.addListener(() => setInputKind(kind));
        createInputGroup.addChild(inputButton);
      }
    };

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
          module.transition(
            new FillModule(RGBA_TRANSPARENT),
            TRANSITION_DURATION
          );
          // TODO: destroy only after transition out finished
          currentInput.input.destroy();
          group.removeAllChildren();
          currentInput = null;
        }
        if (!newConfig) {
          group.setTitle(`Create Input`);
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
            group.setTitle(kind.kind);
            const deleteButton = group.addChild(new ld.Button('Replace Input'));
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
                createInputSocket: createSocket,
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
