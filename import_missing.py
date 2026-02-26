#!/usr/bin/env python3
"""Import missing clubs to D1 database."""
import json
import requests
import time
import subprocess
from pathlib import Path

APIS = {
    'england': 'https://www.englandgolf.org/api/clubs/GetClubDetailsEg?clubId={}',
    'scotland': 'https://www.scottishgolf.org/api/clubs/GetClubDetails?clubId={}',
    'wales': 'https://www.walesgolf.org/api/clubs/GetClubDetails?clubId={}'
}

def escape_sql_string(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"

def get_imported_ids():
    """Get list of already imported club IDs from D1."""
    try:
        result = subprocess.run(
            ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', '--remote',
             '--command', 'SELECT id FROM clubs ORDER BY id'],
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse IDs from output
        ids = set()
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line.isdigit():
                ids.add(int(line))
        
        return ids
    except:
        print("⚠️  Could not fetch existing IDs, will attempt to import all")
        return set()

def fetch_club_details(region, club_id):
    """Fetch detailed club information from regional API."""
    try:
        api_url = APIS[region].format(club_id)
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        details = {}
        field_map = {
            'Website': 'website',
            'Email': 'email',
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
    except:
        return {}

def build_insert_query(club, details):
    """Build SQL INSERT query."""
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
    
    for field in ['website', 'email', 'description', 'amenities', 'holes',
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
    
    return f"INSERT OR IGNORE INTO clubs ({', '.join(fields)}) VALUES ({', '.join(values)});"

def main():
    # Load all clubs
    with open('data/clubs_index.json', 'r') as f:
        data = json.load(f)
    
    all_clubs = data['clubs']
    print(f"📊 Total clubs in JSON: {len(all_clubs)}")
    
    # Get already imported IDs
    print("🔍 Checking which clubs are already in D1...")
    imported_ids = get_imported_ids()
    print(f"✅ Found {len(imported_ids)} clubs already in D1")
    
    # Find missing clubs
    missing_clubs = [c for c in all_clubs if c['id'] not in imported_ids]
    print(f"📝 Need to import {len(missing_clubs)} missing clubs\n")
    
    if not missing_clubs:
        print("✅ All clubs already imported!")
        return
    
    # Import in batches of 25
    batch_size = 25
    total = len(missing_clubs)
    
    for batch_start in range(0, total, batch_size):
        batch_end = min(batch_start + batch_size, total)
        batch = missing_clubs[batch_start:batch_end]
        
        sql_lines = []
        for i, club in enumerate(batch):
            idx = batch_start + i + 1
            if idx % 10 == 1 or idx == total:
                print(f"[{idx}/{total}] Processing {club['name']}...")
            
            details = fetch_club_details(club['region'], club['id'])
            query = build_insert_query(club, details)
            sql_lines.append(query)
            time.sleep(0.5)
        
        # Execute batch
        batch_file = f'missing_batch_{batch_start}_{batch_end}.sql'
        with open(batch_file, 'w') as f:
            f.write('\n'.join(sql_lines))
        
        print(f"📤 Uploading batch {batch_start}-{batch_end}...")
        try:
            subprocess.run(
                ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', '--remote',
                 '--file', batch_file],
                capture_output=True,
                text=True,
                check=True
            )
            print(f"✅ Batch imported\n")
            Path(batch_file).unlink()
        except subprocess.CalledProcessError as e:
            print(f"❌ Error: {e.stderr}")
            print(f"   Keeping {batch_file}\n")
    
    print("\n🎉 Import complete!")

if __name__ == '__main__':
    main()
