"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const server_1 = require("react-dom/server");
const reflection = require("./reflection");
const urls_1 = require("./urls");
const EXTRACT_LAST_PATH_COMPONENT = /^(?:(.*)\/)?([^\/]*)$/;
function generatePageHTML(api, root, pages, _sectionMap, page) {
    const components = [];
    let nextPath = page.url;
    const breadcrumbs = [];
    while (nextPath && nextPath !== '') {
        const p = pages.get(nextPath);
        const exec = EXTRACT_LAST_PATH_COMPONENT.exec(nextPath);
        if (!exec)
            break;
        nextPath = exec[1];
        const currentLabel = exec[2];
        if (p) {
            breadcrumbs.push(React.createElement("a", { key: breadcrumbs.length, href: urls_1.getRelativeUrl(page, p) }, currentLabel));
        }
        else {
            breadcrumbs.push(React.createElement("span", { key: breadcrumbs.length }, currentLabel));
        }
        breadcrumbs.push(React.createElement("span", { key: breadcrumbs.length }, ' / '));
    }
    breadcrumbs.push(React.createElement("a", { key: breadcrumbs.length, href: urls_1.getRelativeUrl(page, root) }, api.name));
    components.push(React.createElement("div", { key: components.length }, breadcrumbs.reverse()));
    for (const section of page.sections) {
        const r = section.reflection;
        if (reflection.isPackage(r)) {
            components.push(React.createElement("div", { key: components.length },
                React.createElement("h2", null, "Installation:"),
                React.createElement("pre", null,
                    React.createElement("code", null, `npm install ${r.name}`))));
        }
    }
    const descendantModules = [];
    for (const p of pages.values()) {
        if (p !== page &&
            p.url.startsWith(page.url) &&
            p.sections.length === 1 &&
            reflection.isExternalModule(p.sections[0].reflection))
            descendantModules.push(p);
    }
    if (descendantModules.length > 0) {
        components.push(React.createElement("div", { key: components.length },
            React.createElement("h2", null, "Descendent Modules"),
            React.createElement("ul", null, descendantModules.map(m => {
                return (React.createElement("li", { key: m.url },
                    React.createElement("a", { href: urls_1.getRelativeUrl(page, m) },
                        "Foo: ",
                        m.sections[0].title)));
            }))));
    }
    for (const section of page.sections) {
        const r = section.reflection;
        if (reflection.isExternalModule(r)) {
            components.push(React.createElement("div", { key: components.length },
                React.createElement("h2", null, "Usage:"),
                React.createElement("pre", null,
                    React.createElement("code", null, `import { ... } from "${section.title}"`))));
        }
    }
    return server_1.renderToString(React.createElement(React.Fragment, null, components));
}
exports.generatePageHTML = generatePageHTML;
