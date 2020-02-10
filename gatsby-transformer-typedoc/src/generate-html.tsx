import * as React from 'react';
import { renderToString } from 'react-dom/server';
import * as reflection from './reflection';
import { InitialDocumentationPage, DocumentationSection } from './process-typedoc';
import { getRelativeUrl } from './urls';

const EXTRACT_LAST_PATH_COMPONENT = /^(?:(.*)(\/|\.))?([^\/]*)$/

export function generatePageHTML(
  root: DocumentationSection,
  pages: Map<string, InitialDocumentationPage>,
  _sectionMap: Map<number, DocumentationSection>,
  page: InitialDocumentationPage) {
  const components: JSX.Element[] = [];

  // Add Breadcrumbs
  let nextPath: string | undefined = page.url;
  const breadcrumbs: JSX.Element[] = [];
  while (nextPath && nextPath !== '') {
    const p = pages.get(nextPath);
    const exec = EXTRACT_LAST_PATH_COMPONENT.exec(nextPath);
    if (!exec) break;
    nextPath = exec[1];
    const currentSeparator: undefined | string = exec[2];
    const currentLabel = exec[3];
    if (p) {
      breadcrumbs.push(
        <a key={breadcrumbs.length} href={getRelativeUrl(page, p)}>
          {currentLabel}
        </a>
      );
    } else {
      breadcrumbs.push(<span key={breadcrumbs.length}>{currentLabel}</span>);
    }
    if (currentSeparator) {
      breadcrumbs.push(<span key={breadcrumbs.length}>
        {` ${currentSeparator} `}
      </span>);
    }
  }
  breadcrumbs.push(
    <a key={breadcrumbs.length} href={getRelativeUrl(page, root.page)}>
      {root.reflection.name}
    </a>
  );
  components.push(
    <div key={components.length}>{breadcrumbs.reverse()}</div>
  );

  // Add Package Information
  for (const section of page.sections) {
    const r = section.reflection;
    if (reflection.isPackage(r)) {
      components.push(
        <div key={components.length}>
          <h2>Installation:</h2>
          <pre><code>{`npm install ${r.name}`}</code></pre>
        </div>
      );
    }
  }

  // Check to see if there are any modules that share the same URL prefix
  const descendantModules: InitialDocumentationPage[] = [];
  for (const p of pages.values()) {
    if (p !== page &&
        p.url.startsWith(page.url) &&
        p.sections.length === 1 &&
        reflection.isExternalModule(p.sections[0].reflection))
      descendantModules.push(p);
  }
  if (descendantModules.length > 0 ) {
    components.push(<div key={components.length}>
      <h2>Descendent Modules</h2>
      <ul>
        {descendantModules.map(m => {
          return (
            <li key={m.url}>
              <a href={getRelativeUrl(page, m)}>
                Foo: {m.title}
              </a>
            </li>
          );
        })}
      </ul>
    </div>);
  }

  for (const section of page.sections) {
    const r = section.reflection;
    if (reflection.isExternalModule(r)) {
      components.push(
        <div key={components.length}>
          <h2>Usage:</h2>
          <pre><code>
            {`import { ... } from "${page.title}"`}
          </code></pre>
        </div>
      );
    }
  }


  return renderToString(<>{components}</>);
}