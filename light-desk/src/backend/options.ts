export interface LightDeskOptions {
  /**
   * What path should be used to serve the light desk.
   * 
   * This is important if a express server will be used that serves other paths.
   */
  path: string;
}