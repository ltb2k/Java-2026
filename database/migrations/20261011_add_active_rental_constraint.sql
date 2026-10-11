-- Run manually only after checking the target database and resolving duplicate ACTIVE rentals.
-- This migration is additive; it does not delete or modify existing rows.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS rentals_one_active_tray_uidx
  ON rentals(tray_id) WHERE status = 'ACTIVE';
