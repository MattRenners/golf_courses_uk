#!/usr/bin/env python3
"""
Fetch and import club facility types into D1 database.
Creates relational data linking clubs to their facilities.
"""

import json
import requests
import time
import subprocess
from pathlib import Path

# API endpoints by region
FACILITY_APIS = {
    'England': 'https://www.englandgolf.org/api/clubs/GetClubFacilityTypes',
    'Scotland': 'https://www.scottishgolf.org/api/clubs/GetClubFacilityTypes',
    'Wales': 'https://www.walesgolf.org/api/clubs/GetClubFacilityTypes'
}

def get_all_club_ids():
    """Get all club IDs from D1 database."""
    print("📊 Fetching club IDs from database...")
    
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', '--remote', '--json',
         '--command', 'SELECT id, name, region FROM clubs ORDER BY id'],
        capture_output=True,
        text=True
    )
    
    output = json.loads(result.stdout)
    clubs = []
    if isinstance(output, list) and len(output) > 0:
        clubs = output[0].get('results', [])
    
    print(f"✅ Found {len(clubs)} clubs")
    return clubs

def fetch_facility_types(club_id, region):
    """Fetch facility types for a club from the appropriate API."""
    api_url = FACILITY_APIS.get(region)
    if not api_url:
        return None
    
    try:
        response = requests.get(f"{api_url}?clubId={club_id}", timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Check if we got facility types
        if 'FacilityTypes' in data and isinstance(data['FacilityTypes'], list):
            return data['FacilityTypes']
        
        return None
    except Exception as e:
        # Silently skip errors (many clubs won't have data)
        return None

def build_facility_inserts(club_id, facilities):
    """Build INSERT statements for facilities."""
    inserts = []
    
    for facility in facilities:
        facility_type_id = facility.get('FacilityTypeId', 0)
        facility_name = facility.get('TypeName', '').replace("'", "''")
        quantity = facility.get('Quantity', 0)
        is_available = 1 if facility.get('IsAvailable', False) else 0
        icon = facility.get('Icon', '').replace("'", "''")
        facility_type_group_id = facility.get('FacilityTypeGroupId', 0)
        
        if not facility_name:
            continue
        
        insert = f"""INSERT OR IGNORE INTO club_facilities (club_id, facility_type_id, facility_name, quantity, is_available, icon, facility_type_group_id) VALUES ({club_id}, {facility_type_id}, '{facility_name}', {quantity}, {is_available}, '{icon}', {facility_type_group_id})"""
        
        inserts.append(insert)
    
    return inserts

def import_facilities_batch(inserts, batch_num):
    """Import a batch of facility records."""
    if not inserts:
        return True
    
    # Create SQL file
    sql_content = ";\n".join(inserts) + ";"
    sql_file = Path(f'facilities_batch_{batch_num}.sql')
    sql_file.write_text(sql_content)
    
    print(f"  📤 Uploading batch {batch_num} ({len(inserts)} facilities)...")
    
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', 
         '--remote', '--file', str(sql_file)],
        capture_output=True,
        text=True
    )
    
    # Clean up
    sql_file.unlink()
    
    if result.returncode != 0:
        print(f"  ❌ Error in batch {batch_num}: {result.stderr}")
        return False
    
    print(f"  ✅ Batch {batch_num} complete")
    return True

def main():
    """Main import process."""
    print("🏌️ CaddyCompare - Facility Types Import")
    print("=" * 50)
    
    # Get all clubs
    clubs = get_all_club_ids()
    
    # Track progress
    all_inserts = []
    processed = 0
    facilities_found = 0
    batch_num = 1
    clubs_with_facilities = 0
    
    for club in clubs:
        club_id = club['id']
        club_name = club['name']
        region = club['region']
        
        processed += 1
        
        if processed % 50 == 0:
            print(f"📊 Progress: {processed}/{len(clubs)} clubs processed, {facilities_found} facilities found...")
        
        # Fetch facilities
        facilities = fetch_facility_types(club_id, region)
        
        if facilities:
            clubs_with_facilities += 1
            facilities_found += len(facilities)
            inserts = build_facility_inserts(club_id, facilities)
            all_inserts.extend(inserts)
            
            # Import in batches of 500 facility records
            if len(all_inserts) >= 500:
                import_facilities_batch(all_inserts, batch_num)
                batch_num += 1
                all_inserts = []
        
        # Rate limiting
        time.sleep(0.3)
    
    # Import remaining
    if all_inserts:
        import_facilities_batch(all_inserts, batch_num)
    
    print("\n" + "=" * 50)
    print(f"✅ Import complete!")
    print(f"   Clubs processed: {processed}")
    print(f"   Clubs with facilities: {clubs_with_facilities}")
    print(f"   Total facilities found: {facilities_found}")
    print(f"   Batches uploaded: {batch_num}")
    
    # Verify import
    print("\n📊 Verifying database...")
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', '--remote', '--json',
         '--command', 'SELECT COUNT(*) as count FROM club_facilities'],
        capture_output=True,
        text=True
    )
    
    output = json.loads(result.stdout)
    if isinstance(output, list) and len(output) > 0:
        count = output[0]['results'][0]['count']
        print(f"✅ Total facilities in database: {count}")

if __name__ == '__main__':
    main()
