
type BasicModeThreshold = 'never' | 'always' | number;

export class Thresholds {

  private _basicModeThresholdSeconds: BasicModeThreshold = 'never';

  public get basicModeThresholdSeconds() {
    return this._basicModeThresholdSeconds;
  }

  /**
   * How many seconds long does a song need to be for it not to be loaded in
   * `"basic"` mode instead of `"full"` mode.
   *
   * The normal mode of operation for `PreciseAudio` is to load and decode every
   * track in `full`, and keep it in memory while playing / paused. This is what
   * allows for accurate seeking, and for gapless playback.
   *
   * However, audio files can be very long, and for some files (e.g. files that
   * may be multiple hours long),
   * loading the entire track into memory is either infeasible,
   * or extremely inefficient.
   *
   * Rather than require you to use something other than `PreciseAudio` for
   * playing these tracks,
   * this property allows you to specify a threshold duration,
   * where any tracks longer than this duration will be played using a
   * [`HTMLAudioElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
   * instead.
   * This will effectively disable gapless playback,
   * and decrease the timing precision for these tracks,
   * however it does allow you to enqueue long tracks alongside shorter ones
   * that fall within this threshold.
   *
   * One of:
   *
   * * `"never"` - *(default)* Never use `basic` mode,
   *   always load and decode every track in `full`, regardless of duration.
   * * `"always"` - Always use `basic` mode, this will effectively disable
   *   gapless playback and decrease the timing precision for all tracks.
   * * a `number` - Detailing the minimum number of seconds long a track needs
   *   to be before it is loaded using `basic` mode.
   *
   * @param threshold The new value for `basicModeThresholdSeconds`
   */
  public set basicModeThresholdSeconds(threshold: BasicModeThreshold) {
    if (threshold === 'always' || threshold === 'never') {
      this._basicModeThresholdSeconds = threshold;
    } else if (typeof threshold === 'number') {
      this._basicModeThresholdSeconds = threshold <= 0 ? 'never' : threshold;
    } else {
      throw new Error(`Invalid value for basicModeThresholdSeconds: ${threshold}`);
    }
  }
  private _downloadThresholdSeconds = 10;

  public get downloadThresholdSeconds() {
    return this._downloadThresholdSeconds;
  }

  /**
   * How long before the current song ends will we start to
   * download the next track, and load it into RAM.
   *
   * More precisely, at what point before we run out of ready audio do we start
   * to download the next track. More than one track may need to be downloaded
   * and queued when the length of a track is less than this threshold.
   */
  public set downloadThresholdSeconds(threshold: number) {
    if (typeof threshold === 'number') {
      this._downloadThresholdSeconds = Math.max(0, threshold);
    } else {
      throw new Error(`Invalid value for downloadThresholdSeconds: ${threshold}`);
    }
  }

  private _decodeThresholdSeconds = 2;
  public get decodeThresholdSeconds() {
    return this._decodeThresholdSeconds;
  }

  /**
   * How long before the current song ends will we start to
   * decode (uncompress) the next track into PCM.
   *
   * This is usually a pretty quick process, but can take some time for longer
   * tracks. It's good to hold off doing this until later to save on RAM usage.
   */
  public set decodeThresholdSeconds(threshold: number) {
    if (typeof threshold === 'number') {
      this._decodeThresholdSeconds = Math.max(0, threshold);
    } else {
      throw new Error(`Invalid value for decodeThresholdSeconds: ${threshold}`);
    }
  }
}
