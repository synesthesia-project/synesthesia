import * as crypto from 'crypto';
import { Node, GatsbyNode } from 'gatsby';
import { FileSystemNode, createFilePath } from 'gatsby-source-filesystem';

import { GRAPHQL_TYPE } from './consts';
import { PluginOptions, validateOptions } from './options';
import { isTypedocApi, processTypedoc } from './process-typedoc';
import { generatePageHTML } from './generate-html';
import { stripSlashes } from './util';

function isFilesystemNode(node: Node): node is FileSystemNode {
  return !!node.sourceInstanceName;
}

const onPreInit: GatsbyNode['onPreInit'] = (_args, options) => {
  validateOptions(options as PluginOptions | undefined);
}

const onCreateNode: GatsbyNode['onCreateNode'] =
  async ({ actions, node, loadNodeContent, getNode }, options) => {
    if (!validateOptions(options))
      // Should already be validated in onPreInit
      throw new Error('Unexpected error, invalid options');
    if (!isFilesystemNode(node)) return;
    if (node.sourceInstanceName !== options.source) return;
    if (node.internal.mediaType !== 'application/json') return;
    // Valid node, let's load it
    const content = await loadNodeContent(node);
    let parsedApi: any;
    try {
      parsedApi = JSON.parse(content);
    } catch (e) {
      const err = `File ${node.absolutePath} is not a valid JSON file: ${e}`;
      return Promise.reject(err);
    }
    if (!isTypedocApi(parsedApi)) {
      const err = `File ${node.absolutePath} is not a valid TypeDoc API`;
      return Promise.reject(err);
    }
    /**
     * Path relative to the root of all API Docs
     */
    const relativePath = createFilePath({ node, getNode });
    /**
     * Root path for this API
     */
    const basePath =
      (options.basePath ? (stripSlashes(options.basePath) + '/') : '') +
      stripSlashes(relativePath);
    console.log(relativePath);
    for (const doc of processTypedoc(parsedApi)){
      const html = generatePageHTML(doc);
      const path = '/' + basePath + '/' + (doc.url ? (doc.url + '/') : '');
      const docNode = {
        id: `TypeDoc ${path}`,
        html,
        children: [],
        parent: node.id,
        path,
        internal: {
          type: GRAPHQL_TYPE,
          contentDigest: crypto.createHash('sha1').update(html).digest('hex')
        }
      }
      actions.createNode(docNode);
      actions.createParentChildLink({ parent: node, child: getNode(docNode.id) })
    }
  }

export { onCreateNode, onPreInit }
