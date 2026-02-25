#!/usr/bin/env python3
import requests
import json
import time

# Test with just one club
club_id = 102383
url = f"https://www.englandgolf.org/api/clubs/GetClubDetailsEg?clubId={club_id}"

response = requests.get(url)
data = response.json()

# Extract what we need
extracted = {
    'website': data.get('Website'),
    'email': data.get('Email'),
    'description': data.get('FacilityDescription'),
    'holes': data.get('NoOfHoles'),
    'logo': data.get('LogoImage')
}

print(json.dumps(extracted, indent=2))
