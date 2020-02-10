"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const server_1 = require("react-dom/server");
const abstract_1 = require("typedoc/dist/lib/models/reflections/abstract");
const urls_1 = require("./urls");
function generatePageHTML(pages, _sectionMap, page) {
    const components = [];
    const descendantModules = [];
    for (const p of pages.values()) {
        if (p !== page &&
            p.url.startsWith(page.url) &&
            p.sections.length === 1 &&
            p.sections[0].reflection.kind === abstract_1.ReflectionKind.ExternalModule)
            descendantModules.push(p);
    }
    if (descendantModules.length > 0) {
        components.push(React.createElement("div", { key: 'descendantModules' },
            React.createElement("h2", null, "Descendent Modules"),
            React.createElement("ul", null, descendantModules.map(m => {
                return (React.createElement("li", { key: m.url },
                    React.createElement("a", { href: urls_1.getRelativeUrl(page, m) },
                        "Foo: ",
                        m.sections[0].title)));
            }))));
    }
    return server_1.renderToString(React.createElement(React.Fragment, null, components));
}
exports.generatePageHTML = generatePageHTML;
