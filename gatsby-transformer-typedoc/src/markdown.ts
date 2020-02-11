import unified = require('unified');
import markdown = require('remark-parse');
// @ts-ignore
import html = require('remark-html');

const processor = unified()
  .use(markdown)
  .use(html);

export async function processMarkdown(input: string): Promise<string> {
  const output = await processor.process(input);
  return output.toString();
}
