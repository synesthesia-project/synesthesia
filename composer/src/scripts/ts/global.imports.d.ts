/// <reference path="../../../node_modules/@types/jquery/index.d.ts"/>
/// <reference path="../../../node_modules/@types/chrome/index.d.ts"/>
/// <reference path="../../../node_modules/@types/webmidi/index.d.ts"/>
/// <reference path="../../extension/ts/proto.d.ts"/>

interface ShadowDomInstance extends React.Component<{
  include?: string[]
}, {}> {}
type ShadowDOMConstructor = { new (): ShadowDomInstance };

interface Externals {
  ShadowDOM: ShadowDOMConstructor;
}

declare var externals: Externals;

// Icons
// TODO: Find a better way to do this

declare module 'react-icons/lib/md/pause' {
  import Icon from 'react-icons/md/pause'; export = Icon;
}

declare module 'react-icons/lib/md/play-arrow' {
  import Icon from 'react-icons/md/play-arrow'; export = Icon;
}

declare module 'react-icons/lib/md/add' {
  import Icon from 'react-icons/md/add'; export = Icon;
}

declare module 'react-icons/lib/md/folder-open' {
  import Icon from 'react-icons/md/folder-open'; export = Icon;
}

declare module 'react-icons/lib/md/save' {
  import Icon from 'react-icons/md/save'; export = Icon;
}

declare module 'react-icons/lib/md/delete' {
  import Icon from 'react-icons/md/delete'; export = Icon;
}

declare module 'react-icons/lib/md/keyboard' {
  import Icon from 'react-icons/md/keyboard'; export = Icon;
}

declare module 'react-icons/lib/md/music-note' {
  import Icon from 'react-icons/md/music-note'; export = Icon;
}

declare module 'react-icons/lib/md/tab' {
  import Icon from 'react-icons/md/tab'; export = Icon;
}
