#!/usr/bin/env python3
"""
Import club facilities using normalized schema:
1. Populate facility_types reference table (~47 standard types)
2. Populate club_facilities junction table (only available facilities per club)
"""

import json
import requests
import time
import subprocess
from pathlib import Path

FACILITY_APIS = {
    'England': 'https://www.englandgolf.org/api/clubs/GetClubFacilityTypes',
    'Scotland': 'https://www.scottishgolf.org/api/clubs/GetClubFacilityTypes',
    'Wales': 'https://www.walesgolf.org/api/clubs/GetClubFacilityTypes'
}

def populate_facility_types():
    """Fetch standard facility types and populate reference table."""
    print("🔧 Populating facility_types reference table...")
    
    # Fetch from England API to get all standard facility types
    response = requests.get(f"{FACILITY_APIS['England']}?clubId=100000")
    data = response.json()
    
    facilities = data.get('FacilityTypes', [])
    groups = {g['FacilityTypeGroupId']: g['FacilityTypeGroupName'] 
              for g in data.get('FacilityTypeGroups', [])}
    
    print(f"   Found {len(facilities)} standard facility types")
    
    # Build INSERT statements
    inserts = []
    for f in facilities:
        fid = f['FacilityTypeId']
        name = f['TypeName'].replace("'", "''")
        icon = f.get('Icon', '').replace("'", "''")
        group_id = f.get('FacilityTypeGroupId', 0)
        group_name = groups.get(group_id, '').replace("'", "''")
        
        insert = f"""INSERT OR REPLACE INTO facility_types (id, name, icon, facility_group_id, facility_group_name) VALUES ({fid}, '{name}', '{icon}', {group_id}, '{group_name}')"""
        inserts.append(insert)
    
    # Execute
    sql_content = ";\n".join(inserts) + ";"
    sql_file = Path('facility_types_import.sql')
    sql_file.write_text(sql_content)
    
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', 
         '--remote', '--file', str(sql_file)],
        capture_output=True,
        text=True
    )
    
    sql_file.unlink()
    
    if result.returncode != 0:
        print(f"   ❌ Error: {result.stderr}")
        return False
    
    print(f"   ✅ Populated {len(facilities)} facility types")
    return True

def get_all_club_ids():
    """Get all club IDs from database."""
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

def fetch_club_facilities(club_id, region):
    """Fetch available facilities for a club."""
    api_url = FACILITY_APIS.get(region)
    if not api_url:
        return []
    
    try:
        response = requests.get(f"{api_url}?clubId={club_id}", timeout=10)
        response.raise_for_status()
        data = response.json()
        
        facilities = data.get('FacilityTypes', [])
        # Only return available facilities
        return [f for f in facilities if f.get('IsAvailable', False)]
    except:
        return []

def import_facilities_batch(inserts, batch_num):
    """Import a batch of facility records."""
    if not inserts:
        return True
    
    sql_content = ";\n".join(inserts) + ";"
    sql_file = Path(f'club_facilities_batch_{batch_num}.sql')
    sql_file.write_text(sql_content)
    
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', 
         '--remote', '--file', str(sql_file)],
        capture_output=True,
        text=True
    )
    
    sql_file.unlink()
    
    if result.returncode != 0:
        print(f"  ❌ Error in batch {batch_num}")
        return False
    
    return True

def main():
    """Main import process."""
    print("🏌️ CaddyCompare - Normalized Facilities Import")
    print("=" * 60)
    
    # Step 1: Populate reference table
    if not populate_facility_types():
        return
    
    time.sleep(1)
    
    # Step 2: Get all clubs
    clubs = get_all_club_ids()
    
    # Step 3: Import club facilities (only available ones)
    print("\n🔄 Importing club facilities...")
    all_inserts = []
    processed = 0
    facilities_count = 0
    clubs_with_facilities = 0
    batch_num = 1
    
    for club in clubs:
        club_id = club['id']
        region = club['region']
        
        processed += 1
        
        if processed % 100 == 0:
            print(f"   Progress: {processed}/{len(clubs)} clubs, {facilities_count} facilities...")
        
        # Fetch only available facilities
        facilities = fetch_club_facilities(club_id, region)
        
        if facilities:
            clubs_with_facilities += 1
            facilities_count += len(facilities)
            
            # Build lightweight inserts (just club_id, facility_type_id, is_available)
            for f in facilities:
                fid = f['FacilityTypeId']
                quantity = f.get('Quantity', 0)
                insert = f"INSERT OR IGNORE INTO club_facilities (club_id, facility_type_id, is_available, quantity) VALUES ({club_id}, {fid}, 1, {quantity})"
                all_inserts.append(insert)
            
            # Batch upload every 1000 records
            if len(all_inserts) >= 1000:
                import_facilities_batch(all_inserts, batch_num)
                print(f"   ✅ Batch {batch_num} uploaded ({len(all_inserts)} records)")
                batch_num += 1
                all_inserts = []
        
        # Rate limiting
        time.sleep(0.3)
    
    # Upload remaining
    if all_inserts:
        import_facilities_batch(all_inserts, batch_num)
        print(f"   ✅ Batch {batch_num} uploaded ({len(all_inserts)} records)")
    
    print("\n" + "=" * 60)
    print(f"✅ Import complete!")
    print(f"   Clubs processed: {processed}")
    print(f"   Clubs with facilities: {clubs_with_facilities}")
    print(f"   Total facility records: {facilities_count}")
    
    # Verify
    print("\n📊 Database verification:")
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', '--remote', '--json',
         '--command', 'SELECT COUNT(*) as count FROM facility_types'],
        capture_output=True,
        text=True
    )
    output = json.loads(result.stdout)
    if isinstance(output, list) and len(output) > 0:
        count = output[0]['results'][0]['count']
        print(f"   Facility types (reference): {count}")
    
    result = subprocess.run(
        ['npx', 'wrangler', 'd1', 'execute', 'golf-clubs-uk', '--remote', '--json',
         '--command', 'SELECT COUNT(*) as count FROM club_facilities'],
        capture_output=True,
        text=True
    )
    output = json.loads(result.stdout)
    if isinstance(output, list) and len(output) > 0:
        count = output[0]['results'][0]['count']
        print(f"   Club facility records: {count}")
    
    print("\n💡 To query clubs with specific facilities:")
    print("   SELECT c.name FROM clubs c")
    print("   JOIN club_facilities cf ON c.id = cf.club_id")
    print("   JOIN facility_types ft ON cf.facility_type_id = ft.id")
    print("   WHERE ft.name = 'Driving Range' AND cf.is_available = 1")

if __name__ == '__main__':
    main()
