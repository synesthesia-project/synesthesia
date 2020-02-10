import {
  Reflection,
  JsonApi,
  isExternalModule
} from './reflection';
import { generatePageHTML } from './generate-html';

export interface DocumentationSection {
  title: string;
  reflection: Reflection;
  children: DocumentationSection[];
}

export interface InitialDocumentationPage {
  url: string;
  sections: DocumentationSection[];
}

export interface ProcessedDocumentationPage {
  url: string;
  html: string;
  title: string;
}

/**
 * Roughly check whether the given api is a valid json output from typedoc
 */
export function isTypedocApi(api: any): api is JsonApi {
  const a: JsonApi = api;
  return (
    a.id !== undefined &&
    a.flags !== undefined &&
    a.kind !== undefined &&
    a.name !== undefined
  )
}

export function processTypedoc(api: JsonApi) {
  /**
   * List of pages to output
   */
  const pages = new Map<string, InitialDocumentationPage>();
  /**
   * Mapping from reflection IDs
   */
  const sectionMap = new Map<number, DocumentationSection>();

  const processReflection = (_parent: Reflection, reflection: Reflection) => {
    if (isExternalModule(reflection)) {
      // Strip quote marks
      let url = reflection.name.substr(1, reflection.name.length - 2);
      if (url === 'index')
        url = '';
      if (url.endsWith('/index'))
        url = url.substr(0, url.length - 6);
      outputTopLevelSection(url, reflection, api.name + '/' + url);
    }
  }

  const outputTopLevelSection = (url: string, reflection: Reflection, title: string) => {
    let page = pages.get(url);
    if (!page) {
      page = { url, sections: [] };
      pages.set(url, page);
    }
    const section: DocumentationSection = {
      title,
      reflection,
      children: []
    }
    sectionMap.set(reflection.id, section);
    page.sections.push(section);
  }

  // Organize into pages
  outputTopLevelSection('', api, api.name);
  for (const c of api.children || []) {
    processReflection(api, c);
  }

  // TODO: sort sections of pages

  // Generate HTML for pages
  const output: ProcessedDocumentationPage[] = [];
  for (const page of pages.values()) {
    output.push({
      url: page.url,
      html: generatePageHTML(pages, sectionMap, page),
      title: page.sections[0].title
    });
  }
  return output;
}
