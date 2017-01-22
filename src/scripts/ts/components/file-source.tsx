import * as func from "../data/functional";
import {PlayStateData, PlayState, PlayStateControls, MediaPaused, MediaPlaying} from "../data/play-state";

export interface FileSourceProps {
  playStateUpdated: (value: PlayState) => void;
}

export class FileSource extends React.Component<FileSourceProps, {}> {

  private controls: PlayStateControls;

  constructor() {
    super();

    // Initialise Controls
    this.controls = {
      toggle: () => {
        const audio = this.audioElement();
        if (audio.paused)
          audio.play()
        else
          audio.pause()
      }
    }

    // Bind callbacks & event listeners
    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.updatePlayState = this.updatePlayState.bind(this);
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/file-source.css"/>
          <input id="file_picker" type="file" onChange={this.loadAudioFile} />
          <label htmlFor="file_picker">Open Audio File</label>
          <audio id="audio"
            onCanPlay={this.updatePlayState}
            onPlaying={this.updatePlayState}
            onPause={this.updatePlayState}
            />
        </div>
      </externals.ShadowDOM>
    );
  }

  private $() {
    return $((ReactDOM.findDOMNode(this) as any).shadowRoot);
  }

  private fileInputElement() {
    return this.$().find('input').get(0) as HTMLInputElement;
  }

  private audioElement() {
    return this.$().find('audio').get(0) as HTMLAudioElement;
  }

  private loadAudioFile() {
    const file = this.fileInputElement().files[0];
    const audio = this.audioElement();
    audio.src = URL.createObjectURL(file);
    audio.playbackRate = 1;
  }

  /**
   * Update the play state from the audio element, and send it up.
   */
  private updatePlayState() {
    const audio = this.audioElement();
    const state: PlayStateData = {
      durationMillis: audio.duration * 1000,
      state: (
        audio.paused ?
        func.left<MediaPaused, MediaPlaying>({
          timeMillis: audio.currentTime * 1000
        }) :
        func.right<MediaPaused, MediaPlaying>({
          effectiveStartTimeMillis: new Date().getTime() - audio.currentTime * 1000
        })
      ),
      controls: this.controls
    };
    this.props.playStateUpdated(func.just(state));
  }
}
