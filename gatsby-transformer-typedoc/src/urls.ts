import getRelativePath = require('get-relative-path');
import { InitialDocumentationPage, DocumentationSection } from "./process-typedoc";
import { ReflectionKind } from 'typedoc/dist/lib/models/reflections/abstract';
import * as reflection from './reflection';

export function getRelativeUrl(from: InitialDocumentationPage, to: InitialDocumentationPage) {
  const finalFromUrl = from.url === '' ? '/' : `/${from.url}/`;
  const finalToUrl = to.url === '' ? '/' : `/${to.url}/`;
  return getRelativePath(finalFromUrl, finalToUrl)
}

export function requiresOwnPageWithDot(r: reflection.Reflection) {
  return  (
    r.kind === ReflectionKind.Class ||
    r.kind === ReflectionKind.Interface
  );
}

export function requiresOwnPage(r: reflection.Reflection) {
  return requiresOwnPageWithDot(r);
}

export function getUrl(parent: DocumentationSection, r: reflection.Reflection) {
  if (requiresOwnPageWithDot(r)) {
    return parent.page.url + '.' + r.name;
  } else {
    throw new Error('TODO');
  }
}
