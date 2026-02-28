-- Club Claims - Track which clubs have been claimed by verified representatives
CREATE TABLE IF NOT EXISTS club_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL UNIQUE,
    clerk_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    verified_at TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_club_claims_club_id ON club_claims(club_id);
CREATE INDEX IF NOT EXISTS idx_club_claims_user_id ON club_claims(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_club_claims_verified ON club_claims(verified);

-- Membership Tiers - Store different membership categories and pricing
CREATE TABLE IF NOT EXISTS membership_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    tier_name TEXT NOT NULL,
    tier_type TEXT NOT NULL,
    annual_fee REAL,
    joining_fee REAL,
    monthly_fee REAL,
    description TEXT,
    min_age INTEGER,
    max_age INTEGER,
    restrictions TEXT,
    benefits TEXT,
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_club_id ON membership_tiers(club_id);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_type ON membership_tiers(tier_type);
CREATE INDEX IF NOT EXISTS idx_membership_tiers_active ON membership_tiers(is_active);

-- Green Fees - Store visitor/guest pricing
CREATE TABLE IF NOT EXISTS green_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    day_type TEXT NOT NULL,
    fee_type TEXT NOT NULL,
    price REAL NOT NULL,
    season TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_green_fees_club_id ON green_fees(club_id);
CREATE INDEX IF NOT EXISTS idx_green_fees_active ON green_fees(is_active);
