/// <reference path="../../typings/index.d.ts"/>

interface ShadowDomInstance extends React.Component<{}, {}> {}
type ShadowDOMConstructor = { new () : ShadowDomInstance };

interface Externals {
  ShadowDOM: ShadowDOMConstructor
}

declare var externals: Externals;
