"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generatePageHTML(page) {
    return page.sections.map(generateSectionHTML).join();
}
exports.generatePageHTML = generatePageHTML;
function generateSectionHTML(section) {
    return (`
  <p>
    ${section.reflection.name}
  </p>
  `);
}
