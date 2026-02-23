#!/usr/bin/env python3
"""
Fetch golf club data from England Golf, Scottish Golf, and Wales Golf APIs
and generate the clubs_index.json file.
"""

import requests
import json
from pathlib import Path

# API endpoints
APIS = {
    'england': 'https://www.englandgolf.org/wp-admin/admin-ajax.php?action=get_golf_clubs',
    'scotland': 'https://www.scottishgolf.org/wp-admin/admin-ajax.php?action=get_golf_clubs',
    'wales': 'https://www.walesgolf.org/wp-admin/admin-ajax.php?action=get_golf_clubs'
}

def fetch_clubs_by_region(region, url):
    """Fetch clubs from a specific region API"""
    print(f"Fetching {region} clubs...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        clubs = []
        for club in data.get('clubs', []):
            clubs.append({
                'id': club.get('id'),
                'name': club.get('name'),
                'region': region,
                'county': club.get('county'),
                'postcode': club.get('postcode'),
                'latitude': club.get('latitude'),
                'longitude': club.get('longitude'),
                'address': club.get('address'),
                'full_address': club.get('full_address'),
                'town': club.get('town'),
                'phone': club.get('phone')
            })
        
        print(f"✓ Fetched {len(clubs)} clubs from {region}")
        return clubs
    
    except Exception as e:
        print(f"✗ Error fetching {region}: {e}")
        return []

def main():
    """Fetch all clubs and create index file"""
    all_clubs = []
    
    # Fetch from all regions
    for region, url in APIS.items():
        clubs = fetch_clubs_by_region(region, url)
        all_clubs.extend(clubs)
    
    # Create output
    output = {
        'total': len(all_clubs),
        'clubs': all_clubs
    }
    
    # Save to file
    Path('data').mkdir(exist_ok=True)
    output_path = Path('data/clubs_index.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Saved {len(all_clubs)} clubs to {output_path}")
    print(f"  File size: {output_path.stat().st_size / 1024:.1f} KB")

if __name__ == '__main__':
    main()
