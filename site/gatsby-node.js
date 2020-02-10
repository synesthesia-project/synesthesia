const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const templates = {
    page: path.resolve(`./src/templates/page.js`)
  };
  const pages = await graphql(
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
      }
    `
  )

  if (pages.errors) {
    throw pages.errors
  }

  for (const page of pages.data.allMarkdownRemark.edges) { 
    createPage({
      path: page.node.fields.slug,
      component: templates.page,
      context: {
        id: page.node.id
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
