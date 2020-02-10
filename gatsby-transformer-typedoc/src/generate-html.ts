import { ReflectionKind } from 'typedoc/dist/lib/models/reflections/abstract';
import { InitialDocumentationPage, DocumentationSection } from './process-typedoc';

export function generatePageHTML(
  pages: Map<string, InitialDocumentationPage>,
  _sectionMap: Map<number, DocumentationSection>,
  page: InitialDocumentationPage) {
  const html: string[] = [];

  // Check to see if there are any modules that share the same URL prefix
  const decendantModules: InitialDocumentationPage[] = [];
  for (const p of pages.values()) {
    if (p !== page &&
        p.url.startsWith(page.url) &&
        p.sections.length === 1 &&
        p.sections[0].reflection.kind === ReflectionKind.ExternalModule)
      decendantModules.push(p);
  }
  if (decendantModules.length > 0 ) {
    html.push(`
    <h2>Decendant Modules:</h2>
    <ul>
      ${decendantModules.map(m => `
      <li>${m.sections[0].title}</li>
      `)}
    </ul>
    `)
  }
  console.log(decendantModules);



  

  return html.join();
}