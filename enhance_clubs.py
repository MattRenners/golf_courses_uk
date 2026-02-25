#!/usr/bin/env python3
"""
Enhance existing golf club data with detailed information from APIs.
Gets logos, websites, emails, member counts, social media, and more.
"""

import requests
import json
import time
from pathlib import Path

def fetch_club_details(region, club_id):
    """Fetch detailed information for a single club"""
    api_urls = {
        'england': f'https://www.englandgolf.org/api/clubs/GetClubDetailsEg?clubId={club_id}',
        'scotland': f'https://www.scottishgolf.org/api/clubs/GetClubDetails?clubId={club_id}',
        'wales': f'https://www.walesgolf.org/api/clubs/GetClubDetails?clubId={club_id}'
    }
    
    try:
        response = requests.get(api_urls[region], timeout=10)
        response.raise_for_status()
        data = response.json()

        # Extract all useful fields
        details = {
            'website': data.get('Website'),
            'email': data.get('Email'),
            'description': data.get('FacilityDescription'),
            'amenities': data.get('AmenitiesDescription'),
            'holes': data.get('NoOfHoles'),
            'image': data.get('LogoImage'),
            'founding_year': data.get('FoundingYear'),
            'head_pro_name': data.get('HeadProName'),
            'head_pro_email': data.get('HeadProEmail'),
            'pro_shop_phone': data.get('ProShopPhone'),
            'manager_name': data.get('ManagerName'),
            'total_members': data.get('TotalMembers'),
            'total_men': data.get('TotalMen'),
            'total_women': data.get('TotalWomen'),
            'adult_men': data.get('AdultMen'),
            'adult_women': data.get('AdultWomen'),
            'junior_men': data.get('JuniorMen'),
            'junior_women': data.get('JuniorWomen'),
            'tee_booking_url': data.get('TeeBookingUrl'),
            'membership_url': data.get('MembershipUrl'),
            'facebook_url': data.get('FacebookUrl'),
            'twitter_url': data.get('TwitterUrl'),
            'instagram_url': data.get('InstagramUrl'),
            'facility_types': data.get('FacilityTypes'),
        }
        
        # Only return non-None values to save space
        return {k: v for k, v in details.items() if v is not None}
    except Exception as e:
        return None

def enhance_clubs(input_file='data/clubs_index.json', output_file='data/clubs_index.json'):
    """Load existing clubs and enhance with detailed data"""
    print(f"\nLoading {input_file}...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        clubs = data.get('clubs', [])
        total = len(clubs)
    
    print(f"Found {total} clubs")
    print(f"Est. time: {(total * 0.5) / 60:.1f} minutes\n")
    
    enhanced = []
    stats = {
        'images': 0, 'websites': 0, 'emails': 0, 'descriptions': 0, 
        'members': 0, 'social': 0, 'bookings': 0, 'errors': 0
    }
    start = time.time()
    
    for i, club in enumerate(clubs, 1):
        if i % 100 == 0 or i == 1:
            elapsed = time.time() - start
            rate = i / elapsed if elapsed > 0 else 0
            eta = (total - i) / rate / 60 if rate > 0 else 0
            print(f"[{i}/{total}] {club.get('name', '')[:50]:<50} ETA: {eta:.1f}m")
        
        details = fetch_club_details(club.get('region', '').lower(), club.get('id'))
        
        if details:
            # Merge all details into club
            for key, value in details.items():
                club[key] = value
                
            # Update stats
            if details.get('image'): stats['images'] += 1
            if details.get('website'): stats['websites'] += 1
            if details.get('email'): stats['emails'] += 1
            if details.get('description'): stats['descriptions'] += 1
            if details.get('total_members'): stats['members'] += 1
            if details.get('facebook_url') or details.get('twitter_url') or details.get('instagram_url'):
                stats['social'] += 1
            if details.get('tee_booking_url'): stats['bookings'] += 1
        else:
            stats['errors'] += 1
        
        enhanced.append(club)
        time.sleep(0.5)
    
    output_data = {'total': len(enhanced), 'detailed': True, 'clubs': enhanced}
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    size_kb = Path(output_file).stat().st_size / 1024
    duration = (time.time() - start) / 60
    
    print(f"\n✓ Saved to {output_file}")
    print(f"  Size: {size_kb:.1f} KB")
    print(f"  Images: {stats['images']}")
    print(f"  Websites: {stats['websites']}")
    print(f"  Emails: {stats['emails']}")
    print(f"  Descriptions: {stats['descriptions']}")
    print(f"  Member data: {stats['members']}")
    print(f"  Social media: {stats['social']}")
    print(f"  Online booking: {stats['bookings']}")
    print(f"  Errors: {stats['errors']}")
    print(f"  Total time: {duration:.1f} minutes")

if __name__ == '__main__':
    enhance_clubs()
