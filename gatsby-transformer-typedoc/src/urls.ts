import getRelativePath = require('get-relative-path');
import { InitialDocumentationPage } from "./process-typedoc";

export function getRelativeUrl(from: InitialDocumentationPage, to: InitialDocumentationPage) {
  const finalFromUrl = from.url === '' ? '/' : `/${from.url}/`;
  const finalToUrl = to.url === '' ? '/' : `/${to.url}/`;
  return getRelativePath(finalFromUrl, finalToUrl)
}
