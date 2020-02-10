"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function stripSlashes(str) {
    return str.replace(/^\/+|\/+$/g, '');
}
exports.stripSlashes = stripSlashes;
