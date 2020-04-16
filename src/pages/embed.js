import React, { useMemo, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"
import { useIntl } from "gatsby-plugin-intl"
import * as pym from "pym.js"

import Layout from "../components/layout"
import SEO from "../components/seo"
import FilterDescription from "../components/filter-description"
import ResourceRow from "../components/resource-row"
import ToastMessage from "../components/toast-message"

import {
  getFiltersWithValues,
  applyFilters,
  loadQueryParamFilters,
  sortByLevel,
  LEVEL_ENUM,
  PAGE_SIZE,
} from "./index"

const EmbedPage = ({
  location,
  data: {
    site: {
      siteMetadata: { flagResourcePath },
    },
    allAirtable: { edges },
  },
}) => {
  const urlFilters = loadQueryParamFilters(location, {
    search: ``,
    zip: ``,
    who: [],
    what: [],
    languages: [],
  })
  const allResults = useMemo(
    () =>
      edges
        .map(({ node: { recordId, data } }) => ({
          id: recordId,
          ...data,
        }))
        .sort(sortByLevel(LEVEL_ENUM)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const results = useMemo(
    () => applyFilters(getFiltersWithValues(urlFilters), allResults),
    [allResults, urlFilters]
  )

  const [page, setPage] = useState(1)
  const [toast, setToast] = useState(``)
  const intl = useIntl()

  useEffect(() => {
    const pymChild = new pym.Child({ polling: 500 })
    pymChild.sendHeight()
  }, [])

  // Function for creating a new flagged resource record in Airtable
  const flagResource = ({ id }) =>
    fetch(`${flagResourcePath}?Resource=[${id}]`)
      .then(res => res.json())
      .then(() => setToast(intl.formatMessage({ id: "flag-resource-success" })))
      .catch(err => console.error(err))

  return (
    <Layout location={location} hide>
      <SEO
        location={location}
        title={`${intl.formatMessage({
          id: "meta-title",
        })} | ${intl.formatMessage({ id: "city-bureau" })}`}
        overrideTitle
        lang={intl.locale}
      />
      <ToastMessage show={toast !== ``} onHide={() => setToast(``)}>
        {toast}
      </ToastMessage>
      <main className="main filter-container">
        <div className="section filter-results-section">
          <FilterDescription
            filters={getFiltersWithValues(urlFilters)}
            count={results.length}
          />
          <div className="filter-results">
            {results.slice(0, page * PAGE_SIZE).map(result => (
              <ResourceRow
                key={result.id}
                onFlag={() => flagResource(result)}
                {...result}
              />
            ))}
          </div>
          <div className="filter-results-footer">
            {results.length > PAGE_SIZE * page ? (
              <button
                type="button"
                className="button is-primary"
                onClick={() => setPage(page + 1)}
              >
                {intl.formatMessage({ id: "load-more-results" })}
              </button>
            ) : (
              ``
            )}
          </div>
        </div>
      </main>
    </Layout>
  )
}

EmbedPage.propTypes = {
  location: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
}

export const query = graphql`
  query {
    site {
      siteMetadata {
        flagResourcePath
      }
    }
    allAirtable {
      edges {
        node {
          recordId
          data {
            name: Name
            link: Link
            phone: Phone
            email: Email
            hours: Hours
            address: Address
            zip: ZIP
            description: Description
            descriptiones: Description_ES
            who: Who
            what: Category
            languages: Languages
            qualifications: Qualifications
            level: Level
            lastUpdated: Last_Updated
          }
        }
      }
    }
  }
`

export default EmbedPage