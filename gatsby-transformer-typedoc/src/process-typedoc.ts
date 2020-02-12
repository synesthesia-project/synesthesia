import {
  Reflection,
  JsonApi,
  isExternalModule,
  reflectionTypeName
} from './reflection';
import { generatePageHTML } from './generate-html';
import { getUrl, requiresOwnPage } from './urls';

export interface DocumentationSection {
  reflection: Reflection;
  children: DocumentationSection[];
  page: InitialDocumentationPage;
  /**
   * Name to use instead of `reflection.name`.
   */
  name?: string;
}

export interface InitialDocumentationPage {
  title: string;
  /**
   * URL, without any preceeding or training slashes,
   * relative to the root of the documentation for a particular API
   */
  url: string;
  sections: DocumentationSection[];
}

export interface ProcessedDocumentationPage {
  title: string;
  url: string;
  html: string;
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

export async function processTypedoc(api: JsonApi) {
  /**
   * List of pages to output
   */
  const pages = new Map<string, InitialDocumentationPage>();
  /**
   * Mapping from reflection IDs
   */
  const sectionMap = new Map<number, DocumentationSection>();

  const processReflection = (parent: DocumentationSection, reflection: Reflection) => {
    let section: DocumentationSection | null = null;
    if (isExternalModule(reflection)) {
      // Strip quote marks
      let url = reflection.name.substr(1, reflection.name.length - 2);
      if (url === 'index')
        url = '';
      if (url.endsWith('/index'))
        url = url.substr(0, url.length - 6);
      const name = api.name + '/' + url;
      section = outputTopLevelSection(
        url, reflection, 'Module ' + name, name
      );
    } else if (requiresOwnPage(reflection)) {
      const url = getUrl(parent, reflection);
      section = outputTopLevelSection(
        url,
        reflection,
        reflectionTypeName(reflection) + ' ' + reflection.name
      );
    } else {
      section = outputSubsection(parent, reflection);
    }
    if (reflection.children) {
      for(const child of reflection.children) {
        processReflection(section, child);
      }
    }
  }

  const outputTopLevelSection = (
      url: string, reflection: Reflection, title: string, name?: string
      ) => {
    let page = pages.get(url);
    if (!page) {
      page = { url, sections: [], title };
      pages.set(url, page);
    }
    const section: DocumentationSection = {
      reflection,
      children: [],
      page,
      name
    }
    sectionMap.set(reflection.id, section);
    page.sections.push(section);
    return section;
  }

  const outputSubsection = (parent: DocumentationSection, reflection: Reflection) => {
    const section: DocumentationSection = {
      reflection,
      children: [],
      page: parent.page
    }
    sectionMap.set(reflection.id, section);
    parent.children.push(section);
    return section;
  }

  // Organize into pages
  const root = outputTopLevelSection('', api, api.name);
  for (const c of api.children || []) {
    processReflection(root, c);
  }

  // TODO: sort sections of pages

  // Generate HTML for pages
  const output: ProcessedDocumentationPage[] = [];
  for (const page of pages.values()) {
    output.push({
      url: page.url,
      html: await generatePageHTML(root, pages, sectionMap, page),
      title: page.title
    });
  }
  return output;
}
