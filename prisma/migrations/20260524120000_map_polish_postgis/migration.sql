-- Enable PostGIS so we can add a spatial geom column and GiST-index it
CREATE EXTENSION IF NOT EXISTS postgis;

-- Generated geom column kept in sync with longitude/latitude.
-- Null when either coordinate is missing.
ALTER TABLE "Property"
  ADD COLUMN "geom" geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE
      WHEN longitude IS NOT NULL AND latitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      ELSE NULL
    END
  ) STORED;

CREATE INDEX "Property_geom_idx" ON "Property" USING GIST ("geom");
