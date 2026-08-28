#!/usr/bin/env bash
# Regenerates public/tiles/sjdm.pmtiles. See docs/PROGRESS.md Phase 2 item 10.
#
# Bounds are the city polygon (src/data/city-boundary.json) plus an ~8km
# buffer on three sides, extended further south to ~14.60 to actually reach
# Novaliches/Monumento along Quirino Highway — the one corridor HANDOFF.md
# §7 already names by operator (CEM Trans / Joanna Jesh, "toward Caloocan,
# Quezon City, and points south"). This is a stand-in for "outbound corridors
# to their termini" (§8 item 10) until Phase 3 field survey defines the full
# PUV route list — re-derive per-corridor once routes are known, or widen
# further if a surveyed route falls outside this extract.
#
# Requires a JDK 21+ on PATH as `java` (Temurin 21 works; the project's
# default `java` may be older — point JAVA_HOME/bin/java at it if so).
# Downloads planetiler.jar (one-time, ~90MB) and a Philippines OSM extract
# plus global water/natural-earth sources (one-time, ~2GB) into .tools/,
# which is gitignored.

set -euo pipefail
cd "$(dirname "$0")/../.tools"

if [ ! -f planetiler.jar ]; then
  curl -L -o planetiler.jar \
    https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
fi

java -Xmx4g -jar planetiler.jar \
  --download --area=philippines \
  --bounds=120.94204,14.60000,121.24255,14.93747 \
  --minzoom=8 --maxzoom=15 \
  --output=sjdm.pmtiles

cp sjdm.pmtiles ../public/tiles/sjdm.pmtiles
echo "Copied to public/tiles/sjdm.pmtiles — rerun 'npm run cap:sync' to pick it up."
