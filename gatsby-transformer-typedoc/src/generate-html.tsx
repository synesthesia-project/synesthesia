import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ReflectionKind } from 'typedoc/dist/lib/models/reflections/abstract';
import { InitialDocumentationPage, DocumentationSection } from './process-typedoc';

export function generatePageHTML(
  pages: Map<string, InitialDocumentationPage>,
  _sectionMap: Map<number, DocumentationSection>,
  page: InitialDocumentationPage) {
  const components: JSX.Element[] = [];

  // Check to see if there are any modules that share the same URL prefix
  const descendantModules: InitialDocumentationPage[] = [];
  for (const p of pages.values()) {
    if (p !== page &&
        p.url.startsWith(page.url) &&
        p.sections.length === 1 &&
        p.sections[0].reflection.kind === ReflectionKind.ExternalModule)
      descendantModules.push(p);
  }
  if (descendantModules.length > 0 ) {
    components.push(<div key='descendantModules'>
      <h2>Descendent Modules</h2>
      <ul>
        {descendantModules.map(m => (
          <li key={m.url}>Foo: {m.sections[0].title}</li>
        ))}
      </ul>
    </div>);
  }  

  return renderToString(<>{components}</>);
}