export abstract class LEDStripBackend implements LEDStripBackend {

  private readonly readyListeners: (() => void)[] = [];
  private readonly disconnectedListeners: (() => void)[] = [];

  protected notifyReadyListeners() {
    this.readyListeners.map(l => l());
  }

  protected notifyDisconnectedListeners() {
    this.readyListeners.map(l => l());
  }

  public addReadyListener(l: () => void) {
    this.readyListeners.push(l);
  }

  public addDisconnectedListener(l: () => void) {
    this.disconnectedListeners.push(l);
  }

  /**
   * This should be called once per backend, before any calls to updateStrip()
   *
   * The buffer will have a single byte per colour per pixel, so an overall
   * number of bytes equal to 3n (n = number of pixels), where the sequence is
   * [r0, g0, b0, r1, g1, b1, ..., rn-1, gn-1, bn-1]
   */
  public abstract setupBuffer(buffer: Buffer): void;

  /**
   * Connect to the backend (if needed)
   */
  public abstract connect(): void;

  /**
   * Use the buffer previously sent via setupBuffer() to update the LEDs
   * display.
   */
  public abstract updateStrip(): void;
}
