import * as func from "../data/functional";
import {PlayState} from "../data/play-state";

import {Player} from "./player";


export interface StageProps {  }
export interface StageState {
  playState: PlayState;
}

export class Stage extends React.Component<StageProps, StageState> {

  private timerId: number;

  constructor(props: StageProps) {
    super(props);
    this.state = {
      playState: func.none()
    }

    // Bind callbacks & event listeners
    this.playStateUpdated = this.playStateUpdated.bind(this);
  }

  componentDidMount() {
    console.log("mounted");
  }

  componentWillUnmount() {
    console.log("unmounted");
  }

  playStateUpdated(state: PlayState) {
    this.state.playState = state;
    this.setState({
      playState: state
    });
    console.log("play state updated: ", state);
  }

  render() {
    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/stage.css"/>
          <div id="main">

          </div>
          <Player
            playState={this.state.playState}
            playStateUpdated={this.playStateUpdated}
            />
        </div>
      </externals.ShadowDOM>
    );
  }
}

export function setup() {
  ReactDOM.render(
    <Stage />,
    document.getElementById("root")
  );
}
