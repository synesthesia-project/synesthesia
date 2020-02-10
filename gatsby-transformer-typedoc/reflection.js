"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("typedoc/dist/lib/models/reflections/abstract");
function isPackage(reflection) {
    return reflection.kind === abstract_1.ReflectionKind.Global;
}
exports.isPackage = isPackage;
function isExternalModule(reflection) {
    return reflection.kind === abstract_1.ReflectionKind.ExternalModule;
}
exports.isExternalModule = isExternalModule;
