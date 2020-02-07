import { Node, GatsbyNode } from 'gatsby';
import { FileSystemNode } from 'gatsby-source-filesystem';

import { PluginOptions, validateOptions } from './options';
import { isTypedocApi, processTypedoc } from './process-typedoc';

function isFilesystemNode(node: Node): node is FileSystemNode {
  return !!node.sourceInstanceName;
}

const onPreInit: GatsbyNode['onPreInit'] = (_args, options) => {
  validateOptions(options as PluginOptions | undefined);
}

const onCreateNode: GatsbyNode['onCreateNode'] =
  async ({ node, loadNodeContent }, options) => {
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
    const docs = processTypedoc(parsedApi);
    console.log(docs);
  }

export { onCreateNode, onPreInit }
