/// <reference path="../../../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../../../node_modules/@types/chrome/index.d.ts"/>
/// <reference path="../../../node_modules/@types/webmidi/index.d.ts"/>
/// <reference path="../../extension/ts/proto.d.ts"/>

interface ShadowDomInstance extends React.Component<{
  include?: string[]
}, {}> {}
type ShadowDOMConstructor = { new () : ShadowDomInstance };

interface Externals {
  ShadowDOM: ShadowDOMConstructor
}

declare var externals: Externals;
