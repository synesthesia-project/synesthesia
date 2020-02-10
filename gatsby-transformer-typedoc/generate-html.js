"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("typedoc/dist/lib/models/reflections/abstract");
function generatePageHTML(pages, _sectionMap, page) {
    const html = [];
    const decendantModules = [];
    for (const p of pages.values()) {
        if (p !== page &&
            p.url.startsWith(page.url) &&
            p.sections.length === 1 &&
            p.sections[0].reflection.kind === abstract_1.ReflectionKind.ExternalModule)
            decendantModules.push(p);
    }
    if (decendantModules.length > 0) {
        html.push(`
    <h2>Decendant Modules:</h2>
    <ul>
      ${decendantModules.map(m => `
      <li>${m.sections[0].title}</li>
      `)}
    </ul>
    `);
    }
    console.log(decendantModules);
    return html.join();
}
exports.generatePageHTML = generatePageHTML;
