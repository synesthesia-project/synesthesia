/// <reference path="../../../typings/index.d.ts"/>

interface ShadowDomInstance extends React.Component<{
  include?: string[]
}, {}> {}
type ShadowDOMConstructor = { new () : ShadowDomInstance };

interface Externals {
  ShadowDOM: ShadowDOMConstructor
}

declare var externals: Externals;
