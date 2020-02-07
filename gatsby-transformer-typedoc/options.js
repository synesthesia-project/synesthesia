"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const consts_1 = require("./consts");
function optionsError(msg) {
    return new Error(`Error with options for plugin ${consts_1.PLUGIN_NAME}: ${msg}`);
}
function validateOptions(unknownOptions) {
    if (!unknownOptions)
        throw optionsError('options required');
    const options = unknownOptions;
    if (typeof options.source === 'undefined')
        throw optionsError('"source" needs to be a defined');
    if (typeof options.source !== 'string')
        throw optionsError('"source" needs to be a string');
    return true;
}
exports.validateOptions = validateOptions;
