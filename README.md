# clusterize.js-paging

Adds paging to clusterize.js.

## Usage

clusterize.js-paging extends from clusterize.js.
See the [clusterize.js documentation](https://clusterize.js.org/) for the core options.
clusterize.js-paging uses additional options listed below.

### Options

- `dummyRow`: HTML as string that will be used until the row is loaded.
  This will be also used to calculate the row height!
- `preload`: Number of rows which will be loaded ahead before and after the current view.
- `pageSize`: Number of rows a page contains

### Callbacks

- `Promise loadRows(number offset)`: Will be called to fetch the page.
  Offset is given in rows.
- `undefined rowsLoaded()`: Will be called after a page has been fetched.
