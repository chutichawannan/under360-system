"""Validate deployment. pwa/ is now canonical; never overwrite it from the old standalone snapshot."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[2]
assets = root / 'pwa/ing_assets'
catalogue = json.loads((assets / 'catalogue.json').read_text())
items = [item for group in catalogue['groups'] for item in group['items']]
keys = [item['key'] for item in items]
assert len(keys) == len(set(keys)), 'Duplicate SKU'
assignment = json.loads((assets / 'assignments.json').read_text())
assigned = [key for staff in assignment['staff'] for key in staff['item_keys']]
assert len(assigned) == len(set(assigned)) and set(assigned) == set(keys)
for item in items:
    if item['img']:
        assert (root / item['img'].lstrip('/')).is_file(), item['name']
for file in ['fresh.js', 'sync.js', 'counting.js', 'fresh.css', 'photo-list.css', 'staff.css']:
    assert (assets / file).is_file(), file
assert '/gate.js' not in (root / 'pwa/ing_stock.html').read_text()
print(f'Validated {len(items)} SKUs and {len(assignment["staff"])} staff; no files overwritten')
