"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("typedoc/dist/lib/models/reflections/abstract");
function isExternalModule(reflection) {
    return reflection.kind === abstract_1.ReflectionKind.ExternalModule;
}
function isTypedocApi(api) {
    const a = api;
    return (a.id !== undefined &&
        a.flags !== undefined &&
        a.kind !== undefined &&
        a.name !== undefined);
}
exports.isTypedocApi = isTypedocApi;
function processTypedoc(api) {
    const pages = new Map();
    const sectionMap = new Map();
    const processReflection = (_parent, reflection) => {
        if (isExternalModule(reflection)) {
            let url = reflection.name.substr(1, reflection.name.length - 2);
            if (url === 'index')
                url = '';
            if (url.endsWith('/index'))
                url = url.substr(0, url.length - 6);
            outputTopLevelSection(url, reflection);
        }
    };
    const outputTopLevelSection = (url, reflection) => {
        let page = pages.get(url);
        if (!page) {
            page = { url, sections: [] };
            pages.set(url, page);
        }
        const section = {
            title: 'Some API Document (TODO)',
            reflection,
            children: []
        };
        sectionMap.set(reflection.id, section);
        page.sections.push(section);
    };
    outputTopLevelSection('', api);
    for (const c of api.children || []) {
        processReflection(api, c);
    }
    return pages.values();
}
exports.processTypedoc = processTypedoc;
