import { PLUGIN_NAME } from './consts';

export interface PluginOptions {
  source: string;
  /**
   * What path should typedoc pages be rooted under?
   */
  basePath?: string;
}

function optionsError(msg: string) {
  return new Error(`Error with options for plugin ${PLUGIN_NAME}: ${msg}`);
}

export function validateOptions(unknownOptions: unknown): unknownOptions is PluginOptions {
  if (!unknownOptions)
    throw optionsError('options required');
  const options: PluginOptions = unknownOptions as any;
  if (typeof options.source === 'undefined')
    throw optionsError('"source" needs to be a defined')
  if (typeof options.source !== 'string')
    throw optionsError('"source" needs to be a string')
  if (typeof options.basePath !== 'undefined' && typeof options.basePath !== 'string')
    throw optionsError('"apiBase" needs to be a string if defined')
  return true;
}
