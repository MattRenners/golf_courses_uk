#!/usr/bin/env python3
"""
Create a version without images for git
"""
import json

print("Loading full data...")
with open('data/clubs_index.json', 'r') as f:
    data = json.load(f)

print(f"Processing {data['total']} clubs...")

# Remove image field from all clubs
for club in data.get('clubs', []):
    club.pop('image', None)

# Save without images
with open('data/clubs_index_no_images.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

import os
size = os.path.getsize('data/clubs_index_no_images.json') / 1024
print(f"Saved to clubs_index_no_images.json ({size:.1f} KB)")
print("You can commit this smaller file to git")
