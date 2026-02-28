# Club Claiming System

## Overview
Golf club representatives can claim their club and manage membership pricing information directly on CaddyCompare.

## Features

### ✅ Completed

#### 1. Database Schema
- **`club_claims`** - Track verified club representatives
- **`membership_tiers`** - Store membership categories and pricing
- **`green_fees`** - Store visitor/guest pricing

#### 2. Club Detail Page Updates
- "Claim This Club" button on every club page
- Authentication UI (Sign In/Sign Up buttons)
- Verified club badge for claimed clubs
- Modal dialog for claim verification

#### 3. API Endpoints
- `/api/club-claim/status` - Check if club is claimed
- `/api/club-claim/submit` - Submit claim request
- `/api/club/[id]` - Enhanced to include membership data

### 🚧 To Implement

#### 1. Clerk Integration
**Status**: Ready for configuration
**Action Required**: 
1. Create Clerk account
2. Add API keys to `club.html`
3. Configure Wrangler secrets

See `CLERK_SETUP.md` for detailed instructions.

#### 2. Club Admin Dashboard
**File**: `club-admin.html` (to be created)
**Features**:
- Manage membership tiers
- Update pricing
- Add/edit green fees
- Update club details
- View analytics

#### 3. Email Verification
**Current**: Auto-approved (verified=1 on creation)
**Production**: Send verification email with token link

## How It Works

### Claim Flow

```
1. User visits club detail page
   ↓
2. Clicks "Claim This Club"
   ↓
3. Signs in with Clerk (if not authenticated)
   ↓
4. System verifies email domain matches club
   ↓
5. Claim is submitted to database
   ↓
6. User redirected to admin dashboard
```

### Domain Verification

The system extracts the expected domain from:
1. Club's website URL (e.g., `standrews.com` from `https://www.standrews.com`)
2. Club's email address (e.g., `golfclub.co.uk` from `info@golfclub.co.uk`)

User's email must match this domain to claim the club.

**Examples**:
- To claim "St Andrews": Need `@standrews.com` email
- To claim "Royal Troon": Need `@royaltroon.com` email

### Membership Tier Types

Pre-defined categories:
- `full` - Full 7-day membership
- `intermediate` - For younger members (typically 18-30)
- `5-day` - Monday-Friday access
- `7-day` - Full week access
- `junior` - Youth members
- `senior` - Older members (55+/65+)
- `couple` - Joint membership for two
- `social` - Clubhouse only
- `country` - For members living far away
- `flexible` - Pay-as-you-go / credits system

## Database Schema

### club_claims
```sql
CREATE TABLE club_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL UNIQUE,  -- One claim per club
    clerk_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    claimed_at TIMESTAMP,
    verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    verified_at TIMESTAMP
);
```

### membership_tiers
```sql
CREATE TABLE membership_tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    tier_name TEXT NOT NULL,         -- e.g., "Full Membership"
    tier_type TEXT NOT NULL,         -- e.g., "full"
    annual_fee REAL,                 -- e.g., 1200.00
    joining_fee REAL,                -- e.g., 500.00
    monthly_fee REAL,                -- e.g., 100.00
    description TEXT,
    min_age INTEGER,                 -- e.g., 18
    max_age INTEGER,                 -- e.g., 30 (for intermediate)
    restrictions TEXT,               -- e.g., "Weekdays only"
    benefits TEXT,                   -- e.g., "Full course access, voting rights"
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER
);
```

### green_fees
```sql
CREATE TABLE green_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    day_type TEXT NOT NULL,         -- "weekday", "weekend", "twilight"
    fee_type TEXT NOT NULL,         -- "18-holes", "9-holes", "day-ticket"
    price REAL NOT NULL,            -- e.g., 45.00
    season TEXT,                    -- "summer", "winter", "year-round"
    description TEXT,
    is_active BOOLEAN DEFAULT 1
);
```

## API Reference

### GET /api/club-claim/status
Query club claim status.

**Parameters**:
- `clubId` (query) - Club ID

**Response**:
```json
{
  "claimed": true,
  "verified": true,
  "claimedAt": "2024-02-26T10:30:00Z",
  "claimedByCurrentUser": false
}
```

### POST /api/club-claim/submit
Submit a club claim.

**Headers**:
- `Authorization: Bearer <clerk-jwt>`
- `Content-Type: application/json`

**Body**:
```json
{
  "clubId": 100000,
  "email": "manager@abbeyhillgc.co.uk",
  "clerk_user_id": "user_2abc123def"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Club claimed successfully"
}
```

**Error Responses**:
- `400` - Missing required fields
- `403` - Email domain doesn't match club
- `404` - Club not found
- `409` - Club already claimed

### GET /api/club/[id]
Get club details including membership data (if claimed).

**Response**:
```json
{
  "club": { /* club details */ },
  "facilities": { /* grouped facilities */ },
  "facilityCount": 6,
  "claimed": true,
  "claimedAt": "2024-02-26T10:30:00Z",
  "membershipTiers": [
    {
      "id": 1,
      "tier_name": "Full Membership",
      "tier_type": "full",
      "annual_fee": 1200.00,
      "joining_fee": 500.00,
      "description": "Unlimited access, 7 days a week"
    }
  ],
  "greenFees": [
    {
      "id": 1,
      "day_type": "weekday",
      "fee_type": "18-holes",
      "price": 45.00,
      "season": "year-round"
    }
  ]
}
```

## Security

### Email Verification
- Only verified email addresses can claim clubs
- Email domain must match club's website/email domain
- One email can claim multiple clubs (if they manage multiple)

### Authorization
- Clerk JWT tokens authenticate users
- Only club claimants can manage their club's data
- API validates tokens on protected endpoints

### Fraud Prevention
- Email domain verification prevents false claims
- Manual admin review can be added
- Audit trail in database (claimed_at, updated_at timestamps)

## Next Steps

1. **Set up Clerk** (See `CLERK_SETUP.md`)
2. **Create admin dashboard** for managing membership data
3. **Add comparison features** to main site
4. **Implement email notifications**
5. **Build admin approval workflow**

## Testing

### Test Club Claiming
1. Choose a club with a known website (e.g., Abbey Hill GC)
2. Create test account with matching domain email
3. Click "Claim This Club"
4. Verify claim is stored in database
5. Check membership/fees can be added

### Test Domain Verification
- ✅ `manager@abbeyhillgc.co.uk` for Abbey Hill GC (abbeyhillgc.co.uk)
- ❌ `user@gmail.com` for Abbey Hill GC (domain mismatch)

## Database Queries

### Check claimed clubs
```sql
SELECT c.name, cc.email, cc.claimed_at, cc.verified
FROM clubs c
JOIN club_claims cc ON c.id = cc.club_id
WHERE cc.verified = 1
ORDER BY cc.claimed_at DESC;
```

### Get membership tiers for a club
```sql
SELECT * FROM membership_tiers
WHERE club_id = 100000 AND is_active = 1
ORDER BY display_order, annual_fee;
```

### Count clubs by claim status
```sql
SELECT 
  COUNT(*) as total_clubs,
  COUNT(cc.id) as claimed_clubs,
  COUNT(CASE WHEN cc.verified = 1 THEN 1 END) as verified_clubs
FROM clubs c
LEFT JOIN club_claims cc ON c.id = cc.club_id;
```

## Files Changed/Created

### New Files
- `CLERK_SETUP.md` - Clerk configuration guide
- `CLUB_CLAIMING_SYSTEM.md` - This file
- `functions/api/club-claim/status.js` - Claim status endpoint
- `functions/api/club-claim/submit.js` - Claim submission endpoint
- `add_claim_tables.sql` - Schema for new tables

### Modified Files
- `schema.sql` - Added 3 new tables
- `club.html` - Added claim UI, auth buttons, modal
- `functions/api/club/[id].js` - Include membership data

### To Create
- `club-admin.html` - Admin dashboard
- `functions/api/membership/` - CRUD endpoints for membership tiers
- `functions/api/green-fees/` - CRUD endpoints for green fees
