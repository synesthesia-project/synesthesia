const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const templates = {
    page: path.resolve(`./src/templates/page.js`),
    doc: path.resolve(`./src/templates/doc.js`),
  };
  const results = await graphql(
    `
      {
        allMarkdownRemark {
          edges {
            node {
              id
              fields {
                slug
              }
            }
          }
        }
        allTypeDoc {
          edges {
            node {
              id
              path
            }
          }
        }
      }
    `
  )

  if (results.errors) {
    throw results.errors;
  }

  for (const page of results.data.allMarkdownRemark.edges) { 
    createPage({
      path: page.node.fields.slug,
      component: templates.page,
      context: {
        id: page.node.id
      },
    });
  }

  for (const doc of results.data.allTypeDoc.edges) {
    createPage({
      path: doc.node.path,
      component: templates.doc,
      context: {
        id: doc.node.id
      },
    });
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
