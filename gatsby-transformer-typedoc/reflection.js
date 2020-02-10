"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("typedoc/dist/lib/models/reflections/abstract");
function isExternalModule(reflection) {
    return reflection.kind === abstract_1.ReflectionKind.ExternalModule;
}
exports.isExternalModule = isExternalModule;
