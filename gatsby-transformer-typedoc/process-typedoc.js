"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reflection_1 = require("./reflection");
const generate_html_1 = require("./generate-html");
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
        if (reflection_1.isExternalModule(reflection)) {
            let url = reflection.name.substr(1, reflection.name.length - 2);
            if (url === 'index')
                url = '';
            if (url.endsWith('/index'))
                url = url.substr(0, url.length - 6);
            outputTopLevelSection(url, reflection, api.name + '/' + url);
        }
    };
    const outputTopLevelSection = (url, reflection, title) => {
        let page = pages.get(url);
        if (!page) {
            page = { url, sections: [] };
            pages.set(url, page);
        }
        const section = {
            title,
            reflection,
            children: []
        };
        sectionMap.set(reflection.id, section);
        page.sections.push(section);
        return page;
    };
    const root = outputTopLevelSection('', api, api.name);
    for (const c of api.children || []) {
        processReflection(api, c);
    }
    const output = [];
    for (const page of pages.values()) {
        output.push({
            url: page.url,
            html: generate_html_1.generatePageHTML(api, root, pages, sectionMap, page),
            title: page.sections[0].title
        });
    }
    return output;
}
exports.processTypedoc = processTypedoc;
