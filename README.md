
# Docker OpenStreetMaps Map Loader

It loads a file osm.pbf into a postgres with postgis enabled.


## **Usage:**

```bash
 docker run \
  -e POSTGRES_DB=geoloc-street-picker \
  -e POSTGRES_USER=geoloc \
  -e POSTGRES_PASSWORD=geoloc \
  --rm abner/map-loader http://download.bbbike.org/osm/bbbike/Brisbane/Brisbane.osm.pbf
  ```