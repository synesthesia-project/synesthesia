export class Player extends React.Component<{}, {}> {

  constructor() {
    super();

    // Bind event listeners
    this.loadAudioFile = this.loadAudioFile.bind(this);
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/player.css"/>
          <input id="file_picker" type="file" onChange={this.loadAudioFile} />
          <audio id="audio" controls />
        </div>
      </externals.ShadowDOM>
    );
  }

  private $() {
    return $(ReactDOM.findDOMNode(this));
  }

  private fileInputElement() {
    return this.$().find('input').get(0) as HTMLInputElement;
  }

  private audioElement() {
    return this.$().find('audio').get(0) as HTMLAudioElement;
  }

  private loadAudioFile() {
    console.log("loadAudioFile", this.fileInputElement(), this.audioElement());

    const file = this.fileInputElement().files[0];
    console.debug('file', file);
    const audio = this.audioElement();
    audio.src = URL.createObjectURL(file);
    audio.playbackRate = 1;
  }
}
