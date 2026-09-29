-- Money columns: INTEGER -> DOUBLE PRECISION, so prices above N2,147,483,647 fit (TODO 55).
-- Hand-written: touches only these columns, never geom / search_vector.
ALTER TABLE "Property"
  ALTER COLUMN "rent"           TYPE DOUBLE PRECISION,
  ALTER COLUMN "agencyFee"      TYPE DOUBLE PRECISION,
  ALTER COLUMN "legalFee"       TYPE DOUBLE PRECISION,
  ALTER COLUMN "cautionDeposit" TYPE DOUBLE PRECISION,
  ALTER COLUMN "serviceCharge"  TYPE DOUBLE PRECISION;

ALTER TABLE "PriceHistory"
  ALTER COLUMN "rent" TYPE DOUBLE PRECISION;
