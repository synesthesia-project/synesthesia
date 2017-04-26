declare namespace synesthesia.strip_controller_api {

  type Color = [number, number, number];

  export interface StripState {
    primaryColor: Color;
    secondaryColor: Color;
    sparkleColor: Color;
    primaryArtifacts: number;
    secondaryArtifacts: number;
    sparkliness: number;
  }

  export interface ClientMessage {
    updateState?: Partial<StripState>;
  }
  export interface ServerMessage {
    state?: StripState;
  }
}
