# Stock integration — 24 September 2026

Branch: gpt/stock-entry
Page: /pwa/ing_stock.html. Assets: /pwa/ing_assets/.
Canonical catalogue: 239 local reviewed items. No mapping to old 302-item dataset.
Each completed round is stored as kitchen_data key ing_count_v1_<uuid>. Insert ignores duplicate keys and verifies by reading back. Local pending rounds retained for retry; historical local rounds are not silently uploaded. Draft stays device-local.
Tests: node scripts/ing/test-sync.mjs (mocked transport; no production count writes). Browser verified 239-item page and successful production history read (empty).
Isolated live database write/readback and independent read passed (see live-check.json). No real inventory count written by testing.
User confirmed no other chat is editing Staff. Added a direct shortcut above the existing room cards.
Proposed link: href="/pwa/ing_stock.html" labelled “นับวัตถุดิบ”, accessible from Staff home, relative URL preserves staff.360foodbox.com. /ing alias can follow separately.
Staff home adds only the shortcut and its CSS. No changes to core files, authentication, roles, or existing stock/recipe tables.
Existing gate is reused; it is not database authorization. No RLS policies were added or changed.

## Staff counting release

Canonical editable source is now pwa/ing_stock.html and pwa/ing_assets/ (not the historical standalone app). package_stock.py validates rather than overwriting the deployed app. Catalogue is 243 items, including new seabass with no photo yet. Runtime allocation is pwa/ing_assets/assignments.json; scripts/ing/assignments.json and assignments.md are review copies. Owner's exception: Thoi owns seabass, salmon and shrimp; Aung retains dried shrimp and shrimp roe. Counts: oo 28, Mokhong 55, Vo 20, Thoi 37, Aung 103.

Staff picker is attribution only, not Google authentication or permission enforcement. Each staff member has a separate device-local draft. Existing unnamed draft remains accessible as legacy draft. Complete confirmation generates zeros ONLY within the selected person's full assignment snapshot, regardless of search/category filters. Partial rounds leave omitted items untouched. All-zero rounds require explicit complete confirmation. Previous quantities are labelled with date/person and never prefilled into a new count. Positive previous quantities sort above unknown and zero. No expiry-based zeroing or purchasing integration.

Round counting metadata preserves staff ID, assignment version/scope keys, manually entered keys, complete flag, start time and manually timed seconds. Zero seconds displays 'not timed', not zero workload. Timer pauses when hidden or switching staff/review; it is an approximate optional timer, not attendance tracking. Old rounds remain readable; immutable round keys and pending retry are unchanged. Test only on local mocked endpoint when saving UI rounds.

Validation: test-sync.mjs; test-counting.mjs; package_stock.py. Browser on isolated localhost mock: switching staff preserves separate drafts, partial count readback, full Thoi round 37 including implied zeros, all-zero Vo round 20, latest-positive ordering, 390px mobile layout with no document overflow. No production inventory rows written by these tests.
