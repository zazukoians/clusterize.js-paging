var inherits = require('inherits')
var Clusterize = require('clusterize.js')
var debounce = require('debounce')

function ClusterizePaging (options) {
  options = options || {}
  options.callbacks = options.callbacks || {}

  Clusterize.call(this, options)

  // merge additional options
  this.options.dummyRow = options.dummyRow
  this.options.preload = options.preload
  this.options.pageSize = options.pageSize
}

inherits(ClusterizePaging, Clusterize)

ClusterizePaging.prototype.init = function (length) {
  // cancel existing session...
  if (this.session) {
    this.session.canceled = true
  }

  // ...and create a new one
  this.session = {}

  // forward session to scrolling progress
  this.options.callbacks.scrollingProgress = this.handleScrollProgress(this.session).bind(this)

  this.rows = []

  for (var i = 0; i < length; i++) {
    this.rows.push(this.options.dummyRow)
  }

  this.loading = new Array(Math.ceil(this.rows.length / this.options.pageSize))

  // force no results text
  if (!length) {
    this.update([this.options.dummyRow])
    this.update(this.rows)
  }

  return this.loadRows(this.session)
}

ClusterizePaging.prototype.handleScrollProgress = function (session) {
  return debounce(function (percentage) {
    var offset = Math.floor(percentage * this.rows.length / 100)

    this.loadRows(session, offset)
    this.loadRows(session, offset, -1)
  }, 100)
}

ClusterizePaging.prototype.loadRows = function (session, offset, direction, end) {
  // stop processing if session was canceled
  if (session.canceled) {
    return Promise.resolve()
  }

  var self = this

  offset = offset || 0
  direction = direction || 1
  end = Math.max(0, end || (offset + this.options.preload * direction))

  var lastLoaded = -1

  for (var index = offset; (index - end) * direction <= 0; index += direction) {
    if (this.rows[index] !== self.options.dummyRow) {
      lastLoaded = index
    } else {
      break
    }
  }

  if (lastLoaded !== -1) {
    offset = lastLoaded
  }

  var page = Math.floor(offset / this.options.pageSize)

  offset = page * this.options.pageSize

  return self.loadPage(session, offset, page).then(function (length) {
    offset += length * direction

    // load more results?
    if ((offset - end) * direction <= 0) {
      return self.loadRows(session, offset, direction, end)
    }
  })
}

ClusterizePaging.prototype.loadPage = function (session, offset, page) {
  var self = this

  // check if the current page is already loading
  if (this.loading[page]) {
    return Promise.resolve(this.options.pageSize)
  }

  return Promise.resolve().then(function () {
    self.loading[page] = true

    return self.options.callbacks.loadRows(offset)
  }).then(function (rows) {
    // only update rows if session wasn't canceld
    if (!session.canceled) {
      self.rows.splice.apply(self.rows, [offset, rows.length].concat(rows))
      self.update(self.rows)

      if (self.options.callbacks.rowsLoaded) {
        self.options.callbacks.rowsLoaded()
      }
    }

    return rows.length
  })
}

module.exports = ClusterizePaging
