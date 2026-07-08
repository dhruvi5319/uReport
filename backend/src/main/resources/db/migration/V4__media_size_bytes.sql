-- V3: Add size_bytes column to media table for MediaDto (Plan 04-04)
ALTER TABLE media ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
