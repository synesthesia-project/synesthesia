import { Reflection as ModelReflection, ReflectionKind } from 'typedoc/dist/lib/models/reflections/abstract';
import { ProjectReflection } from 'typedoc/dist/lib/models/reflections/project';
import { ContainerReflection } from 'typedoc/dist/lib/models/reflections/container';
import { ModelToObject } from 'typedoc/dist/lib/serialization/schema';

type JsonApi = ModelToObject<ProjectReflection>;
type Reflection = ModelToObject<ModelReflection>;
type Container = ModelToObject<ContainerReflection>;

export interface DocumentationSection {
  title: string;
  reflection: Reflection;
  children: DocumentationSection[];
}

export interface DocumentationPage {
  url: string;
  sections: DocumentationSection[];
}

function isExternalModule(reflection: Reflection): reflection is Container {
  return reflection.kind === ReflectionKind.ExternalModule;
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
  const pages = new Map<string,DocumentationPage>();
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
      outputTopLevelSection(url, reflection);
    }
  }

  const outputTopLevelSection = (url: string, reflection: Reflection) => {
    let page = pages.get(url);
    if (!page) {
      page = { url, sections: [] };
      pages.set(url, page);
    }
    const section: DocumentationSection = {
      title: 'Some API Document (TODO)', //TODO
      reflection,
      children: []
    }
    sectionMap.set(reflection.id, section);
    page.sections.push(section);
  }

  outputTopLevelSection('', api);
  for (const c of api.children || []) {
    processReflection(api, c);
  }
  return pages.values();
}
