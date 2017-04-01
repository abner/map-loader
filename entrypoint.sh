#!/bin/ash
# using ascii art mini in http://patorjk.com/software/taag/#p=display&h=1&v=2&f=Mini&t=MAP%20Loader
echo -e  "$(cat /opt/map-loader/splash.txt)"
echo ""

export MAP_URL=$@
echo -e "Loading map OpenStreetMaps into postgres database ..."
echo ""
echo -e "MAP_URL: $MAP_URL"

yarn start

