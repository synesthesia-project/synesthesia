import { PLUGIN_NAME } from './consts';

export interface PluginOptions {
  source: string;
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
  return true;
}
