import * as crypto from 'crypto';
import { Node, GatsbyNode } from 'gatsby';
import { FileSystemNode } from 'gatsby-source-filesystem';

import { PluginOptions, validateOptions } from './options';
import { isTypedocApi, processTypedoc } from './process-typedoc';
import { generatePageHTML } from './generate-html';

export const GRAPHQL_TYPE = 'TypeDoc';

function isFilesystemNode(node: Node): node is FileSystemNode {
  return !!node.sourceInstanceName;
}

const onPreInit: GatsbyNode['onPreInit'] = (_args, options) => {
  validateOptions(options as PluginOptions | undefined);
}

const onCreateNode: GatsbyNode['onCreateNode'] =
  async ({ actions, node, loadNodeContent }, options) => {
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
    for (const doc of processTypedoc(parsedApi)){
      const html = generatePageHTML(doc);
      const node = {
        id: `TypeDoc ${doc.url}`,
        internal: {
          type: GRAPHQL_TYPE,
          contentDigest: crypto.createHash('sha1').update(html).digest('hex')
        }
      }
      actions.createNode(node);
    }
  }

export { onCreateNode, onPreInit }
