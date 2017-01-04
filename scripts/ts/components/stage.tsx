import {Player} from "./player";

export interface StageProps {  }
export interface StageState {
  random: number;
}

export class Stage extends React.Component<StageProps, StageState> {

  private timerId: number;

  constructor(props: StageProps) {
    super(props);
    this.state = {
      random: 0
    }
  }

  componentDidMount() {
    console.log("mounted");
  }

  componentWillUnmount() {
    console.log("unmounted");
  }

  render() {
    const style = `
      h1 {
        color: green;
      }
    `;

    return (
      <externals.ShadowDOM>
        <div>
          <link rel="stylesheet" type="text/css" href="dist/styles/components/stage.css"/>
          <style type="text/css">{style}</style>
          <h1>Hello!</h1>
          <Player />
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
