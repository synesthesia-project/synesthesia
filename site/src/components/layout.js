import React from "react"
import { useStaticQuery, Link } from "gatsby"

const Layout = ({ children }) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
          }
        }
      }
    `
  )
  return (
    <div>
      <header>
        <h3>
          <Link to={`/`}>
            {site.siteMetadata.title}
          </Link>
        </h3>
      </header>
      <main>{children}</main>
    </div>
  )
}

export default Layout
