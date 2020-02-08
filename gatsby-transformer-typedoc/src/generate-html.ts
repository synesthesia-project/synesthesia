import { DocumentationPage, DocumentationSection } from './process-typedoc';

export function generatePageHTML(page: DocumentationPage) {
  return page.sections.map(generateSectionHTML).join();
}

function generateSectionHTML(section: DocumentationSection) {
  return (`
  <p>
    ${section.reflection.name}
  </p>
  `)
}