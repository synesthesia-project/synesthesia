import { GatsbyNode } from 'gatsby';

const onCreateNode: GatsbyNode['onCreateNode'] =
  async ({ node }, _options) => {
    console.log('node!', node);
  }

export { onCreateNode }
