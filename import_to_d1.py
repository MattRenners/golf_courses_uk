#!/usr/bin/env python3
"""
Import enhanced golf club data into Cloudflare D1 database.
Fetches detailed information from regional APIs and inserts into D1.
"""
import json
import requests
import time
import subprocess
from pathlib import Path

# Regional API endpoints
APIS = {
    'england': 'https://www.englandgolf.org/api/clubs/GetClubDetailsEg?clubId={}',
    'scotland': 'https://www.scottishgolf.org/api/clubs/GetClubDetails?clubId={}',
    'wales': 'https://www.walesgolf.org/api/clubs/GetClubDetails?clubId={}'
}

def fetch_club_details(region, club_id):
    """Fetch detailed club information from regional API."""
    try:
        api_url = APIS[region].format(club_id)
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract all available fields (excluding image for now - too large for SQL statements)
        details = {}
        field_map = {
            'Website': 'website',
            'Email': 'email',
            # 'LogoImage': 'image',  # Skip image - base64 data too large for SQL INSERT
            'FacilityDescription': 'description',
            'AmenitiesDescription': 'amenities',
            'NoOfHoles': 'holes',
            'FoundingYear': 'founding_year',
            'HeadProName': 'head_pro_name',
            'HeadProEmail': 'head_pro_email',
            'ProShopPhone': 'pro_shop_phone',
            'ManagerName': 'manager_name',
            'TotalMembers': 'total_members',
            'TotalMen': 'total_men',
            'TotalWomen': 'total_women',
            'AdultMen': 'adult_men',
            'AdultWomen': 'adult_women',
            'JuniorMen': 'junior_men',
            'JuniorWomen': 'junior_women',
            'TeeBookingUrl': 'tee_booking_url',
            'MembershipUrl': 'membership_url',
            'FacebookUrl': 'facebook_url',
            'TwitterUrl': 'twitter_url',
            'InstagramUrl': 'instagram_url',
            'FacilityTypes': 'facility_types'
        }
        
        for api_field, db_field in field_map.items():
            value = data.get(api_field)
            if value is not None and value != '':
                if isinstance(value, list):
                    details[db_field] = ','.join(str(v) for v in value)
                else:
                    details[db_field] = value
        
        return details
    except Exception as e:
        print(f"  ⚠️  Error fetching details: {e}")
        return {}

def escape_sql_string(value):
    """Escape single quotes in SQL strings."""
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"

def build_insert_query(club, details):
    """Build SQL INSERT query for a club with details."""
    fields = ['id', 'name', 'region', 'address', 'town', 'county', 'postcode', 
              'phone', 'latitude', 'longitude']
    values = [
        str(club['id']),
        escape_sql_string(club.get('name')),
        escape_sql_string(club.get('region')),
        escape_sql_string(club.get('address')),
        escape_sql_string(club.get('town')),
        escape_sql_string(club.get('county')),
        escape_sql_string(club.get('postcode')),
        escape_sql_string(club.get('phone')),
        str(club.get('latitude')) if club.get('latitude') else 'NULL',
        str(club.get('longitude')) if club.get('longitude') else 'NULL'
    ]
    
    # Add enhanced fields
    for field in ['website', 'email', 'image', 'description', 'amenities', 'holes',
                  'founding_year', 'head_pro_name', 'head_pro_email', 'pro_shop_phone',
                  'manager_name', 'total_members', 'total_men', 'total_women',
                  'adult_men', 'adult_women', 'junior_men', 'junior_women',
                  'tee_booking_url', 'membership_url', 'facebook_url', 'twitter_url',
                  'instagram_url', 'facility_types']:
        if field in details:
            fields.append(field)
            if field in ['holes', 'founding_year', 'total_members', 'total_men', 
                        'total_women', 'adult_men', 'adult_women', 'junior_men', 'junior_women']:
                values.append(str(details[field]))
            else:
                values.append(escape_sql_string(details[field]))
    
    query = f"INSERT INTO clubs ({', '.join(fields)}) VALUES ({', '.join(values)});"
    return query

def import_clubs(batch_size=50):
    """Import all clubs with enhanced data into D1."""
    # Load existing clubs
    with open('data/clubs_index.json', 'r') as f:
        data = json.load(f)
    
    clubs = data['clubs']
    total = len(clubs)
    print(f"📊 Found {total} clubs to import")
    print(f"⚙️  Batch size: {batch_size} clubs per SQL file (images excluded)")
    print()
    
    start_time = time.time()
    imported = 0
    
    for batch_start in range(0, total, batch_size):
        batch_end = min(batch_start + batch_size, total)
        batch = clubs[batch_start:batch_end]
        
        # Build SQL for this batch
        sql_lines = []
        for club in batch:
            imported += 1
            if imported % 10 == 1 or imported == total:
                print(f"[{imported}/{total}] Processing {club['name']}...")
            
            # Fetch enhanced details
            details = fetch_club_details(club['region'], club['id'])
            
            # Build INSERT query
            query = build_insert_query(club, details)
            sql_lines.append(query)
            
            # Rate limiting
            time.sleep(0.5)
        
        # Write batch SQL file
        batch_file = f'import_batch_{batch_start}_{batch_end}.sql'
        with open(batch_file, 'w') as f:
            f.write('\n'.join(sql_lines))
        
        # Execute batch
        print(f"📤 Executing batch {batch_start}-{batch_end}...")
        try:
            result = subprocess.run(
                ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', '--remote', 
                 '--file', batch_file],
                capture_output=True,
                text=True,
                check=True
            )
            print(f"✅ Batch imported successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Error executing batch: {e.stderr}")
            print(f"   Keeping {batch_file} for inspection")
            continue
        
        # Clean up batch file if successful
        Path(batch_file).unlink()
        
        # Progress update
        elapsed = time.time() - start_time
        rate = imported / elapsed
        remaining = total - imported
        eta_seconds = remaining / rate if rate > 0 else 0
        eta_minutes = int(eta_seconds / 60)
        
        print(f"⏱️  Progress: {imported}/{total} ({imported/total*100:.1f}%) - "
              f"ETA: {eta_minutes}m\n")
    
    total_time = time.time() - start_time
    print(f"\n✅ Import complete!")
    print(f"📊 Total clubs: {total}")
    print(f"⏱️  Total time: {int(total_time/60)}m {int(total_time%60)}s")

if __name__ == '__main__':
    import_clubs()
