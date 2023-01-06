export interface OverlaysManager {
  requestInput(
    title: string,
    message: string,
    label: string,
    defaultValue: string
  ): Promise<string>;
}

let overlaysManager: OverlaysManager | null = null;

export function overlays(): OverlaysManager {
  if (overlaysManager === null) throw new Error('Overlays Manager Not Set');
  return overlaysManager;
}

export function setOverlaysManager(manager: OverlaysManager) {
  overlaysManager = manager;
}
