-- Travel Diary & Discovery — Complete Database Schema
-- Run with: psql -d travel_diary -f schema.sql
-- Or use node-pg-migrate migrations (see /migrations folder)

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- ILIKE autocomplete
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- accent-insensitive search

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  home_location VARCHAR(255),
  preferences   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT refresh_tokens_user_hash_unique UNIQUE (user_id, token_hash)
);

CREATE TABLE IF NOT EXISTS destinations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  country       VARCHAR(100) NOT NULL,
  latitude      DECIMAL(9,6) NOT NULL,
  longitude     DECIMAL(9,6) NOT NULL,
  description   TEXT,
  search_vector TSVECTOR,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT destinations_name_country_unique UNIQUE (name, country)
);

CREATE TABLE IF NOT EXISTS trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  cover_photo_url TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  privacy         VARCHAR(10) NOT NULL DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT trips_dates_check CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS trip_destinations (
  trip_id        UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  visit_order    SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (trip_id, destination_id)
);

CREATE TABLE IF NOT EXISTS media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  caption       VARCHAR(500),
  mime_type     VARCHAR(50) NOT NULL,
  size_bytes    INTEGER NOT NULL,
  latitude      DECIMAL(9,6),
  longitude     DECIMAL(9,6),
  taken_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  CONSTRAINT tags_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS ratings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  trip_id        UUID REFERENCES trips(id) ON DELETE SET NULL,
  score          SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  review         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ratings_user_destination_unique UNIQUE (user_id, destination_id)
);

CREATE TABLE IF NOT EXISTS rating_tags (
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  tag_id    INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (rating_id, tag_id)
);

CREATE TABLE IF NOT EXISTS planned_trips (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  notes        TEXT,
  budget_cents INTEGER,
  currency     VARCHAR(3) NOT NULL DEFAULT 'USD',
  start_window DATE,
  end_window   DATE,
  status       VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planned_trip_destinations (
  planned_trip_id UUID NOT NULL REFERENCES planned_trips(id) ON DELETE CASCADE,
  destination_id  UUID NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  visit_order     SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (planned_trip_id, destination_id)
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planned_trip_id UUID NOT NULL REFERENCES planned_trips(id) ON DELETE CASCADE,
  text            VARCHAR(500) NOT NULL,
  is_done         BOOLEAN NOT NULL DEFAULT false,
  sort_order      SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recommendations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  score          DECIMAL(5,4) NOT NULL,
  reason         TEXT,
  seen           BOOLEAN NOT NULL DEFAULT false,
  dismissed      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT recommendations_user_dest_unique UNIQUE (user_id, destination_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked = false;

-- Destinations
CREATE INDEX IF NOT EXISTS idx_destinations_search_vector ON destinations USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_destinations_name_trgm ON destinations USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_destinations_country ON destinations(country);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_user_start ON trips(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_trips_privacy ON trips(privacy);

-- Media
CREATE INDEX IF NOT EXISTS idx_media_trip_id ON media(trip_id);
CREATE INDEX IF NOT EXISTS idx_media_user_id ON media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Ratings
CREATE INDEX IF NOT EXISTS idx_ratings_destination_id ON ratings(destination_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_dest_score ON ratings(destination_id, score);

-- Recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_user_score ON recommendations(user_id, score DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- Auto-update search_vector on destinations
CREATE OR REPLACE FUNCTION update_destination_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.country, '') || ' ' ||
    coalesce(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS destinations_search_vector_update ON destinations;
CREATE TRIGGER destinations_search_vector_update
  BEFORE INSERT OR UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION update_destination_search_vector();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trips_updated_at ON trips;
CREATE TRIGGER trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS planned_trips_updated_at ON planned_trips;
CREATE TRIGGER planned_trips_updated_at BEFORE UPDATE ON planned_trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
