#!/usr/bin/env python3
"""
Fetch golf club data from England Golf, Scottish Golf, and Wales Golf APIs
and generate the clubs_index.json file with detailed information.
"""

import requests
import json
import time
from pathlib import Path

# API endpoints
APIS = {
    'england': 'https://www.englandgolf.org/wp-admin/admin-ajax.php?action=get_golf_clubs',
    'scotland': 'https://www.scottishgolf.org/wp-admin/admin-ajax.php?action=get_golf_clubs',
    'wales': 'https://www.walesgolf.org/wp-admin/admin-ajax.php?action=get_golf_clubs'
}

# Detail API endpoints
DETAIL_APIS = {
    'england': 'https://www.englandgolf.org/api/clubs/GetClubDetailsEg?clubId={}',
    'scotland': 'https://www.scottishgolf.org/api/clubs/GetClubDetails?clubId={}',
    'wales': 'https://www.walesgolf.org/api/clubs/GetClubDetails?clubId={}'
}

def fetch_club_details(region, club_id):
    """Fetch detailed information for a specific club"""
    try:
        url = DETAIL_APIS[region].format(club_id)
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        details = response.json()
        
        # Extract useful fields
        return {
            'website': details.get('website') or details.get('Website'),
            'email': details.get('email') or details.get('Email'),
            'description': details.get('description') or details.get('Description'),
            'facilities': details.get('facilities') or details.get('Facilities'),
            'courses': details.get('courses') or details.get('Courses'),
            'holes': details.get('holes') or details.get('Holes'),
            'par': details.get('par') or details.get('Par'),
            'length': details.get('length') or details.get('Length'),
            'course_type': details.get('courseType') or details.get('CourseType'),
            'green_fee': details.get('greenFee') or details.get('GreenFee'),
            'image': details.get('image') or details.get('Image') or details.get('logo') or details.get('Logo'),
        }
    except Exception as e:
        return None


def fetch_clubs_by_region(region, url, fetch_details=False):
    """Fetch clubs from a specific region API"""
    print(f"Fetching {region} clubs...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        clubs = []
        total = len(data.get('clubs', []))
        
        for idx, club in enumerate(data.get('clubs', []), 1):
            club_data = {
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
            }
            
            # Optionally fetch detailed information
            if fetch_details and club_data['id']:
                print(f"  Fetching details for {club_data['name']} ({idx}/{total})...")
                details = fetch_club_details(region, club_data['id'])
                if details:
                    club_data.update(details)
                time.sleep(0.5)  # Be nice to the API
            
            clubs.append(club_data)
        
        print(f"✓ Fetched {len(clubs)} clubs from {region}")
        return clubs
    
    except Exception as e:
        print(f"✗ Error fetching {region}: {e}")
        return []

def main():
    """Fetch all clubs and create index file"""
    import sys
    
    # Check if detailed fetch is requested
    fetch_details = '--detailed' in sys.argv or '-d' in sys.argv
    
    if fetch_details:
        print("\n🔍 Fetching DETAILED club information (this will take longer)...\n")
    else:
        print("\n⚡ Fetching basic club information (use --detailed for more data)...\n")
    
    all_clubs = []
    
    # Fetch from all regions
    for region, url in APIS.items():
        clubs = fetch_clubs_by_region(region, url, fetch_details)
        all_clubs.extend(clubs)
    
    # Create output
    output = {
        'total': len(all_clubs),
        'detailed': fetch_details,
        'clubs': all_clubs
    }
    
    # Save to file
    Path('data').mkdir(exist_ok=True)
    output_path = Path('data/clubs_index.json')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Saved {len(all_clubs)} clubs to {output_path}")
    print(f"  File size: {output_path.stat().st_size / 1024:.1f} KB")
    
    if fetch_details:
        # Count clubs with additional data
        with_images = sum(1 for c in all_clubs if c.get('image'))
        with_website = sum(1 for c in all_clubs if c.get('website'))
        with_email = sum(1 for c in all_clubs if c.get('email'))
        
        print(f"\n📊 Enhanced data:")
        print(f"  Clubs with images: {with_images}")
        print(f"  Clubs with websites: {with_website}")
        print(f"  Clubs with emails: {with_email}")

if __name__ == '__main__':
    main()
