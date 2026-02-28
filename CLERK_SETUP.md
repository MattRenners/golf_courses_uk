# Clerk Authentication Setup Guide

## Overview
This project uses [Clerk](https://clerk.com) for user authentication, allowing golf club representatives to claim and manage their club's information.

## Setup Steps

### 1. Create Clerk Account
1. Go to https://clerk.com
2. Sign up for a free account
3. Create a new application

### 2. Get Your Keys
From your Clerk Dashboard:
- **Publishable Key**: `pk_test_...` or `pk_live_...`
- **Secret Key**: `sk_test_...` or `sk_live_...`

### 3. Configure the Application

#### Update `club.html`
Replace placeholder with your Publishable Key:

```javascript
// Line ~11-12
data-clerk-publishable-key="YOUR_CLERK_PUBLISHABLE_KEY"
src="https://[your-clerk-frontend-api].clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
```

Find your Frontend API URL in Clerk Dashboard → Settings → API Keys

Change to:
```javascript
data-clerk-publishable-key="pk_test_YOUR_KEY_HERE"
src="https://your-app.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
```

Also update Line ~497:
```javascript
clerk = new Clerk('YOUR_CLERK_PUBLISHABLE_KEY');
```

To:
```javascript
clerk = new Clerk('pk_test_YOUR_KEY_HERE');
```

### 4. Configure Clerk Dashboard Settings

#### Email Settings
- Enable **Email verification**
- Customize email templates for branding

#### Social Logins (Optional)
- Enable Google, Microsoft, etc. for easier sign-ins

#### User Profile Fields
Recommended fields:
- Email (required) - Used for domain verification
- Name (optional)
- Phone (optional)

### 5. Set Up Wrangler Secrets (for API)
Store the secret key as an environment variable:

```bash
npx wrangler secret put CLERK_SECRET_KEY
# Enter your sk_test_... key when prompted
```

### 6. Test Authentication Flow

1. Deploy the site
2. Visit a club detail page
3. Click "Claim This Club"
4. You should see Clerk's sign-in modal
5. Create an account with an email matching the club's domain
6. Submit claim

## How It Works

### Email Domain Verification
When a user claims a club:
1. System extracts domain from club's website or email
2. User must sign in with email from that domain
3. Example: To claim "St Andrews Golf Club" (standrews.com), user needs @standrews.com email

### Claim Process
1. User signs in via Clerk
2. Clicks "Claim This Club"
3. System verifies email domain matches
4. Creates record in `club_claims` table
5. User can now manage membership pricing

### Database Tables

#### `club_claims`
- `club_id` - Which club is claimed
- `clerk_user_id` - Clerk's user ID
- `email` - User's verified email
- `verified` - Whether claim is approved
- `verification_token` - For email verification

#### `membership_tiers`
- Store pricing for different membership types
- Full, Intermediate, Junior, Senior, etc.

#### `green_fees`
- Store visitor pricing
- Weekday, Weekend, Twilight rates

## API Endpoints

### Check Claim Status
```
GET /api/club-claim/status?clubId=123
```

Returns:
```json
{
  "claimed": true,
  "verified": true,
  "claimedAt": "2024-02-26T10:30:00Z"
}
```

### Submit Claim
```
POST /api/club-claim/submit
Authorization: Bearer <clerk-jwt-token>

{
  "clubId": 123,
  "email": "manager@golfclub.com",
  "clerk_user_id": "user_abc123"
}
```

### Get Club Details (with membership data)
```
GET /api/club/123
```

Returns club info plus membership tiers and green fees if claimed.

## Security Considerations

### Production Checklist
- [ ] Use `pk_live_` key in production
- [ ] Implement proper Clerk JWT validation in API endpoints
- [ ] Add rate limiting to claim endpoints
- [ ] Send email notifications when clubs are claimed
- [ ] Add admin approval workflow for claims
- [ ] Implement audit logging

### JWT Validation
In production, validate Clerk JWTs:

```javascript
import { verifyToken } from '@clerk/backend';

const token = request.headers.get('Authorization').replace('Bearer ', '');
const verified = await verifyToken(token, {
  secretKey: env.CLERK_SECRET_KEY
});
```

## Next Steps

1. **Create Admin Dashboard** (`club-admin.html`)
   - Manage membership tiers
   - Update green fees
   - Edit club details

2. **Add Email Notifications**
   - Welcome email when club is claimed
   - Notify when pricing is updated

3. **Implement Approval Workflow**
   - Admin reviews claims before verification
   - Prevent false claims

4. **Build Comparison Features**
   - Compare membership prices across clubs
   - Filter by price range
   - Sort by value

## Support

- **Clerk Documentation**: https://clerk.com/docs
- **Clerk Discord**: https://clerk.com/discord
- **Cloudflare D1 Docs**: https://developers.cloudflare.com/d1/
