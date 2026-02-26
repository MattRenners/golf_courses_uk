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
