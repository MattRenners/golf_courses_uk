-- Golf Clubs Database Schema for Cloudflare D1

CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    address TEXT,
    town TEXT,
    county TEXT,
    postcode TEXT,
    phone TEXT,
    latitude REAL,
    longitude REAL,
    website TEXT,
    email TEXT,
    description TEXT,
    amenities TEXT,
    holes INTEGER,
    image TEXT,
    founding_year INTEGER,
    head_pro_name TEXT,
    head_pro_email TEXT,
    pro_shop_phone TEXT,
    manager_name TEXT,
    total_members INTEGER,
    total_men INTEGER,
    total_women INTEGER,
    adult_men INTEGER,
    adult_women INTEGER,
    junior_men INTEGER,
    junior_women INTEGER,
    tee_booking_url TEXT,
    membership_url TEXT,
    facebook_url TEXT,
    twitter_url TEXT,
    instagram_url TEXT,
    facility_types TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_region ON clubs(region);
CREATE INDEX IF NOT EXISTS idx_postcode ON clubs(postcode);
CREATE INDEX IF NOT EXISTS idx_name ON clubs(name);
CREATE INDEX IF NOT EXISTS idx_location ON clubs(latitude, longitude);

-- Facility Types - Reference table for standardized facility definitions
-- This is a lookup table shared across all clubs (~47 standard facilities)
CREATE TABLE IF NOT EXISTS facility_types (
    id INTEGER PRIMARY KEY,  -- Uses FacilityTypeId from API
    name TEXT NOT NULL,
    icon TEXT,
    facility_group_id INTEGER,
    facility_group_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facility_types_group ON facility_types(facility_group_id);

-- Club Facilities - Junction table linking clubs to available facilities
-- Only stores which facilities each club has (much more efficient)
CREATE TABLE IF NOT EXISTS club_facilities (
    club_id INTEGER NOT NULL,
    facility_type_id INTEGER NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (club_id, facility_type_id),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_type_id) REFERENCES facility_types(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_club_facilities_club_id ON club_facilities(club_id);
CREATE INDEX IF NOT EXISTS idx_club_facilities_facility_type_id ON club_facilities(facility_type_id);
