# zipviz - Zip Visualizer

This is	a simple zipcode rendering tool, it uses the [Leaflet JavaScript](http://leafletjs.com/) library and [Bootstrap](http://getbootstrap.com/) to provide a simple form-driven UI. The tool was created to allow the ability to render groups of zip codes on a live map, the ability to see overlaps in groups and to visualize the impact of adding/removing zipcodes in these groups.

The data is gathered from a number of sources (see below) and converted into a database that is used at runtime, this data is made available via the `/api?q=` endpoint.

## Data Sources

The following data sources were used in the creation of the data set I used to test the tool.

* [Full Zip Codes](http://www.filosophy.org/post/17/zipcodes_in_kml/) but doesn't contain underliverable codes, good names, or centroids.
* [Undeliverable Zip Codes](https://www.google.com/fusiontables/data?docid=1XXhCde2p1ncNiUSdEgO-mApKRPJsUIidYHNa0KA) contains minimal data.
* [Basic Zip Codes](https://www.google.com/fusiontables/DataSource?docid=1fzwSGnxD0xzJaiYXYX66zuYvG0c5wcEUi5ZI0Q) contains good names, many centroids but only basic polygons.

## Conversion Tool

The `kml_to_here.py` tool in the `data` directory is used to convert the downloaded content listed above into a number of specific formats. It can generate a single JSON file (huge), create a `json` directory with one file per zip code, or it can create a [SQLite3](https://www.sqlite.org/) database. The tools uses the database format to vend zipcode information to the tool during rendering.
