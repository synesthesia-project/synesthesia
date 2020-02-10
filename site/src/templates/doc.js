import React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import SEO from "../components/seo"

const BlogPostTemplate = ({ data, location }) => {
  const doc = data.typeDoc;
  const title = doc.title;

  return (
    <Layout location={location}>
      <SEO
        title={title}
      />
      <div>
        <header>
          <h1>{title}</h1>
        </header>
        <section dangerouslySetInnerHTML={{ __html: doc.html }} />
      </div>
    </Layout>
  )
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query DocById($id: String!) {
    typeDoc(id: { eq: $id }) {
      html
      title
    }
  }
`
