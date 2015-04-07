/* globals $ */

var Octokat = require('octokat')
var github = new Octokat()
var URL = require('url')
var repo

module.exports = function () {
  $(init)
}

var init = function () {
  repo = github.repos('npm', 'newwwzzz')
  repo.counts = {}

  repo.pulls.fetch({per_page: 1})
    .then(function (pulls) {
      repo.counts.pulls = count(pulls)
      return repo.issues.fetch({per_page: 1})
    })
    .then(function (issues) {
      repo.counts.issues = count(issues)
      // GitHub API still includes PRs in /issues endpoints
      repo.counts.issues -= repo.counts.pulls
      return repo.contributors.fetch({per_page: 1})
    })
    .then(function (contributors) {
      repo.counts.contributors = count(contributors)
      console.log(repo.counts)
    })
    .catch(function (e) {
      console.error('oh noes', e)
    })
}

var count = function (response) {
  try {
    return Number(URL.parse(response.lastPage.url, true).query.page)
  } catch(e) {
    console.error('error parsing github API result', e)
  }
}
