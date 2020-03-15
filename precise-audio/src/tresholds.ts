export interface Thresholds {
  /**
   * How many seconds long does a song need to be for it not to be loaded in
   * "basic" mode instead of "full" mode.
   */
  basicModeThresholdSeconds: number;
  /**
   * How long before the current song ends will we start to
   * download the next track, and load it into RAM.
   *
   * More precisely, at what point before we run out of ready audio do we start
   * to download the next track. More than one track may need to be downloaded
   * and queued when the length of a track is less than this threshold.
   */
  downloadThresholdSeconds: number;
  /**
   * How long before the current song ends will we start to
   * decode (uncompress) the next track into PCM.
   *
   * This is usually a pretty quick process, but can take some time for longer
   * tracks. It's good to hold off doing this until later to save on RAM usage.
   */
  decodeThresholdSeconds: number;
}
