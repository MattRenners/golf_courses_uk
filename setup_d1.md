# Cloudflare D1 Database Setup for Golf Clubs

## 1. Create D1 Database

```bash
# Login to Cloudflare (if not already)
npx wrangler login

# Create the database
npx wrangler d1 create golf-clubs-uk

# This will output your database ID - save it!
```

## 2. Create Database Schema

Create `schema.sql`:

```sql
CREATE TABLE clubs (
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

CREATE INDEX idx_region ON clubs(region);
CREATE INDEX idx_postcode ON clubs(postcode);
CREATE INDEX idx_name ON clubs(name);
```

Apply schema:
```bash
npx wrangler d1 execute golf-clubs-uk --file=schema.sql
```

## 3. Update wrangler.toml

Add to your `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "golf-clubs-uk"
database_id = "YOUR_DATABASE_ID_HERE"
```

## 4. Create API Functions

Create `functions/api/clubs.js` for searching:

```javascript
export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const query = searchParams.get('q') || '';
  const region = searchParams.get('region') || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  let sql = 'SELECT * FROM clubs WHERE 1=1';
  const params = [];

  if (region && region !== 'all') {
    sql += ' AND region = ?';
    params.push(region);
  }

  if (query) {
    sql += ' AND (name LIKE ? OR postcode LIKE ? OR address LIKE ?)';
    const searchTerm = `%${query}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' LIMIT ?';
  params.push(limit);

  const { results } = await context.env.DB.prepare(sql).bind(...params).all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

Create `functions/api/clubs/nearby.js` for location search:

```javascript
export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const lat = parseFloat(searchParams.get('lat'));
  const lon = parseFloat(searchParams.get('lon'));
  const limit = parseInt(searchParams.get('limit') || '20');

  // Calculate distance using Haversine formula in SQL
  const sql = `
    SELECT *,
      (3959 * acos(cos(radians(?)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
      sin(radians(latitude)))) AS distance
    FROM clubs
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY distance
    LIMIT ?
  `;

  const { results } = await context.env.DB.prepare(sql)
    .bind(lat, lon, lat, limit)
    .all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## 5. Import Data

I'll create a Python script to import your existing data and fetch enhanced data directly into D1.

