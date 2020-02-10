"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getRelativePath = require("get-relative-path");
function getRelativeUrl(from, to) {
    const finalFromUrl = from.url === '' ? '/' : `/${from.url}/`;
    const finalToUrl = to.url === '' ? '/' : `/${to.url}/`;
    return getRelativePath(finalFromUrl, finalToUrl);
}
exports.getRelativeUrl = getRelativeUrl;
